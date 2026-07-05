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

Requires .env with DEEPSEEK_API_KEY (or OPENAI_API_KEY). Reads from script's parent's parent's .env.
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

# ── Config ───────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(SCRIPT_DIR, "..", "..", "..", ".env"))
except ImportError:
    pass  # dotenv not installed, rely on env vars being set

API_KEY = os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("OPENAI_API_KEY", "")
BASE_URL = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-flash")
MAX_TOKENS = 8192

GLOSSARY_MARKER = re.compile(r"<!--\s*glossary:\s*(.+?)\s*=\s*(.+?)\s*-->")
RESIDUAL_EN_RE = re.compile(r"[A-Z][a-z]{10,}")  # long English words = missed translation


# ── System prompt (fixed rules, no cross-refs) ───────────────────────────
SYSTEM_PROMPT = """你是专业翻译。将英文 markdown 正文翻译为中文，严格遵守：

1. LaTeX 公式 $...$ 和 $$...$$ 和 \\tag{} 100% 原样不动
2. 人名保留英文；书名译后附英文：《漫步华尔街》（A Random Walk Down Wall Street）
3. 图表编号保留原格式：图1.1、表2.3
4. Chapter N / Section N.M 忠实翻译为"第N章"/"第N.M节"（不加 markdown 链接）
5. 元素模板转换（翻译时同步完成）：
   - 引用 —Author, *Book* → {{< callout type="quote" >}}引用内容\\nAuthor, Book{{< /callout >}}
   - 来源/出处行 → {{< caption >}}来源：...{{< /caption >}}
   - 图注 图N.N 描述 → {{< caption >}}图N.N 描述{{< /caption >}}
6. 不要修改 front matter（--- 之间的内容）
7. 输出完整译文，不要加任何解释或注释"""


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


def check_quality(path: str):
    """Run validate_file + residual English check. Returns (passed, issues_summary)."""
    issues = validate_file(path)
    errors = [msg for level, msg in issues if level == ERR]

    with open(path, encoding="utf-8") as f:
        content = f.read()
    residual = len(RESIDUAL_EN_RE.findall(content))

    problems = []
    if errors:
        problems.extend(f"[E] {e}" for e in errors)
    if residual > 8:
        problems.append(f"遗漏英文长词 {residual} 处（>8，可能未翻译完整段落）")

    return len(problems) == 0, "; ".join(problems) if problems else "ok"


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


