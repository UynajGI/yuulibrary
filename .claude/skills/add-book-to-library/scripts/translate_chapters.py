#!/usr/bin/env python3
"""Translate English markdown chapters to Chinese using LLM + glossary-driven consistency.

Two-phase workflow:
  Phase 1 (seed, serial): translate first N chapters → build initial glossary
  Phase 2 (rest, parallel): translate remaining chapters WITH glossary → collect new terms

Each chapter is validated after translation (via validate_book.py's validate_file).
If [E]-level errors or too many residual English words → retry with feedback (max N times).

Usage:
    python3 translate_chapters.py <book_dir> [--concurrency 4] [--seed-chapters 2] [--retry 2]
    python3 translate_chapters.py <file.md>   # single file, no glossary

Requires .env with DEEPSEEK_API_KEY (or OPENAI_API_KEY) for the API key.
Model/base_url/pipeline toggles come from config.yaml (optional; falls back
to DEEPSEEK_MODEL / DEEPSEEK_BASE_URL env vars when absent).
"""
import argparse
import asyncio
import glob
import json
import os
import re
import sys

# ── Path setup: import validate_book from sibling directory ──────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
from validate_book import validate_file, ERR  # noqa: E402
from convert_xrefs import convert_file as convert_xrefs_file  # noqa: E402
from llm_config import get_tier, get_pipeline_config, get_segment_config, has_config  # noqa: E402

# ── Config ───────────────────────────────────────────────────────────────
# Tiered model config from config.yaml (+ .env for keys). Falls back to legacy
# single-model behavior when config.yaml is absent.
_STRONG_KEY, _STRONG_URL, _STRONG_MODEL, _STRONG_MAX = get_tier("strong")
_PIPELINE = get_pipeline_config()
_SEGMENT = get_segment_config()

# Legacy module-level names (used by _translate_once and callers).
API_KEY = _STRONG_KEY
BASE_URL = _STRONG_URL
MODEL = _STRONG_MODEL
MAX_TOKENS = _STRONG_MAX

GLOSSARY_MARKER = re.compile(r"<!--\s*glossary:\s*(.+?)\s*=\s*(.+?)\s*-->")
RESIDUAL_EN_RE = re.compile(r"[A-Z][a-z]{10,}")  # long English words = missed translation


# ── System prompt (fixed rules, no cross-refs) ───────────────────────────
SYSTEM_PROMPT = """你是专业翻译。将英文 markdown 正文翻译为中文，严格遵守：

1. LaTeX 公式 $...$、$$...$$、\\(...\\)、\\[...\\] 和 \\tag{} 100% 原样不动
2. 人名保留英文：Haoyu Guan, Wenxian Zhang（不要翻译人名）
3. 机构名保留英文原文：Key Laboratory of Artificial Micro- and Nano-structures...（不要翻译机构名）
4. 书名译后附英文：《漫步华尔街》（A Random Walk Down Wall Street）
5. 图表编号保留原格式：图1.1、表2.3
6. Chapter N / Section N.M 忠实翻译为"第N章"/"第N.M节"（不加 markdown 链接）
7. 元素模板转换（翻译时同步完成）：
   - 引用 —Author, *Book* → {{< callout type="quote" >}}引用内容\\nAuthor, Book{{< /callout >}}
   - 来源/出处行 → {{< caption >}}来源：...{{< /caption >}}
   - 图注 图N.N 描述 → {{< caption >}}图N.N 描述{{< /caption >}}
8. 🔴 图片引用 100% 保留原样：![](images/xxx.webp) 这一行必须原样输出，不要删除、合并或翻译路径
9. 不要修改 front matter（--- 之间的内容）
10. 🔴 每个段落只输出一次中文译文，严禁保留英文原文。正确示例：输入 "Hello world" → 输出 "你好世界"。错误示例：输入 "Hello world" → 输出 "Hello world\n\n你好世界"（严禁这种双语输出）
11. 输出完整译文，不要加任何解释或注释"""


def build_user_prompt(body: str, glossary: dict, is_seed: bool) -> str:
    """Build user message with optional glossary context."""
    parts = [body]

    if glossary and not is_seed:
        terms = "\n".join(f"- {en} → {zh}" for en, zh in sorted(glossary.items()))
        parts.append(
            f"\n---\n已有术语表（前面章节已引入，用指定译名，**不要再附英文**）：\n{terms}\n\n"
            "遇到新术语（不在上表里），首次出现时附英文原文，如：绝热定理（adiabatic theorem）。\n"
            "翻译完成后，在译文最末尾用以下格式列出本章新增的术语（每行一个）：\n"
            "<!-- glossary: English Term = 中文译名 -->"
        )
    elif is_seed:
        parts.append(
            "\n---\n这是全书前几章。专业术语首次出现时附英文原文，如：有效市场假说（Efficient Market Hypothesis）。\n"
            "翻译完成后，在译文最末尾用以下格式列出本章所有专业术语（每行一个）：\n"
            "<!-- glossary: English Term = 中文译名 -->"
        )
    return "\n".join(parts)


def split_front_matter(content: str):
    """Split into (front_matter_str, body_str)."""
    if not content.startswith("---"):
        return "", content
    end = content.find("\n---", 3)
    if end < 0:
        return "", content
    nl = content.find("\n", end + 4)
    if nl < 0:
        return content, ""
    return content[: nl + 1], content[nl + 1 :]


def extract_glossary(text: str):
    """Extract <!-- glossary: EN = ZH --> lines, return (cleaned_text, {EN: ZH})."""
    terms = {}
    for m in GLOSSARY_MARKER.finditer(text):
        en, zh = m.group(1).strip(), m.group(2).strip()
        if en and zh:
            terms[en] = zh
    cleaned = GLOSSARY_MARKER.sub("", text).rstrip() + "\n"
    return cleaned, terms


