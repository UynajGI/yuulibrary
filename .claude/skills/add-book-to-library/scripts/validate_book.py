#!/usr/bin/env python3
"""Mechanical validation for book markdown quality. Called by lefthook."""

import glob
import os
import re
import sys


def validate_file(path):
    issues = []

    with open(path) as f:
        content = f.read()
        lines = content.splitlines()

    # 1. Images inside $$ math blocks
    in_math = False
    for i, line in enumerate(lines, 1):
        if line.strip() == "$$":
            in_math = not in_math
        elif in_math and line.strip().startswith("!["):
            issues.append(f"L{i}: IMAGE in $$ math block")

    # 2. Odd $$ count
    ds_count = content.count("$$")
    if ds_count % 2 != 0:
        issues.append(f"Unmatched $$ pairs: {ds_count} (odd)")

    # 3. Empty $$ blocks: $$\n$$ with nothing between except optional whitespace on same lines
    empty = len(re.findall(r"\$\$[ \t]*\n[ \t]*\$\$", content))
    if empty:
        issues.append(f"{empty} empty $$ blocks")

    # 4. Compound math blocks (blank line between two formulas inside $$)
    compound = 0
    for m in re.finditer(r"\$\$[ \t]*\n(.*?)\n[ \t]*\$\$", content, re.DOTALL):
        inner = m.group(1)
        if "\n\n" in inner:
            compound += 1
    if compound:
        issues.append(f"{compound} compound $$ blocks (blank line inside)")

    # 5. .html links (should be .md in source)
    html_links = re.findall(r"\]\(\./[^)]*\.html\)", content)
    if html_links:
        issues.append(f"{len(html_links)} .html links (use .md)")

    # 6. Naked captions — only short lines (≤30 chars), not inline refs like "图2.1描述了一个..."
    naked = re.findall(r"^(图\d+\.\d+|表\d+\.\d+)[^\n]{0,30}$", content, re.MULTILINE)
    if naked:
        issues.append(f'{len(naked)} naked captions (wrap in <p class="caption">)')

    # 7. <details> blocks remaining
    details = content.count("<details>")
    if details:
        issues.append(f"{details} <details> blocks remaining")

    return issues


def main():
    book_dir = sys.argv[1] if len(sys.argv) > 1 else "docs/books/"
    files = glob.glob(f"{book_dir}/**/ch*.md", recursive=True)

    total = 0
    for path in sorted(files):
        issues = validate_file(path)
        if issues:
            total += len(issues)
            short = os.path.relpath(path, start=os.path.commonprefix([path, book_dir]))
            print(f"{short}:")
            for iss in issues:
                print(f"  {iss}")

    if total:
        print(f"\n{total} issues found")
        sys.exit(1)
    else:
        print("OK")


if __name__ == "__main__":
    main()