# ── LLM call ─────────────────────────────────────────────────────────────
async def translate_text(client, body: str, glossary: dict, is_seed: bool, feedback: str = "") -> str:
    """Call LLM to translate body text. Returns translated text (may include glossary markers)."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
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


# ── Per-chapter translation with retry ───────────────────────────────────
async def translate_chapter(client, path: str, glossary: dict, is_seed: bool, max_retry: int, sem: asyncio.Semaphore):
    """Translate one chapter with validation + retry. Returns (status, retries, issues, glossary)."""
    async with sem:
        fname = os.path.basename(path)
        with open(path, encoding="utf-8") as f:
            content = f.read()
        fm, body = split_front_matter(content)

        # 中文文件跳过翻译，只跑格式化（交叉引用 regex 转换）
        if is_chinese_text(body):
            stats = convert_xrefs_file(path)
            n = stats.get("total", 0)
            return ("skipped", 0, f"已是中文，跳过翻译，转换 {n} 处交叉引用", {})

        retries = 0
        feedback = ""
        for attempt in range(max_retry + 1):
            try:
                translated = await translate_text(client, body, glossary, is_seed, feedback)
            except Exception as e:
                return ("error", attempt, f"API error: {e}")

            # Strip glossary markers, collect terms
            translated, new_terms = extract_glossary(translated)

            # Write back
            with open(path, "w", encoding="utf-8") as f:
                f.write(fm + translated)

            # Validate
            passed, issues = check_quality(path)
            if passed:
                return ("ok", attempt, issues, new_terms)

            feedback = issues
            retries = attempt + 1

        return ("manual", retries, feedback, {})


# ── Glossary merge with conflict detection ───────────────────────────────
def merge_glossary(existing: dict, new_terms: dict, source: str, conflicts: list):
    """Merge new terms into glossary. Record conflicts on translation mismatch."""
    for en, zh in new_terms.items():
        if en in existing and existing[en] != zh:
            conflicts.append({"term": en, "existing": existing[en], "new": zh, "source": source})
        else:
            existing[en] = zh


# ── Main workflow ────────────────────────────────────────────────────────
async def translate_book(book_dir: str, concurrency: int, seed_count: int, max_retry: int):
    from openai import AsyncOpenAI

    if not API_KEY:
        print("Error: DEEPSEEK_API_KEY not set. Check .env", file=sys.stderr)
        return 1

    client = AsyncOpenAI(api_key=API_KEY, base_url=BASE_URL)

    # Collect chapter files
    files = sorted(glob.glob(os.path.join(book_dir, "ch*.md")))
    if not files:
        # fallback: any .md except _index.md
        files = sorted(f for f in glob.glob(os.path.join(book_dir, "*.md")) if not f.endswith("_index.md"))
    if not files:
        print(f"No .md files found in {book_dir}", file=sys.stderr)
        return 1

    total = len(files)
    seeds = files[:seed_count]
    rest = files[seed_count:]
    glossary = {}
    conflicts = []
    results = []

    print(f"翻译 {total} 章 | 种子 {len(seeds)} 章串行 + {len(rest)} 章并行(并发={concurrency})")
    print(f"Provider: {BASE_URL} | Model: {MODEL}\n")

    # ── Phase 1: seed chapters (serial) ──────────────────────────────────
    for i, f in enumerate(seeds):
        fname = os.path.basename(f)
        print(f"[{i+1}/{total}] {fname} 翻译中...", end="", flush=True)
        status, retries, issues, new_terms = await translate_chapter(
            client, f, glossary, is_seed=True, max_retry=max_retry,
            sem=asyncio.Semaphore(1)
        )
        merge_glossary(glossary, new_terms, fname, conflicts)
        tag = "✓" if status == "ok" else ("⏭" if status == "skipped" else ("⚠" if status == "manual" else "✗"))
        retry_info = f" (重试{retries}次)" if retries else ""
        print(f"\r{tag} [{i+1}/{total}] {fname}{retry_info} — {issues}")
        results.append((fname, status, retries, issues))

    # Save initial glossary
    glossary_path = os.path.join(book_dir, "glossary.json")
    with open(glossary_path, "w", encoding="utf-8") as f:
        json.dump(glossary, f, ensure_ascii=False, indent=2)

    # ── Phase 2: remaining chapters (parallel) ───────────────────────────
    if rest:
        sem = asyncio.Semaphore(concurrency)
        offset = len(seeds)

        async def run_one(idx, fpath):
            fname = os.path.basename(fpath)
            # snapshot glossary at task creation time (seed terms)
            gl = dict(glossary)
            status, retries, issues, new_terms = await translate_chapter(
                client, fpath, gl, is_seed=False, max_retry=max_retry, sem=sem
            )
            merge_glossary(glossary, new_terms, fname, conflicts)
            tag = "✓" if status == "ok" else ("⏭" if status == "skipped" else ("⚠" if status == "manual" else "✗"))
            retry_info = f" (重试{retries}次)" if retries else ""
            print(f"{tag} [{offset+idx+1}/{total}] {fname}{retry_info} — {issues}")
            return (fname, status, retries, issues)

        tasks = [run_one(i, f) for i, f in enumerate(rest)]
        parallel_results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in parallel_results:
            if isinstance(r, Exception):
                results.append(("unknown", "error", 0, str(r)))
            else:
                results.append(r)

    # Save final glossary
    with open(glossary_path, "w", encoding="utf-8") as f:
        json.dump(glossary, f, ensure_ascii=False, indent=2)

    # ── Report ───────────────────────────────────────────────────────────
    ok = sum(1 for _, s, _, _ in results if s == "ok")
    skipped = sum(1 for _, s, _, _ in results if s == "skipped")
    manual = sum(1 for _, s, _, _ in results if s == "manual")
    errors = sum(1 for _, s, _, _ in results if s == "error")

    print(f"\n{'='*60}")
    print(f"翻译完成：{ok} 通过 / {skipped} 跳过(中文) / {manual} 需人工 / {errors} 错误（共 {total} 章）")
    print(f"术语表：{len(glossary)} 条 → {glossary_path}")
    if conflicts:
        print(f"\n⚠ 术语冲突 {len(conflicts)} 处：")
        for c in conflicts:
            print(f"  {c['term']}: {c['existing']} vs {c['new']} (in {c['source']})")

    if manual:
        print("\n需人工检查的章节：")
        for fname, status, _, issues in results:
            if status == "manual":
                print(f"  {fname}: {issues}")

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
        client, path, {}, is_seed=False, max_retry=max_retry, sem=asyncio.Semaphore(1)
    )
    tag = "✓" if status == "ok" else ("⏭" if status == "skipped" else ("⚠" if status == "manual" else "✗"))
    print(f"{tag} {fname} (重试{retries}次) — {issues}")
    return 1 if status == "error" else 0


def main():
    ap = argparse.ArgumentParser(description="Translate markdown chapters to Chinese.")
    ap.add_argument("target", help="book directory or single .md file")
    ap.add_argument("--concurrency", type=int, default=4, help="parallel chapters (default 4)")
    ap.add_argument("--seed-chapters", type=int, default=2, help="serial seed chapters (default 2)")
    ap.add_argument("--retry", type=int, default=2, help="max retries per chapter (default 2)")
    args = ap.parse_args()

    if os.path.isfile(args.target):
        return asyncio.run(translate_single(args.target, args.retry))
    elif os.path.isdir(args.target):
        return asyncio.run(translate_book(args.target, args.concurrency, args.seed_chapters, args.retry))
    else:
        print(f"Error: {args.target} not found", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