def check_quality(path: str, source_body: str = "", is_seed: bool = False):
    """Run validate_file + residual English + untranslated block + truncation check.

    When is_seed=True, skip the residual-English-word check — seed chapters
    intentionally keep English terms in parentheses (e.g. 操作概率理论（Operational
    Probabilistic Theories, OPT）), which would otherwise trigger false retries.
    """
    issues = validate_file(path)
    errors = [msg for level, msg in issues if level == ERR]

    with open(path, encoding="utf-8") as f:
        content = f.read()
    _, body = split_front_matter(content)
    residual = len(RESIDUAL_EN_RE.findall(body))  # body only, not front matter

    problems = []
    if errors:
        problems.extend(f"[E] {e}" for e in errors)
    # Seed chapters intentionally retain English terms — don't flag them.
    # Non-seed chapters should have terms translated; >8 long English words
    # suggests a missed paragraph.
    if not is_seed and residual > 8:
        problems.append(f"遗漏英文长词 {residual} 处（>8，可能未翻译完整段落）")

    # Untranslated block detection: 3+ consecutive non-empty, non-heading,
    # non-math lines that are pure English → likely a skipped section.
    untranslated = find_untranslated_blocks(body)
    if untranslated:
        locations = [f"§{h}" for h in untranslated[:3]]
        problems.append(f"可能漏翻 {len(untranslated)} 块：{', '.join(locations)}")

    # Truncation detection: Chinese is typically 30-50% shorter than English,
    # but the presence of LaTeX (kept verbatim) pushes the ratio up. A ratio
    # below 0.4 is suspicious and below 0.2 is almost certainly truncated.
    if source_body:
        ratio = len(body) / max(len(source_body), 1)
        if ratio < 0.2:
            problems.append(f"译文长度仅为源文的 {ratio:.0%}，严重截断")
        elif ratio < 0.4:
            problems.append(f"译文长度仅为源文的 {ratio:.0%}，可能部分截断")

        # Paragraph-count alignment: more precise than char ratio for
        # formula-heavy chapters (LaTeX inflates source length but paragraphs
        # should map 1:1). A translation with <80% of source paragraphs
        # likely dropped content.
        src_paras = _count_content_paragraphs(source_body)
        dst_paras = _count_content_paragraphs(body)
        if src_paras >= 5 and dst_paras < src_paras * 0.8:
            problems.append(f"段落数不对齐（源 {src_paras} 段，译 {dst_paras} 段）")

    return len(problems) == 0, "; ".join(problems) if problems else "ok"


def _count_content_paragraphs(body: str) -> int:
    """Count substantive paragraphs (excludes pure-math and heading-only lines).

    A paragraph is a non-empty block separated by blank lines. We exclude
    blocks that are purely display math ($$...$$), pure headings, or pure
    image references — these survive translation verbatim and shouldn't
    inflate the count.
    """
    count = 0
    for block in re.split(r"\n\s*\n", body):
        block = block.strip()
        if not block:
            continue
        # Skip pure headings
        if re.match(r"^#{1,6}\s+", block) and "\n" not in block.strip():
            continue
        # Skip pure display math blocks
        if re.match(r"^\$\$.*\$\$$", block, re.DOTALL) and "$$" not in block[2:-2]:
            continue
        # Skip pure image references
        if re.match(r"^!\[.*\]\(.*\)$", block):
            continue
        count += 1
    return count


def find_untranslated_blocks(body: str):
    """Detect 3+ consecutive non-empty lines of pure English (likely untranslated).

    Returns list of preceding ##/### heading texts for each block, or ['<body start>'].
    """
    lines = body.split("\n")
    blocks = []
    current_block = []
    last_heading = ""
    prev_heading = ""

    for line in lines:
        stripped = line.strip()
        # Track headings for location context
        hm = re.match(r"^(#{1,3})\s+(.+)", stripped)
        if hm:
            prev_heading = hm.group(2).strip()[:40]
            if current_block and len(current_block) >= 3:
                blocks.append(last_heading or prev_heading)
            current_block = []
            last_heading = prev_heading
            continue

        if not stripped:
            if current_block and len(current_block) >= 3:
                blocks.append(last_heading or prev_heading)
            current_block = []
            continue

        # Skip math-only lines, front matter markers
        if re.match(r"^[\$\s\\\{\}_\^\[\]\d+\-*/=<>\(\),.]+$", stripped):
            continue

        # Skip lines that already have CJK
        if re.search(r"[一-鿿]", stripped):
            if current_block and len(current_block) >= 3:
                blocks.append(last_heading or prev_heading)
            current_block = []
            continue

        # Count English content: needs at least 5 alpha chars to count as "English line"
        if len(re.findall(r"[a-zA-Z]", stripped)) >= 5:
            current_block.append(stripped)
        else:
            if current_block and len(current_block) >= 3:
                blocks.append(last_heading or prev_heading)
            current_block = []

    if current_block and len(current_block) >= 3:
        blocks.append(last_heading or prev_heading)

    return blocks


def is_chinese_text(body: str) -> bool:
    """Detect if body is predominantly Chinese (skip LLM translation).

    Heuristic: count CJK chars vs ASCII letters. If CJK > 30% of (CJK+letters),
    treat as Chinese — don't send to LLM (would corrupt already-Chinese content).
    """
    cjk = len(re.findall(r"[一-鿿]", body))
    letters = len(re.findall(r"[a-zA-Z]", body))
    total = cjk + letters
    if total == 0:
        return False
    return cjk / total > 0.3


