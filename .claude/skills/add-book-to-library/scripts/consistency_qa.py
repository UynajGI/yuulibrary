#!/usr/bin/env python3
"""Cross-chapter consistency QA for translated books.

Runs AFTER translation completes. Scans the whole book for:
  - Term drift: glossary.json terms not honored in the translated text
  - Person/point-of-view inconsistency: 我/他/她 mixed across chapters
  - Tense drift: 了/着/过 inconsistent aspect markers (Chinese translation)

Uses the 'cheap' LLM tier for cost efficiency — this is judgment work, not
creative translation. Output is a markdown report written to
<book_dir>/.translate_state/consistency_report.md.

Usage (normally auto-invoked at the end of translate_book):
    python3 consistency_qa.py <book_dir>
"""
import asyncio
import json
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
from llm_config import get_tier  # noqa: E402

# ── Mechanical checks (no LLM) ────────────────────────────────────────────


def check_term_drift(book_dir: str, glossary: dict) -> list:
    """Find glossary terms whose Chinese translation doesn't appear in any chapter.

    Returns list of dicts: {term, expected_zh, found_variants, chapters}.
    Scans translated chapters for the English term (should be gone) or for
    the expected Chinese (should be present).
    """
    issues = []
    files = sorted(
        f for f in os.listdir(book_dir)
        if f.endswith(".md") and f != "_index.md" and not f.startswith(".")
    )
    for en, expected_zh in glossary.items():
        found_zh = False
        found_en_residual = []
        for fname in files:
            path = os.path.join(book_dir, fname)
            try:
                with open(path, encoding="utf-8") as f:
                    content = f.read()
            except OSError:
                continue
            if expected_zh in content:
                found_zh = True
            # English term still present (not in code/math context) = drift
            if en in content:
                # Check it's not inside a math block or code fence
                for m in re.finditer(re.escape(en), content):
                    start = max(0, m.start() - 50)
                    ctx = content[start:m.end() + 50]
                    if "$$" not in ctx and "```" not in ctx:
                        found_en_residual.append(fname)
                        break
        if not found_zh:
            issues.append({
                "type": "term_missing",
                "term": en,
                "expected_zh": expected_zh,
                "detail": f"术语「{en}」的指定译法「{expected_zh}」在译文中未出现",
            })
        if found_en_residual:
            issues.append({
                "type": "term_residual_en",
                "term": en,
                "expected_zh": expected_zh,
                "chapters": list(set(found_en_residual)),
                "detail": f"术语「{en}」英文原文仍出现在 {len(set(found_en_residual))} 章",
            })
    return issues


def check_pov_drift(book_dir: str) -> list:
    """Detect inconsistent first/third person across chapters.

    Counts 我 vs 他/她 per chapter. A chapter mixing >30% 我 with predominant
    他/她 (or vice versa) suggests POV drift.
    """
    issues = []
    files = sorted(
        f for f in os.listdir(book_dir)
        if f.endswith(".md") and f != "_index.md" and not f.startswith(".")
    )
    pov_data = []
    for fname in files:
        path = os.path.join(book_dir, fname)
        try:
            with open(path, encoding="utf-8") as f:
                content = f.read()
        except OSError:
            continue
        first = len(re.findall(r"我", content))
        third = len(re.findall(r"[他她]", content))
        total = first + third
        if total < 10:  # too few pronouns to judge
            continue
        first_ratio = first / total
        pov_data.append((fname, first, third, first_ratio))
        # Flag chapters where POV is borderline mixed
        if 0.2 < first_ratio < 0.8 and first > 20 and third > 20:
            issues.append({
                "type": "pov_mixed",
                "chapter": fname,
                "first_person": first,
                "third_person": third,
                "detail": f"人称混用：我({first}) vs 他/她({third})",
            })

    # Cross-chapter: if most chapters are 3rd-person but a few are 1st-person
    if len(pov_data) >= 3:
        first_person_chapters = [d for d in pov_data if d[3] > 0.7]
        third_person_chapters = [d for d in pov_data if d[3] < 0.3]
        if first_person_chapters and third_person_chapters and len(first_person_chapters) < len(third_person_chapters):
            issues.append({
                "type": "pov_drift",
                "detail": f"多数章节为第三人称，但 {len(first_person_chapters)} 章以第一人称为主："
                          + ", ".join(d[0] for d in first_person_chapters[:5]),
            })
    return issues


