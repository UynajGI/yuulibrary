#!/usr/bin/env python3
"""Convert cross-references in book chapters to clickable markdown links.

Pure regex, no LLM. Deterministic and idempotent (safe to re-run).

Transformations (body text only, never in headings/front matter):
    第N章        → [第N章](ch0N.md)       # zero-padded to 2 digits
    第N.M节      → [第N.M节](ch0N.md)     # uses chapter number for link
    例N.M        → [例N.M](ch0N.md)
    Chapter N    → [第N章](ch0N.md)       # residual English

Skipped:
    - Lines starting with # (headings don't get linkified)
    - Front matter (between --- fences)
    - Already-linkified references: [第N章](...) or [text](ch0N.md)
    - Semantic references (如前所述 / 后面会讨论) — no number to map

Usage:
    python3 convert_xrefs.py <book_dir>          # all ch*.md
    python3 convert_xrefs.py <file.md>            # single file
    python3 convert_xrefs.py <dir> --dry-run      # preview without writing
"""
import argparse
import glob
import os
import re
import sys


def chapter_filename(n: int) -> str:
    """第3章 → ch03.md, 第12章 → ch12.md."""
    return f"ch{n:02d}.md"


# ── Regex patterns ────────────────────────────────────────────────────────
# Each captures the chapter number; link target derived from it.
# Negative lookahead (?!\() avoids double-linkifying [第N章]( already done.

# 第N章 → [第N章](ch0N.md)  — but NOT 第N.M章 (handled by section rule)
RE_CHAPTER = re.compile(r"(?<!\[)第(\d+)章(?!\]?\()(?!\.\d)")

# 第N.M节 → [第N.M节](ch0N.md)  — section points to its chapter file
RE_SECTION = re.compile(r"(?<!\[)第(\d+)\.(\d+)节(?!\]?\()")

# 例N.M → [例N.M](ch0N.md)
RE_EXAMPLE = re.compile(r"(?<!\[)例(\d+)\.(\d+)(?!\]?\()")

# Chapter N (residual English) → [第N章](ch0N.md)
RE_CHAPTER_EN = re.compile(r"(?<!\[)Chapter\s+(\d+)(?!\]?\()")


def convert_line(line: str, stats: dict) -> str:
    """Convert cross-references in a single line. Mutates stats counters."""
    # Skip headings — chapter titles don't get linkified
    if line.lstrip().startswith("#"):
        return line
    original = line

    def repl_chapter(m):
        n = int(m.group(1))
        stats["chapter"] += 1
        return f"[第{n}章]({chapter_filename(n)})"

    def repl_section(m):
        n, sec = int(m.group(1)), m.group(2)
        stats["section"] += 1
        return f"[第{n}.{sec}节]({chapter_filename(n)})"

    def repl_example(m):
        n, ex = int(m.group(1)), m.group(2)
        stats["example"] += 1
        return f"[例{n}.{ex}]({chapter_filename(n)})"

    def repl_chapter_en(m):
        n = int(m.group(1))
        stats["chapter_en"] += 1
        return f"[第{n}章]({chapter_filename(n)})"

    line = RE_CHAPTER.sub(repl_chapter, line)
    line = RE_SECTION.sub(repl_section, line)
    line = RE_EXAMPLE.sub(repl_example, line)
    line = RE_CHAPTER_EN.sub(repl_chapter_en, line)

    return line


def split_front_matter(content: str):
    """Split into (front_matter_with_fences, body)."""
    if not content.startswith("---"):
        return "", content
    end = content.find("\n---", 3)
    if end < 0:
        return "", content
    # +1 to include the newline after closing ---
    split = end + 4  # len("\n---") = 4, but we want past it
    # Find the newline after closing ---
    nl = content.find("\n", end + 4)
    if nl < 0:
        return content, ""
    return content[: nl + 1], content[nl + 1 :]


def convert_file(path: str, dry_run: bool = False) -> dict:
    """Convert cross-references in one file. Returns stats dict."""
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    fm, body = split_front_matter(content)
    stats = {"chapter": 0, "section": 0, "example": 0, "chapter_en": 0, "file": path}

    new_lines = []
    for line in body.split("\n"):
        new_lines.append(convert_line(line, stats))

    new_body = "\n".join(new_lines)
    stats["total"] = stats["chapter"] + stats["section"] + stats["example"] + stats["chapter_en"]

    if stats["total"] > 0 and not dry_run:
        with open(path, "w", encoding="utf-8") as f:
            f.write(fm + new_body)

    return stats


def main():
    ap = argparse.ArgumentParser(description="Convert cross-references to clickable links.")
    ap.add_argument("target", help="book directory or single .md file")
    ap.add_argument("--dry-run", action="store_true", help="preview without writing")
    args = ap.parse_args()

    if os.path.isfile(args.target):
        files = [args.target]
    elif os.path.isdir(args.target):
        files = sorted(glob.glob(os.path.join(args.target, "ch*.md")))
        if not files:
            # paper: single _index.md or any .md
            files = sorted(glob.glob(os.path.join(args.target, "*.md")))
            files = [f for f in files if not f.endswith("_index.md")]
    else:
        print(f"Error: {args.target} is not a file or directory", file=sys.stderr)
        return 1

    if not files:
        print(f"No .md files found in {args.target}", file=sys.stderr)
        return 1

    total_stats = {"chapter": 0, "section": 0, "example": 0, "chapter_en": 0, "total": 0}
    for f in files:
        s = convert_file(f, dry_run=args.dry_run)
        if s["total"] > 0:
            tag = "[dry-run] " if args.dry_run else ""
            print(f"  {tag}{os.path.basename(f)}: {s['total']} refs "
                  f"(章{s['chapter']} 节{s['section']} 例{s['example']} en{s['chapter_en']})")
        for k in total_stats:
            total_stats[k] += s.get(k, 0)

    mode = "dry-run preview" if args.dry_run else "converted"
    print(f"\n{mode}: {total_stats['total']} cross-references in {len(files)} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