# ── Reference section isolation ──────────────────────────────────────────
REF_HEADING_RE = re.compile(r"^##\s+(References|参考文献|Bibliography|文献)", re.MULTILINE | re.IGNORECASE)
NEXT_H2_RE = re.compile(r"^##\s+", re.MULTILINE)
# Bare reference entries at end of file: [N] Author, Title, Journal ...
# MinerU sometimes fails to extract the ## References heading, leaving raw
# [1] Author... lines at the very end with no heading at all.
BARE_REF_RE = re.compile(r"^\[\d+\]\s+")


def isolate_references(body: str):
    """Split body into (before_refs, ref_section, after_refs).

    Only the References section itself (## References / ## 参考文献 / ## Bibliography)
    is kept as-is — from its heading up to the next ## heading (or end of body).
    Authors, journal names, and titles stay in the original language.

    Any section after References (e.g. ## Appendix, ## Acknowledgements) is
    returned in after_refs so it gets translated normally.

    Fallback: if no ## References heading is found, detects bare [N] Author...
    lines at the end of the file (MinerU sometimes drops the heading).

    Returns (before_refs, ref_section_or_empty, after_refs_or_empty).
    """
    m = REF_HEADING_RE.search(body)
    if m:
        ref_start = m.start()
        # Find the next ## heading after the References heading (not ### or deeper)
        next_h2 = NEXT_H2_RE.search(body, m.end())
        ref_end = next_h2.start() if next_h2 else len(body)
        return body[:ref_start], body[ref_start:ref_end], body[ref_end:]

    # ── Fallback: no heading → detect bare [N] references at end of file ──
    lines = body.split("\n")
    # Scan backwards for consecutive bare reference lines
    ref_start_line = None
    for i in range(len(lines) - 1, -1, -1):
        stripped = lines[i].strip()
        if not stripped:
            continue
        if BARE_REF_RE.match(stripped):
            ref_start_line = i
        else:
            break

    if ref_start_line is not None and ref_start_line < len(lines) - 1:
        before = "\n".join(lines[:ref_start_line])
        ref_section = "## References\n\n" + "\n".join(lines[ref_start_line:])
        return before, ref_section, ""

    return body, "", ""


# ── Echo stripping (deterministic safeguard against LLM echoing English originals) ─
# Some models (DeepSeek) occasionally output the original English paragraph
# followed by its Chinese translation, instead of replacing it. Detect and strip.
_EN_SENTENCE_RE = re.compile(r"[A-Z][a-z].*[.?!]")  # English sentence (capital letter + period)
_CJK_RE = re.compile(r"[一-鿿㐀-䶿]")  # CJK unified ideographs


def strip_echoed_english(text: str) -> tuple[str, int]:
    """Remove English paragraphs that are followed by a Chinese translation paragraph.

    Pattern detected: English-only para, blank line, Chinese para with similar meaning.
    The English para is the echoed original — remove it, keep the Chinese translation.

    Returns (cleaned_text, num_stripped).
    """
    paras = re.split(r"\n\n+", text)
    if len(paras) < 2:
        return text, 0

    stripped_count = 0
    result = []
    i = 0
    while i < len(paras):
        para = paras[i].strip()
        # Check if current paragraph is English-only (no CJK) and has at least
        # one English sentence (capital letter + period pattern)
        is_english_only = (
            para
            and not _CJK_RE.search(para)
            and bool(_EN_SENTENCE_RE.search(para))
        )
        # Check next paragraph for Chinese content
        next_is_chinese = False
        if i + 1 < len(paras):
            next_para = paras[i + 1].strip()
            next_is_chinese = bool(next_para and _CJK_RE.search(next_para))

        if is_english_only and next_is_chinese:
            # This is likely an echoed English original — skip it
            stripped_count += 1
            i += 1
            continue

        result.append(paras[i])
        i += 1

    return "\n\n".join(result), stripped_count


# ── Image restoration (deterministic safeguard against LLM dropping images) ─
IMG_RE = re.compile(r"!\[\]\(images/[a-f0-9]+\.webp\)")
CAPTION_FIG_RE = re.compile(r"图\s*(\d+)")

def restore_images(source: str, translated: str) -> tuple[str, int]:
    """Restore image references dropped by the LLM during translation.

    Strategy: build figure number → image refs map from source (images preceding
    a caption belong to that figure), then for each translated caption missing
    its images, reinsert them just before the caption line. Also catches images
    with no associated caption (insert at matched anchor text).

    Returns (corrected_text, num_restored).
    """
    src_lines = source.split("\n")
    dst_lines = translated.split("\n")

    # 1. Map fig number → [image refs] from source (images accumulate until a caption)
    fig_imgs = {}
    current_imgs = []
    for line in src_lines:
        imgs = IMG_RE.findall(line)
        if imgs:
            current_imgs.extend(imgs)
        if "{{< caption" in line:
            m = CAPTION_FIG_RE.search(line)
            if m:
                num = m.group(1)
                if num not in fig_imgs and current_imgs:
                    fig_imgs[num] = current_imgs[:]
            current_imgs = []

    # 2. Walk translated lines; before each caption, ensure its images exist
    result = []
    restored = 0
    for line in dst_lines:
        if "{{< caption" in line:
            m = CAPTION_FIG_RE.search(line)
            if m:
                num = m.group(1)
                imgs = fig_imgs.get(num, [])
                # check preceding lines for existing images
                lookback = "\n".join(result[-len(imgs) - 2 :]) if imgs else ""
                missing = [im for im in imgs if im not in lookback]
                if missing:
                    result.append("")
                    for im in missing:
                        result.append(im)
                    restored += len(missing)
        result.append(line)

    return "\n".join(result), restored