# ── LLM-based deep consistency check (cheap tier) ─────────────────────────

CONSISTENCY_PROMPT = """你是跨章节一致性审校员。下面是一本译著的各章节摘要。检查以下一致性问题：

1. **术语漂移**：同一英文术语在不同章是否译法不一
2. **人称视角**：叙事人称（我/他/她）是否跨章一致
3. **时态/体貌**：了/着/过 等体貌标记是否风格统一
4. **角色名**：同一人物名字是否前后一致

只报告确实存在的不一致，不要泛泛而谈。每条问题格式：
### 问题类型
- 章节：ch0X
- 描述：具体问题
- 建议：修复方向

如果没有问题，输出「✓ 无一致性问题」。"""


async def run_consistency_qa(book_dir: str, glossary: dict) -> str:
    """Run mechanical + LLM consistency checks. Returns markdown report string.

    Empty string = no issues found.
    """
    api_key, base_url, model, max_tokens = get_tier("cheap")

    # ── Phase 1: mechanical checks (no API cost) ─────────────────────────
    mech_issues = []
    mech_issues.extend(check_term_drift(book_dir, glossary))
    mech_issues.extend(check_pov_drift(book_dir))

    report_parts = []
    if mech_issues:
        report_parts.append("## 机械检测（术语/人称）\n")
        for issue in mech_issues:
            report_parts.append(f"- **{issue['type']}**: {issue['detail']}\n")

    # ── Phase 2: LLM deep check (sample chapter summaries) ───────────────
    if not api_key:
        # No API key — return mechanical results only
        if report_parts:
            return "".join(report_parts)
        return ""

    files = sorted(
        f for f in os.listdir(book_dir)
        if f.endswith(".md") and f != "_index.md" and not f.startswith(".")
    )
    # Build per-chapter summaries (first 500 chars of each, excluding front matter)
    chapter_summaries = []
    for fname in files:
        path = os.path.join(book_dir, fname)
        try:
            with open(path, encoding="utf-8") as f:
                content = f.read()
        except OSError:
            continue
        # Strip front matter
        if content.startswith("---"):
            end = content.find("\n---", 3)
            if end != -1:
                content = content[end + 4:]
        # First 500 chars as summary
        summary = content.strip()[:500]
        chapter_summaries.append(f"### {fname}\n{summary}\n")

    if not chapter_summaries:
        return "".join(report_parts) if report_parts else ""

    combined = "\n".join(chapter_summaries[:20])  # cap at 20 chapters for context
    if glossary:
        glossary_str = "\n".join(f"- {en} → {zh}" for en, zh in list(glossary.items())[:50])
        combined = f"## 术语表\n{glossary_str}\n\n## 章节摘要\n{combined}"

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        resp = await client.chat.completions.create(
            model=model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": CONSISTENCY_PROMPT},
                {"role": "user", "content": combined},
            ],
            extra_body={"thinking": {"type": "disabled"}},
        )
        llm_report = resp.choices[0].message.content.strip()
        if llm_report and "无一致性问题" not in llm_report:
            report_parts.append("\n## LLM 深度审校\n\n")
            report_parts.append(llm_report + "\n")
    except Exception as e:
        report_parts.append(f"\n## LLM 审校失败\n\n{e}\n")

    return "".join(report_parts) if report_parts else ""


# ── CLI entry (for standalone use) ────────────────────────────────────────
async def _main(book_dir: str):
    glossary_path = os.path.join(book_dir, "glossary.json")
    glossary = {}
    if os.path.exists(glossary_path):
        with open(glossary_path, encoding="utf-8") as f:
            glossary = json.load(f)
    print(f"扫描 {book_dir} 一致性（术语表 {len(glossary)} 条）...")
    report = await run_consistency_qa(book_dir, glossary)
    if report:
        report_path = os.path.join(book_dir, ".translate_state", "consistency_report.md")
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"报告 → {report_path}")
    else:
        print("✓ 无一致性问题")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: consistency_qa.py <book_dir>", file=sys.stderr)
        sys.exit(1)
    sys.exit(asyncio.run(_main(sys.argv[1])))
