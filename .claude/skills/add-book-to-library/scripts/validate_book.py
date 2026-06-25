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
        issues.append(f'{len(naked)} naked captions (wrap in {{< caption >}})')

    # 7. <details> blocks remaining
    details = content.count("<details>")
    if details:
        issues.append(f"{details} <details> blocks remaining")

    # 8. Pseudocode backslash commands (npm pseudocode.js uses bare: state not \state)
    bad_cmds = re.findall(
        r"\\(?:state|for|if|while|repeat|until|return|endfor|endif|endwhile|endprocedure|endfunction|procedure|function|label)\\b",
        content,
    )
    if bad_cmds:
        issues.append(f"{len(bad_cmds)} backslash pseudocode commands (use bare: state, not \\\\state)")

    # === 标题层级检查（排除代码块内的 # 注释）===

    # 先把代码块内容移除，避免 Python 注释 # 被误判为标题
    # 正确的配对剥离：```lang 开 → ``` 关（non-greedy 在连续 ```python 时会配对错误）
    def strip_fences(text):
        lines = text.split("\n")
        out = []
        in_fence = False
        for line in lines:
            s = line.strip()
            if s.startswith("```") and not in_fence:
                in_fence = True
                continue
            elif s == "```" and in_fence:
                in_fence = False
                continue
            elif s.startswith("~~~") and not in_fence:
                in_fence = True
                continue
            elif s == "~~~" and in_fence:
                in_fence = False
                continue
            elif not in_fence:
                out.append(line)
        return "\n".join(out)

    codeless = strip_fences(content)

    headings = re.findall(r"^(#{1,6})\s+(.+?)\s*$", codeless, re.MULTILINE)
    levels = [len(h[0]) for h in headings]
    texts = [h[1] for h in headings]
    h1_texts = [texts[i] for i in range(len(levels)) if levels[i] == 1]

    # 9. 多 H1（章节文件应只有 1 个 H1）
    if len(h1_texts) > 1:
        preview = "; ".join(h1_texts[:4])
        issues.append(f"{len(h1_texts)} H1 headings (should be 1): {preview}")

    # 10. H1 格式不一致（应为「第N章 标题」，无冒号/多余空格）
    for h1 in h1_texts:
        # 允许 preface/notations/algorithms/index_term 等非章节文件
        if re.match(r"^(前言|符号|算法|索引|致谢|目录|附录)", h1):
            continue
        # 规范：第N章 标题（N 是数字，后一个空格，无冒号）
        if re.match(r"^第\s*\d+\s*章\s+\S", h1):
            # 检查「第」和数字间有无空格、章后是否冒号
            if re.match(r"^第 \d+ 章", h1):
                issues.append(f'H1 多余空格: "# {h1}" (应为 "第N章" 无空格)')
            elif "：" in h1 or ":" in h1.split("章")[-1]:
                issues.append(f'H1 含冒号: "# {h1}" (应为 "第N章 标题" 无冒号)')
        elif not re.match(r"^(第\s*\d+\s*章|#\s*$)", h1) and not h1.startswith("#"):
            # 不符合章节格式又不是特殊页面 → 可能是 MinerU 误标
            if len(h1_texts) > 1:
                pass  # 已在 #9 报告
            else:
                issues.append(f'H1 格式异常: "# {h1}" (应为 "第N章 标题")')

    # 11. 标题层级跳跃（H1→H3 缺 H2，H2→H4 缺 H3）
    for i in range(1, len(levels)):
        jump = levels[i] - levels[i - 1]
        if jump > 1:
            issues.append(
                f"heading skip: H{levels[i-1]}→H{levels[i]} "
                f'("{texts[i-1][:20]}" → "{texts[i][:20]}")'
            )

    # 12. 空/乱码标题（单个标点、孤立章号无标题）
    for t in texts:
        stripped = t.strip()
        # 单字母（A-Z）是术语表字母索引，合法，跳过
        if len(stripped) == 1 and stripped.isalpha():
            continue
        if len(stripped) <= 1 and stripped:
            issues.append(f"empty/garbage heading: '# {t}'")
        elif re.match(r"^第\s*章\s*$", stripped):  # 「第 章」缺数字
            issues.append(f"missing chapter number: '# {t}'")

    # === 语义检查（代码块已剥离的内容用 codeless） ===

    # 13. $$ 块内中文正文——排除 \text/\mathrm 内合法中文后，检查句号/长文本
    chinese_body = 0
    for m in re.finditer(r"\$\$(.+?)\$\$", content, re.DOTALL):
        block = m.group(1)
        # 移除 LaTeX 命令体（\text{...}、\mathrm{...} 等），它们的参数可含中文
        stripped = re.sub(r"\\[a-zA-Z]+\{[^}]*\}", "", block)
        stripped = re.sub(r"\\[a-zA-Z]+", "", stripped)
        # 句号、逗号、分号、顿号是正文标点，公式不用
        if re.search(r"[，。、；：？！]", stripped):
            chinese_body += 1
        elif len(re.findall(r"[一-鿿]", stripped)) > 10:
            chinese_body += 1
    if chinese_body:
        issues.append(f"{chinese_body} $$ blocks with Chinese body text (正文可能误包在公式内)")

    # 14. 裸代码——去 fences 后残留的 Python 语句
    bare_code = re.findall(
        r"^(def |class |import |from \w+ import )", codeless, re.MULTILINE
    )
    if bare_code:
        issues.append(f"{len(bare_code)} bare code lines (need ```python fence)")

    # 15. # 注释被标为标题——常见的代码注释关键词
    _comment_kw = r"^(设置|获取|计算|导入|定义|创建|初始化|返回|更新|显示|删除|保存|加载|生成|转换|验证|检查|调用)"
    comment_headings = 0
    for m in re.finditer(r"^(#{1,2})\s+(\S.*?)\s*$", codeless, re.MULTILINE):
        text = m.group(2).strip()
        if re.match(_comment_kw, text):
            comment_headings += 1
    if comment_headings:
        issues.append(f"{comment_headings} #/## lines look like code comments (check fences)")

    # 16. 非标准列表标记（● ◆ ① （1） (1) 1）→ 应为 - / 1.）
    nonstandard_list = re.findall(r"^(●|◆|①|②|③|④|⑤|⑥|⑦|⑧|⑨|（\d+）|\(\d+\)|\d+）)\s", content, re.MULTILINE)
    if nonstandard_list:
        unique = set(nonstandard_list)
        issues.append(f"{len(nonstandard_list)} non-standard list markers: {unique} (use - or 1.)")

    # 17. 短代码属性中的弯引号（type="..." 应为 type="..."）
    curly_quotes = re.findall(r'type=[“”][^“”"]*[“”]', content)
    if curly_quotes:
        issues.append(f"{len(curly_quotes)} curly/smart quotes in shortcode attrs (use straight ASCII quotes)")

    # 18. callout 内作者名用 heading（### 应为 **粗体**）
    callout_headings = re.findall(r"\{\{< callout[^}]*>\}}\n###\s", content)
    if callout_headings:
        issues.append(f"{len(callout_headings)} ### inside callout (use **bold** for author names)")

    return issues


def main():
    book_dir = sys.argv[1] if len(sys.argv) > 1 else "content/books/"
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