# ── LLM call ─────────────────────────────────────────────────────────────
async def _translate_part(client, body: str, glossary: dict, is_seed: bool, feedback: str = "",
                          on_chunk=None, skip_chunks=None, prev_results=None) -> str:
    """Translate one contiguous block, handling chunking + per-chunk truncation retry.

    For long texts (> CHUNK_THRESHOLD chars), splits into chunks at $$ boundaries
    and translates sequentially, concatenating results. This prevents truncation
    when max_tokens is exhausted mid-translation.

    If on_chunk is provided, it's called as on_chunk(index, total, translated_so_far)
    after each chunk completes — allowing the caller to checkpoint progress to disk
    so a crash/interruption doesn't lose all work.

    If skip_chunks is provided (a set of chunk indices), those chunks are skipped
    (assumed already translated) and their text is taken from prev_results instead.
    This enables resuming a partial translation without retranslating completed chunks.
    """
    skip_chunks = skip_chunks or set()
    prev_results = prev_results or []

    if len(body) <= CHUNK_THRESHOLD:
        if 0 in skip_chunks and prev_results:
            result = prev_results[0]
        else:
            result = await _translate_once(client, body, glossary, is_seed, feedback)
        if on_chunk:
            on_chunk(0, 1, result)
        return result

    chunks = split_into_chunks(body, CHUNK_THRESHOLD)
    results = []
    prev_context = ""
    for i, chunk in enumerate(chunks):
        # Resume: skip already-translated chunks (take from prev_results)
        if i in skip_chunks and i < len(prev_results):
            chunk_translated = prev_results[i]
            # Restore rolling context from the skipped chunk
            prev_context = chunk_translated[-200:] if len(chunk_translated) > 200 else chunk_translated
            results.append(chunk_translated)
            if on_chunk:
                on_chunk(i + 1, len(chunks), "\n\n".join(results))
            continue

        chunk_feedback = feedback if i == 0 else ""
        context_note = ""
        if prev_context:
            context_note = f"上文已翻译内容结尾：...{prev_context}。请保持术语和指代一致。"
        chunk_translated = await _translate_once(client, chunk, glossary, is_seed, chunk_feedback, context_note)

        # Per-chunk truncation detection: if output is suspiciously short,
        # re-split into smaller pieces and translate individually.
        ratio = len(chunk_translated) / max(len(chunk), 1)
        if ratio < 0.3 and len(chunk) > 2000:
            # Likely truncated — split into halves and retry
            sub_chunks = split_into_chunks(chunk, max(len(chunk) // 2, 1500))
            sub_results = []
            for sc in sub_chunks:
                sub_translated = await _translate_once(client, sc, glossary, is_seed, "")
                sub_results.append(sub_translated)
            chunk_translated = "\n\n".join(sub_results)

        results.append(chunk_translated)
        prev_context = chunk_translated[-200:] if len(chunk_translated) > 200 else chunk_translated

        # Checkpoint: write partial progress after each chunk
        if on_chunk:
            on_chunk(i + 1, len(chunks), "\n\n".join(results))

    return "\n\n".join(results)


async def translate_text(client, body: str, glossary: dict, is_seed: bool, feedback: str = "",
                         on_chunk=None, skip_chunks=None, prev_results=None) -> str:
    """Call LLM to translate body text. Returns translated text (may include glossary markers).

    References section (## References / ## 参考文献 / ## Bibliography) is isolated
    and kept as-is — bibliographic entries stay in the original language. Any
    section after References (typically ## Appendix, ## Acknowledgements) is
    translated normally.

    If on_chunk is provided, it's called after each chunk is translated, allowing
    incremental writes to disk for crash recovery.

    If skip_chunks/prev_results are provided, those chunks are taken from
    prev_results instead of calling the LLM — enabling partial-translation resume.
    """
    # Isolate references — never translate bibliographic entries
    before, ref_section, after = isolate_references(body)

    translated = await _translate_part(client, before, glossary, is_seed, feedback, on_chunk,
                                       skip_chunks, prev_results)
    if after:
        translated = translated.rstrip() + "\n\n" + await _translate_part(client, after, glossary, is_seed, "")

    # Splice references back in (heading translated, entries kept original)
    if ref_section:
        translated = translated.rstrip() + "\n\n" + translate_ref_heading(ref_section)

    # Deterministic safeguard 1: strip echoed English originals (LLM outputs
    # English para + Chinese para instead of replacing the English with Chinese).
    translated, echo_stripped = strip_echoed_english(translated)
    if echo_stripped > 0:
        print(f"    🧹 删除 {echo_stripped} 段被回显的英文原文")

    # Deterministic safeguard 2: restore any image refs the LLM dropped.
    # Compare against before+after (references section typically has no figures).
    combined_src = before + after
    src_imgs = IMG_RE.findall(combined_src)
    dst_imgs = IMG_RE.findall(translated)
    if len(src_imgs) > len(dst_imgs):
        translated, n = restore_images(combined_src, translated)
        if n > 0:
            print(f"    🔧 恢复 {n} 张丢失的图片引用（源文 {len(src_imgs)} 张，译文原仅 {len(dst_imgs)} 张）")

    return translated


def translate_ref_heading(ref_section: str) -> str:
    """Translate only the heading of references section, keep entries as-is."""
    ref_section = re.sub(
        r"^##\s+(References|Bibliography)\b",
        "## 参考文献",
        ref_section,
        flags=re.IGNORECASE,
    )
    return ref_section


CHUNK_THRESHOLD = _SEGMENT["max_chars_per_batch"]  # chars — split above this. 4500 chars input → ~3500 chars output (Chinese
                         # is 30% shorter, but LaTeX stays verbatim) → ~6000 total tokens including
                         # system prompt (~500) + glossary (~200). Well within MAX_TOKENS=8192 margin.


def split_into_chunks(text: str, max_size: int) -> list:
    """Split text into chunks at safe boundaries.

    Priority of split points (safest first):
      1. After $$...$$ blocks (display math)
      2. After ## headings (section boundaries)
      3. After paragraph breaks (\\n\\n)
      4. After sentence-ending punctuation (。.！！？？)

    Never splits inside a $$...$$ block.
    """
    if len(text) <= max_size:
        return [text]

    chunks = []
    remaining = text

    while len(remaining) > max_size:
        # Find the best split point within the first max_size chars
        search_region = remaining[:max_size]

        # Try splitting after the last $$ block boundary (must be even $$ count)
        split_pos = -1
        # Find all $$ positions and pick the last one that gives even count
        dd_positions = [m.start() for m in re.finditer(r"\$\$", search_region)]
        for dd_pos in reversed(dd_positions):
            if dd_pos < max_size // 4:
                break
            # $$ count up to and including this one must be even (closed block)
            if (search_region[:dd_pos].count("$$") + 1) % 2 == 0:
                split_pos = dd_pos + 2
                break

        # Try splitting after the last ## heading
        if split_pos < 0:
            headings = list(re.finditer(r"^##\s+.+$", search_region, re.MULTILINE))
            if len(headings) > 1:
                split_pos = headings[-1].start()

        # Try splitting at the last paragraph break
        if split_pos < 0:
            split_pos = search_region.rfind("\n\n")
            if split_pos < max_size // 4:
                split_pos = -1

        # Try splitting at the last sentence end
        if split_pos < 0:
            for punct in ["。", "．", "！", "？", ". ", "! ", "? "]:
                pos = search_region.rfind(punct)
                if pos > max_size // 4:
                    split_pos = pos + len(punct)
                    break

        # Hard fallback: cut at max_size.
        # NOTE: if a single $$...$$ block exceeds max_size, this will cut mid-block,
        # producing unbalanced delimiters in the chunk sent to the LLM. This is a
        # known limitation — oversized math blocks are rare (most are <500 chars).
        # The system prompt tells the LLM to preserve math verbatim, so content
        # survives on rejoin, but the chunk itself may render incorrectly.
        if split_pos < 0:
            # If we're inside an unclosed $$ block, extend to its close if possible
            unclosed = remaining[:max_size].count("$$") % 2
            if unclosed:
                close_pos = remaining.find("$$", max_size)
                if close_pos != -1 and close_pos < max_size * 2:
                    split_pos = close_pos + 2
            if split_pos < 0:
                split_pos = max_size

        chunks.append(remaining[:split_pos])
        remaining = remaining[split_pos:].lstrip()

    if remaining:
        chunks.append(remaining)

    return chunks


async def _translate_once(client, body: str, glossary: dict, is_seed: bool, feedback: str = "", context_note: str = "") -> str:
    """Single LLM call to translate body text."""
    system = SYSTEM_PROMPT
    if context_note:
        system += f"\n\n## 上下文\n{context_note}"
    messages = [{"role": "system", "content": system}]
    user_msg = build_user_prompt(body, glossary, is_seed)
    if feedback:
        user_msg += f"\n\n---\n⚠ 上次翻译有以下问题，请修正：\n{feedback}\n请重新翻译完整内容。"
    messages.append({"role": "user", "content": user_msg})

    resp = await client.chat.completions.create(
        model=MODEL,
        messages=messages,
        max_tokens=MAX_TOKENS,
        extra_body={"thinking": {"type": "disabled"}},
    )
    return resp.choices[0].message.content or ""


def translated_path(path, in_place=False):
    """翻译输出路径。in_place=True 时原地写（book：文件本身就是内容）；
    in_place=False 时写 .zh.md（paper：源文件是 MinerU 提取，不碰）"""
    if in_place:
        return path
    base, ext = os.path.splitext(path)
    return base + ".zh" + ext


PARTIAL_RE = re.compile(r"<!--\s*translate-partial:\s*(\d+)/(\d+)\s*chunks\s*-->")


def detect_partial(content: str):
    """Check if a file contains a partial-translation marker.

    Returns (chunks_done, chunks_total) if marker found and incomplete, else None.
    A complete marker (done == total) means translation finished but the marker
    wasn't cleaned up — caller should strip it.
    """
    m = PARTIAL_RE.search(content)
    if not m:
        return None
    done, total = int(m.group(1)), int(m.group(2))
    return (done, total)


# ── Per-chapter translation with retry ───────────────────────────────────
async def translate_chapter(client, path: str, glossary: dict, is_seed: bool, max_retry: int, sem: asyncio.Semaphore, in_place: bool = True):
    """Translate one chapter with validation + retry. Returns (status, retries, issues, glossary).

    Supports partial-translation resume: if the output file has a
    <!-- translate-partial: N/M --> marker with N < M, the already-translated
    N chunks are reused and only the remaining M-N chunks are translated.
    """
    async with sem:
        fname = os.path.basename(path)
        out_path = translated_path(path, in_place)
        with open(path, encoding="utf-8") as f:
            content = f.read()
        fm, body = split_front_matter(content)

        # Check for partial translation in the OUTPUT file (from a prior interrupted run)
        skip_chunks = set()
        prev_results = []
        partial_info = None
        if os.path.exists(out_path):
            with open(out_path, encoding="utf-8") as f:
                out_content = f.read()
            partial_info = detect_partial(out_content)
            if partial_info:
                done, total = partial_info
                if done >= total:
                    # Marker stale (done == total) — translation actually completed,
                    # just strip the marker and re-validate
                    cleaned = PARTIAL_RE.sub("", out_content).rstrip() + "\n"
                    with open(out_path, "w", encoding="utf-8") as f:
                        f.write(cleaned)
                    # Fall through to is_chinese_text check below
                else:
                    # Partial translation — extract prev_results and compute skip_chunks
                    # Remove the partial marker and front matter to get translated body
                    out_fm, out_body = split_front_matter(out_content)
                    out_body = PARTIAL_RE.sub("", out_body).rstrip()
                    prev_results = out_body.split("\n\n")
                    skip_chunks = set(range(done))
                    print(f"    [{fname}] 续跑：跳过 {done}/{total} chunks")

        # 中文文件跳过翻译，只跑格式化（交叉引用 regex 转换）
        # BUT: if we have skip_chunks (partial resume), don't skip even if text is Chinese
        if not skip_chunks and is_chinese_text(body):
            if out_path != path:
                import shutil
                shutil.copy2(path, out_path)
            stats = convert_xrefs_file(out_path)
            n = stats.get("total", 0)
            return ("skipped", 0, f"已是中文，跳过翻译，转换 {n} 处交叉引用", {})

        retries = 0
        feedback = ""
        for attempt in range(max_retry + 1):
            try:
                # on_chunk: write partial translation to disk after each chunk,
                # so a crash/interruption doesn't lose all work on long chapters.
                def on_chunk(done, total, text):
                    with open(out_path, "w", encoding="utf-8") as f:
                        f.write(fm + text + f"\n<!-- translate-partial: {done}/{total} chunks -->\n")
                    print(f"\r    [{fname}] {done}/{total} chunks", end="", flush=True)

                # On retry (attempt > 0), don't skip chunks — retranslate everything
                # to give the LLM a chance to fix issues flagged by check_quality.
                attempt_skip = skip_chunks if attempt == 0 else set()
                attempt_prev = prev_results if attempt == 0 else []

                translated = await translate_text(client, body, glossary, is_seed, feedback,
                                                  on_chunk=on_chunk,
                                                  skip_chunks=attempt_skip,
                                                  prev_results=attempt_prev)
            except Exception as e:
                return ("error", attempt, f"API error: {e}")

            # Strip glossary markers, collect terms
            translated, new_terms = extract_glossary(translated)

            # Post-translation cleanup: fix $$ delimiter corruption from LLM output
            # (e.g. $_{1}$$(...) adjacent $ creates false $$ wrapping Chinese prose)
            try:
                from clean_markdown import fix_math_delimiters
                translated, _ = fix_math_delimiters(translated)
            except ImportError:
                pass  # clean_markdown not available — skip

            # Write to output file (never touch source)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(fm + translated)

            # Validate the output file (pass source body for truncation check)
            passed, issues = check_quality(out_path, body, is_seed=is_seed)
            if passed:
                return ("ok", attempt, issues, new_terms)

            feedback = issues
            retries = attempt + 1
            # After first attempt fails, don't reuse partial results — retranslate all
            skip_chunks = set()
            prev_results = []

        return ("manual", retries, feedback, {})


# ── Glossary merge with conflict detection ───────────────────────────────
def merge_glossary(existing: dict, new_terms: dict, source: str, conflicts: list):
    """Merge new terms into glossary. Record conflicts on translation mismatch."""
    for en, zh in new_terms.items():
        if en in existing and existing[en] != zh:
            conflicts.append({"term": en, "existing": existing[en], "new": zh, "source": source})
        else:
            existing[en] = zh


# ── Progress tracking (checkpoint/resume) ────────────────────────────────
def _sha256_file(path: str) -> str:
    import hashlib
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


class ProgressTracker:
    """Per-book translation progress for checkpoint/resume.

    State lives at <book_dir>/.translate_state/progress.json. Each chapter
    records its status, source hash, attempt count, and harvested glossary
    terms. On re-run, chapters with status='ok' and unchanged source are
    skipped; failed chapters are retried.

    A corrupted state file degrades gracefully to a full re-translate.
    """

    def __init__(self, book_dir: str, fresh: bool = False):
        self.state_dir = os.path.join(book_dir, ".translate_state")
        self.progress_path = os.path.join(self.state_dir, "progress.json")
        self.glossary_path = os.path.join(book_dir, "glossary.json")
        self._lock = asyncio.Lock()
        self._data = {}  # {fname: {status, source_hash, attempts, glossary_terms}}
        self._glossary = {}
        self._loaded = False

        if fresh:
            return  # caller will treat as empty

        self._load()

    def _load(self):
        """Load progress.json and glossary.json. Degrade to empty on corruption."""
        try:
            if os.path.exists(self.progress_path):
                with open(self.progress_path, encoding="utf-8") as f:
                    self._data = json.load(f)
                self._loaded = True
        except (json.JSONDecodeError, OSError):
            self._data = {}  # corrupt — start fresh
            self._loaded = False

        # Load existing glossary so resume can re-inject terms into the live dict
        try:
            if os.path.exists(self.glossary_path):
                with open(self.glossary_path, encoding="utf-8") as f:
                    self._glossary = json.load(f)
        except (json.JSONDecodeError, OSError):
            self._glossary = {}

        # Rebuild glossary from per-chapter records if glossary.json was missing
        if not self._glossary and self._data:
            for rec in self._data.values():
                self._glossary.update(rec.get("glossary_terms", {}))

    @property
    def glossary(self) -> dict:
        return dict(self._glossary)

    def should_skip(self, path: str) -> bool:
        """True if chapter was translated ok and source is unchanged."""
        fname = os.path.basename(path)
        rec = self._data.get(fname)
        if not rec or rec.get("status") != "ok":
            return False
        try:
            return rec.get("source_hash") == _sha256_file(path)
        except OSError:
            return False

    def status_of(self, path: str) -> str:
        return self._data.get(os.path.basename(path), {}).get("status", "pending")

    async def record(self, path: str, status: str, attempts: int, glossary_terms: dict):
        """Record a chapter's result and persist immediately."""
        fname = os.path.basename(path)
        async with self._lock:
            try:
                source_hash = _sha256_file(path)
            except OSError:
                source_hash = ""
            self._data[fname] = {
                "status": status,
                "source_hash": source_hash,
                "attempts": attempts,
                "glossary_terms": glossary_terms,
            }
            # Merge terms into the live glossary
            self._glossary.update(glossary_terms)
            self._persist()

    def _persist(self):
        """Write progress.json + glossary.json atomically (caller holds lock)."""
        os.makedirs(self.state_dir, exist_ok=True)
        tmp = self.progress_path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(self._data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self.progress_path)

        with open(self.glossary_path, "w", encoding="utf-8") as f:
            json.dump(self._glossary, f, ensure_ascii=False, indent=2)

    def summary(self) -> dict:
        """Return {ok, skipped_seed, manual, error, pending} counts."""
        counts = {"ok": 0, "manual": 0, "error": 0, "pending": 0, "skipped_chinese": 0}
        for rec in self._data.values():
            s = rec.get("status", "pending")
            if s in counts:
                counts[s] += 1
            elif s == "skipped":
                counts["skipped_chinese"] += 1
        return counts


# ── Main workflow ────────────────────────────────────────────────────────
async def translate_book(book_dir: str, concurrency: int, seed_count: int, max_retry: int,
                         fresh: bool = False, run_qa: bool = True):
    from openai import AsyncOpenAI

    if not API_KEY:
        print("Error: DEEPSEEK_API_KEY not set. Check .env", file=sys.stderr)
        return 1

    client = AsyncOpenAI(api_key=API_KEY, base_url=BASE_URL)

    # Collect chapter files: ch*.md + preface.md (if exists), excluding _index.md
    files = sorted(glob.glob(os.path.join(book_dir, "ch*.md")))
    # Also include preface.md if it exists and isn't already in the list
    preface = os.path.join(book_dir, "preface.md")
    if os.path.exists(preface) and preface not in files:
        files.insert(0, preface)
    if not files:
        # fallback: any .md except _index.md
        files = sorted(f for f in glob.glob(os.path.join(book_dir, "*.md")) if not f.endswith("_index.md"))
    if not files:
        print(f"No .md files found in {book_dir}", file=sys.stderr)
        return 1

    total = len(files)
    seeds = files[:seed_count]
    rest = files[seed_count:]
    tracker = ProgressTracker(book_dir, fresh=fresh)
    glossary = tracker.glossary  # resume: pick up terms from prior run
    conflicts = []
    results = []

    # Partition: skip already-ok chapters, translate the rest
    skipped_files = [f for f in files if tracker.should_skip(f)]
    todo_files = [f for f in files if not tracker.should_skip(f)]
    if skipped_files:
        print(f"断点续跑：跳过 {len(skipped_files)} 章已完成（共 {total} 章）")
        for f in skipped_files:
            fname = os.path.basename(f)
            results.append((fname, tracker.status_of(f) or "ok", 0, "已缓存"))
    if not todo_files:
        print("所有章节已翻译完成，无需重跑。")
        glossary = tracker.glossary
    else:
        # Re-partition todo into seeds/rest for the active run
        active_seeds = [f for f in todo_files if f in seeds][:seed_count]
        active_rest = [f for f in todo_files if f not in active_seeds]
        # If all seeds were skipped, promote earliest todo chapters as seeds.
        # Promoted chapters are NOT true seeds — the glossary already exists from
        # the prior run, so is_seed must be False (seed=True skips glossary context).
        promoted = False
        if not active_seeds and active_rest:
            active_seeds = active_rest[:min(seed_count, len(active_rest))]
            active_rest = active_rest[len(active_seeds):]
            promoted = True

        print(f"翻译 {len(todo_files)} 章 | 种子 {len(active_seeds)} 串行 + {len(active_rest)} 并行(并发={concurrency})")
        if promoted:
            print(f"  (种子已在上次完成，提升 {len(active_seeds)} 章串行补译，复用已有术语表)")
        print(f"Provider: {BASE_URL} | Model: {MODEL}\n")

        # ── Phase 1: seed chapters (serial) ──────────────────────────────
        # is_seed only when there's no glossary yet (true first run).
        # Promoted chapters on resume use the existing glossary → is_seed=False.
        seed_is_seed = not bool(glossary)
        for i, f in enumerate(active_seeds):
            fname = os.path.basename(f)
            print(f"[{i+1}/{len(todo_files)}] {fname} 翻译中...", end="", flush=True)
            status, retries, issues, new_terms = await translate_chapter(
                client, f, glossary, is_seed=seed_is_seed, max_retry=max_retry,
                sem=asyncio.Semaphore(1)
            )
            merge_glossary(glossary, new_terms, fname, conflicts)
            await tracker.record(f, status, retries, new_terms)
            tag = "✓" if status == "ok" else ("⏭" if status == "skipped" else ("⚠" if status == "manual" else "✗"))
            retry_info = f" (重试{retries}次)" if retries else ""
            print(f"\r{tag} [{i+1}/{len(todo_files)}] {fname}{retry_info} — {issues}")
            results.append((fname, status, retries, issues))

        # ── Phase 2: remaining chapters (parallel) ───────────────────────
        if active_rest:
            sem = asyncio.Semaphore(concurrency)
            offset = len(active_seeds) + len(skipped_files)

            async def run_one(idx, fpath):
                fname = os.path.basename(fpath)
                # snapshot glossary at task creation time (seed terms)
                gl = dict(glossary)
                status, retries, issues, new_terms = await translate_chapter(
                    client, fpath, gl, is_seed=False, max_retry=max_retry, sem=sem
                )
                merge_glossary(glossary, new_terms, fname, conflicts)
                await tracker.record(fpath, status, retries, new_terms)
                tag = "✓" if status == "ok" else ("⏭" if status == "skipped" else ("⚠" if status == "manual" else "✗"))
                retry_info = f" (重试{retries}次)" if retries else ""
                print(f"{tag} [{offset+idx+1}/{total}] {fname}{retry_info} — {issues}")
                return (fname, status, retries, issues)

            tasks = [run_one(i, f) for i, f in enumerate(active_rest)]
            parallel_results = await asyncio.gather(*tasks, return_exceptions=True)
            for r in parallel_results:
                if isinstance(r, Exception):
                    results.append(("unknown", "error", 0, str(r)))
                else:
                    results.append(r)

    # ── Report ───────────────────────────────────────────────────────────
    cached = len(skipped_files)
    ok = sum(1 for _, s, _, _ in results if s == "ok")
    skipped = sum(1 for _, s, _, _ in results if s == "skipped")
    manual = sum(1 for _, s, _, _ in results if s == "manual")
    errors = sum(1 for _, s, _, _ in results if s == "error")

    print(f"\n{'='*60}")
    print(f"翻译完成：{ok} 通过(含 {cached} 缓存) / {skipped} 跳过(中文) / {manual} 需人工 / {errors} 错误（共 {total} 章）")
    print(f"术语表：{len(glossary)} 条 → {tracker.glossary_path}")
    if conflicts:
        print(f"\n⚠ 术语冲突 {len(conflicts)} 处：")
        for c in conflicts:
            print(f"  {c['term']}: {c['existing']} vs {c['new']} (in {c['source']})")

    if manual:
        print("\n需人工检查的章节：")
        for fname, status, _, issues in results:
            if status == "manual":
                print(f"  {fname}: {issues}")

    # ── Consistency QA (optional, after translation) ─────────────────────
    if run_qa and _PIPELINE.get("consistency_qa") and not errors:
        try:
            from consistency_qa import run_consistency_qa
            print("\n跨章一致性扫描...")
            qa_issues = await run_consistency_qa(book_dir, glossary)
            if qa_issues:
                report_path = os.path.join(book_dir, ".translate_state", "consistency_report.md")
                os.makedirs(os.path.dirname(report_path), exist_ok=True)
                with open(report_path, "w", encoding="utf-8") as f:
                    f.write(qa_issues)
                print(f"  发现 {qa_issues.count('###')} 类问题 → {report_path}")
            else:
                print("  ✓ 无一致性问题")
        except ImportError:
            pass  # consistency_qa.py not available — skip silently
        except Exception as e:
            print(f"  ⚠ 一致性扫描失败: {e}", file=sys.stderr)

    return 1 if errors else 0


async def translate_single(path: str, max_retry: int):
    """Single-file mode (for papers). No glossary."""
    from openai import AsyncOpenAI

    if not API_KEY:
        print("Error: DEEPSEEK_API_KEY not set.", file=sys.stderr)
        return 1

    client = AsyncOpenAI(api_key=API_KEY, base_url=BASE_URL)
    fname = os.path.basename(path)
    print(f"翻译 {fname}...")

    status, retries, issues, _ = await translate_chapter(
        client, path, {}, is_seed=False, max_retry=max_retry, sem=asyncio.Semaphore(1), in_place=False
    )
    tag = "✓" if status == "ok" else ("⏭" if status == "skipped" else ("⚠" if status == "manual" else "✗"))
    out = translated_path(path)
    print(f"{tag} {fname} → {os.path.basename(out)} (重试{retries}次) — {issues}")
    return 1 if status == "error" else 0


def _show_status(book_dir: str):
    """Print translation progress without translating."""
    tracker = ProgressTracker(book_dir)
    if not tracker._loaded:
        print("无翻译状态文件（.translate_state/progress.json）。")
        return 0
    files = sorted(glob.glob(os.path.join(book_dir, "ch*.md")))
    if not files:
        files = sorted(f for f in glob.glob(os.path.join(book_dir, "*.md")) if not f.endswith("_index.md"))
    counts = {"ok": 0, "skipped": 0, "manual": 0, "error": 0, "pending": 0}
    print(f"{'章节':<30} {'状态':<10} {'重试':<6} 说明")
    print("-" * 70)
    for f in files:
        fname = os.path.basename(f)
        if tracker.should_skip(f):
            status, retries, issues = "ok", 0, "已缓存(源未变)"
        else:
            rec = tracker._data.get(fname, {})
            status = rec.get("status", "pending")
            retries = rec.get("attempts", 0)
            issues = "" if status == "pending" else "需重跑"
        counts[status] = counts.get(status, 0) + 1
        print(f"{fname:<30} {status:<10} {retries:<6} {issues}")
    print("-" * 70)
    print(f"总计：{counts.get('ok',0)} 通过 / {counts.get('skipped',0)} 中文跳过 / "
          f"{counts.get('manual',0)} 需人工 / {counts.get('error',0)} 错误 / "
          f"{counts.get('pending',0)} 待翻译（共 {len(files)} 章）")
    return 0


def main():
    ap = argparse.ArgumentParser(description="Translate markdown chapters to Chinese.")
    ap.add_argument("target", help="book directory or single .md file")
    ap.add_argument("--concurrency", type=int, default=4, help="parallel chapters (default 4)")
    ap.add_argument("--seed-chapters", type=int, default=2, help="serial seed chapters (default 2)")
    ap.add_argument("--retry", type=int, default=2, help="max retries per chapter (default 2)")
    ap.add_argument("--fresh", action="store_true", help="ignore state, re-translate all chapters")
    ap.add_argument("--status", action="store_true", help="show progress without translating")
    ap.add_argument("--no-qa", action="store_true", help="skip cross-chapter consistency QA")
    args = ap.parse_args()

    if os.path.isfile(args.target):
        return asyncio.run(translate_single(args.target, args.retry))
    elif os.path.isdir(args.target):
        if args.status:
            return _show_status(args.target)
        return asyncio.run(translate_book(
            args.target, args.concurrency, args.seed_chapters, args.retry,
            fresh=args.fresh, run_qa=not args.no_qa,
        ))
    else:
        print(f"Error: {args.target} not found", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
