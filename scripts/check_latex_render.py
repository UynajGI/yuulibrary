#!/usr/bin/env python3
"""lefthook pre-commit: 检查 markdown 里的 LaTeX 渲染陷阱。

Check 1: 表格行内 inline math（$...$ 或 \\(...\\)）里的裸 |
         — 与 markdown 表格的 | 分隔符冲突，必须用 \\lvert/\\rvert/\\vert。
Check 2: display math 块（$$...$$ 或 \\[...\\]）里行首的 + / -
         — 被 markdown 当成列表项，必须放一行或用 \\;+\\;。

用法（由 lefthook.yml 调用）：
    python3 scripts/check_latex_render.py

读 git diff --cached --name-only 拿暂存的 .md 文件，只检查这些。
"""
import os
import re
import subprocess
import sys


def main():
    root = os.getcwd()
    out = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
        capture_output=True,
        text=True,
    ).stdout

    errors = []
    for name in out.splitlines():
        if not name.endswith(".md"):
            continue
        path = os.path.join(root, name)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            lines = f.read().split("\n")

        # Build a set of line indices that are inside $$...$$ display math blocks.
        # Bra-ket notation like |\phi\rangle at line start is NOT a table row.
        in_display_set = set()
        in_display = False
        for i, line in enumerate(lines, 1):
            if line.strip().startswith("$$"):
                in_display = not in_display
                in_display_set.add(i)  # also skip the $$ delimiter lines themselves
            elif in_display:
                in_display_set.add(i)

        # Check 1: 表格行内 inline math 里的裸 |
        for i, line in enumerate(lines, 1):
            if i in in_display_set:
                continue
            if not line.strip().startswith("|"):
                continue
            for m in re.finditer(r"\$([^$]+)\$|\\\(([^)]+)\\\)", line):
                latex = m.group(1) or m.group(2) or ""
                # 先删合法的 \vert / \lvert / \rvert / \mid 命令，再找裸 |
                # （lookbehind 里 \l/\m/\r 在 Python 3.12 报 bad escape，用此策略避开）
                stripped = re.sub(r"\\[lr]?(vert|mid)\b", "", latex)
                if "|" in stripped:
                    errors.append(
                        f"{path}:{i}: raw | in table LaTeX — use \\lvert/\\rvert/\\vert"
                    )

        # Check 2: display math 块里行首的 + / -
        in_display = False
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if stripped.startswith("$$"):
                in_display = not in_display
                continue
            if stripped.startswith("\\["):
                in_display = True
                continue
            if stripped.startswith("\\]"):
                in_display = False
                continue
            if in_display and (stripped.startswith("+ ") or stripped.startswith("- ")):
                # 允许 += -= 赋值，只标记单独的 + / - 后接空格再接 LaTeX
                if not stripped.startswith("+=") and not stripped.startswith("-="):
                    errors.append(
                        f"{path}:{i}: + or - at line start inside display math "
                        f"— put on one line or use \\;+\\;"
                    )

    if errors:
        print("LATEX RENDER ERRORS:")
        for e in errors:
            print(f"  {e}")
        sys.exit(1)
    print("LaTeX render OK")


if __name__ == "__main__":
    main()
