#!/usr/bin/env python3
"""Mechanical validation for book markdown quality. Called by lefthook pre-commit.

Levels:
  [E] Error   — blocks commit. Unfixable damage (broken $$, bare code, duplicate H1s…)
  [W] Warning — passes commit, but should be fixed. Style/consistency issues.
"""

import glob
import os
import re
import sys

E, W, R = "[E]", "[W]", "[R]"
ERR, WARN, REVIEW = 0, 1, 2


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


def issue(level, msg):
    return (level, msg)


def validate_file(path, all_files=None):
    issues = []
    fname = os.path.basename(path)

    with open(path) as f:
        content = f.read()
        lines = content.splitlines()

    # ==================== ERRORS ====================

    # 1. Odd $$ count — broken display math
    ds_count = content.count("$$")
    if ds_count % 2 != 0:
        issues.append(issue(ERR, f"Unmatched $$ pairs: {ds_count} (odd)"))

    # 2. <details> blocks remaining
    details = content.count("<details>")
    if details:
        issues.append(issue(ERR, f"{details} <details> blocks remaining"))

    # 2b. Shortcode balance — each {{< name >}} must have {{< /name >}}
    _self_close = {"book-toc", "bookshelf", "recent-notes", "relref", "ref"}
    for sc in re.findall(r"\{\{<\s*(\w[\w-]*)", content):
        if sc in _self_close or sc.startswith("/"):
            continue
        opens = len(re.findall(r"\{\{<\s*" + re.escape(sc) + r"\b", content))
        closes = len(re.findall(r"\{\{<\s*/" + re.escape(sc) + r"\s*>\}\}", content))
        if opens != closes:
            issues.append(issue(ERR, f"Shortcode '{sc}': {opens} opens, {closes} closes (unbalanced)"))

    # 3. Bare code — no fence wrapping
    codeless = strip_fences(content)
    # Strip lines marked with <!-- validate-skip --> (known false positives)
    codeless = "\n".join(l for l in codeless.split("\n") if "<!-- validate-skip -->" not in l)
    bare_code = re.findall(
        r"^(def |class |import |from \w+ import )", codeless, re.MULTILINE
    )
    if bare_code:
        issues.append(issue(ERR, f"{len(bare_code)} bare code lines (need ```python fence)"))

    # 4. $$ blocks containing Chinese body text (not in \text{} / \mathrm{})
    chinese_body = 0
    for m in re.finditer(r"\$\$(.+?)\$\$", content, re.DOTALL):
        block = m.group(1)
        stripped = re.sub(r"\\[a-zA-Z]+\{[^}]*\}", "", block)
        stripped = re.sub(r"\\[a-zA-Z]+", "", stripped)
        if re.search(r"[，。、；：？！]", stripped):
            chinese_body += 1
        elif len(re.findall(r"[一-鿿]", stripped)) > 10:
            chinese_body += 1
    if chinese_body:
        issues.append(issue(ERR, f"{chinese_body} $$ blocks with Chinese body text"))

    # 5. Curly/smart quotes in shortcode attributes — Hugo won't parse
    curly = re.findall(r'type=[“”][^“”"]*[“”]', content)
    if curly:
        issues.append(issue(ERR, f"{len(curly)} curly quotes in shortcode attrs (use straight ASCII)"))

    # 5.5 Double \tag{...}\tag{...} — MinerU artifact
    double_tags = re.findall(r'\\tag\{[^}]+\}\\tag\{', content)
    if double_tags:
        issues.append(issue(ERR, f"{len(double_tags)} double \\\\tag (MinerU artifact, remove the first one)"))

    # 6. Multiple H1 in chapter files
    headings = re.findall(r"^(#{1,6})\s+(.+?)\s*$", codeless, re.MULTILINE)
    levels = [len(h[0]) for h in headings]
    texts = [h[1] for h in headings]
    h1_texts = [texts[i] for i in range(len(levels)) if levels[i] == 1]
    if len(h1_texts) > 1:
        preview = "; ".join(h1_texts[:4])
        issues.append(issue(ERR, f"{len(h1_texts)} H1 headings (should be 1): {preview}"))

    # 7. Empty/garbage headings
    for t in texts:
        s = t.strip()
        if len(s) <= 1 and s and not (len(s) == 1 and s.isalpha()):
            issues.append(issue(ERR, f"empty/garbage heading: '# {t}'"))
        elif re.match(r"^第\s*章\s*$", s):
            issues.append(issue(ERR, f"missing chapter number: '# {t}'"))

    # 8. Front matter completeness (only for book chapter files)
    if re.match(r"^(ch\d{2}|preface|intro|appendix|notations|algorithms|index_term)\.md$", fname):
        fm_match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
        if fm_match:
            fm = fm_match.group(1)
            for key in ["title", "weight", "description"]:
                if not re.search(rf"^{key}:\s*\S", fm, re.MULTILINE):
                    issues.append(issue(ERR, f"front matter missing '{key}'"))
        else:
            issues.append(issue(ERR, "front matter block (---) missing"))

    # 9. Broken chapter cross-references ([第N章](chNN.md) → missing file)
    book_dir = os.path.dirname(path)
    ch_links = re.findall(r"\[([^\]]*)\]\((ch\d{2}\.md)\)", content)
    broken = []
    for link_text, target in ch_links:
        if not os.path.exists(os.path.join(book_dir, target)):
            broken.append((link_text, target))
    if broken:
        details = "; ".join(f"[{t}]({f})" for t, f in broken[:5])
        if len(broken) > 5:
            details += f" ... and {len(broken)-5} more"
        issues.append(issue(ERR, f"{len(broken)} broken xref: {details}"))

    # ==================== WARNINGS ====================

    # 10. Image inside $ math (likely MinerU error)
    # Note: $ markers may carry <!-- validate-skip --> (e.g. stat-arb uses
    # $ ... $ as centered image containers). A $ line with the skip tag
    # must still participate in pairing so the block isn't mis-detected as math.
    in_math = False
    for i, line in enumerate(lines, 1):
        s = line.strip()
        if s == "$" or s.startswith("$ <!-- validate-skip"):
            # If the opening $ carries a skip tag, treat the whole block as
            # non-math (a layout container) and don't flag images inside it.
            if "<!-- validate-skip" in s and not in_math:
                # find the closing $ and skip its interior
                in_math = False
                for j in range(i, len(lines)):
                    sj = lines[j-1].strip()
                    if j > i and (sj == "$" or sj.startswith("$ <!-- validate-skip")):
                        i = j  # advance outer loop cursor
                        break
            else:
                in_math = not in_math
        elif in_math and s.startswith("!["):
            issues.append(issue(WARN, f"L{i}: image inside $ math block"))

    # 11. Empty $ blocks (ignore $ ... $ containers marked <!-- validate-skip -->)
    body_ns = re.sub(r"\$\$ <!-- validate-skip -->.*?\$\$", "", content, flags=re.DOTALL)
    empty_ds = len(re.findall(r"^\$\$[ \t]*\n[ \t]*\$\$", body_ns, re.MULTILINE))
    if empty_ds:
        issues.append(issue(WARN, f"{empty_ds} empty $ blocks"))

    # 12. Compound $ blocks (blank line inside; ignore skip-tagged containers)
    compound = sum(1 for m in re.finditer(r"^\$\$[ \t]*\n(.*?)\n[ \t]*\$\$", body_ns, re.DOTALL | re.MULTILINE)
                   if "\n\n" in m.group(1))
    if compound:
        issues.append(issue(WARN, f"{compound} compound $ blocks"))

    # 13. .html links in source (should be .md for Hugo rewriting)
    html_links = re.findall(r"\]\(\./[^)]*\.html\)", content)
    if html_links:
        issues.append(issue(WARN, f"{len(html_links)} .html links (use .md)"))

    # 14. Naked captions
    # Exclude lines that are part of a sentence (e.g. "表4.1总结了...", "图5.2展示了...").
    naked_cap = [m for m in re.finditer(r"^(图\d+\.\d+|表\d+\.\d+)[^\n]{0,30}$", content, re.MULTILINE)
                 if not re.search(r"[。！？，；：]|\s*(总结|展示|说明|列出|给出|显示|提到|参见|见)[了]?", m.group(0))]
    naked_cap = [m.group(1) for m in naked_cap]
    if naked_cap:
        issues.append(issue(WARN, f"{len(naked_cap)} naked captions (wrap in {{{{< caption >}}}})"))

    # 15. JPG/PNG image references (should be WebP)
    jpg_png_refs = re.findall(r"\]\(\.?/images/[^)]+\.(?:jpg|png)\)", content)
    if jpg_png_refs:
        issues.append(issue(ERR, f"{len(jpg_png_refs)} .jpg/.png image refs (must convert to .webp)"))

    # 16. Backslash pseudocode commands
    bad_cmds = re.findall(
        r"\\(?:state|for|if|while|repeat|until|return|endfor|endif|endwhile|endprocedure|endfunction|procedure|function|label)\\b",
        content,
    )
    if bad_cmds:
        issues.append(issue(WARN, f"{len(bad_cmds)} backslash pseudocode commands"))

    # 17. H1 format issues (spaces, colons)
    for h1 in h1_texts:
        if re.match(r"^(前言|符号|算法|索引|致谢|目录|附录|献词|引言)", h1):
            continue
        if re.match(r"^第 \d+ 章", h1):
            issues.append(issue(WARN, f'H1 extra spaces: "{h1}"'))
        elif "：" in h1 or (":" in h1.split("章")[-1] if "章" in h1 else False):
            issues.append(issue(WARN, f'H1 has colon: "{h1}"'))

    # 18. Heading level skip (H1→H3, H2→H4)
    for i in range(1, len(levels)):
        jump = levels[i] - levels[i - 1]
        if jump > 1:
            issues.append(issue(WARN,
                f"heading skip: H{levels[i-1]}→H{levels[i]} "
                f'("{texts[i-1][:20]}" → "{texts[i][:20]}")'
            ))

    # 19. Code-comment-like headings
    _comment_kw = r"^(设置|获取|计算|导入|定义|创建|初始化|返回|更新|显示|删除|保存|加载|生成|转换|验证|检查|调用)"
    _term_suffix = r"(条件|规则|总结|方法|原则|标准|要求|步骤|流程|参数|选项|模式)"
    comment_h = sum(1 for m in re.finditer(r"^(#{1,2})\s+(\S.*?)\s*$", codeless, re.MULTILINE)
                    if re.match(_comment_kw, m.group(2).strip())
                    and not re.search(r"[（(].*[)）]", m.group(2).strip())
                    and not re.search(_term_suffix, m.group(2).strip()))
    if comment_h:
        issues.append(issue(WARN, f"{comment_h} #/## look like code comments"))

    # 20. Non-standard list markers
    ns_list = re.findall(r"^(●|◆|①|②|③|④|⑤|⑥|⑦|⑧|⑨|（\d+）|\(\d+\)|\d+）)\s", content, re.MULTILINE)
    if ns_list:
        unique = sorted(set(ns_list))
        issues.append(issue(WARN, f"{len(ns_list)} non-standard list markers: {unique} (use - or 1.)"))

    # 21. ### heading inside callout (should be **bold**)
    callout_h = re.findall(r"\{\{< callout[^}]*>\}\}\n###\s", content)
    if callout_h:
        issues.append(issue(WARN, f"{len(callout_h)} ### inside callout (use **bold**)"))

    # 22. Naked 第N章 cross-references (should be linked)
    # Strip front matter to avoid matching title/description fields
    body = re.sub(r"^---\n.*?\n---\n", "", content, flags=re.DOTALL)
    body = strip_fences(body)
    # Skip lines marked with <!-- validate-skip --> (known false positives, e.g. HTML chapter lists in part pages)
    skip_body = "\n".join(l for l in body.split("\n") if "<!-- validate-skip -->" not in l)
    # Exclude headings, already-linked refs, and external citations:
    #   - 文献[100, 第24章] / [96, 第14章]  (bibliography style)
    #   - 第3卷第43章  (volume+chapter of another book)
    xrefs = [m.group(0) for m in re.finditer(r"第\s*\d+\s*章", skip_body)
             if not re.match(r"^#{1,6}\s", m.string[m.start():].split("\n")[0])  # not a heading
             and not re.search(r"\[第\s*\d+\s*章\]\(ch\d{2}\.md\)", m.string[max(0,m.start()-1):m.end()+20])  # not already linked
             and not re.search(r"\[\d+\s*,\s*$", m.string[max(0,m.start()-12):m.start()])  # not 文献[X, 第N章]
             and not re.search(r"第\s*\d+\s*卷\s*第\s*\d+\s*章", m.string[max(0,m.start()-8):m.end()+8])]  # not 第N卷第N章
    if xrefs:
        issues.append(issue(WARN, f"{len(xrefs)} unlinked 第N章 references (use [第N章](ch0N.md))"))

    # 23. Copyright residue
    cr = re.findall(r"^(ISBN|客服热|客服信箱|版权所有|侵权必究|CIP 数据|图书在版)", content, re.MULTILINE)
    if cr:
        issues.append(issue(WARN, f"{len(cr)} copyright/residue lines"))

    # 24. HTML table garbage
    html_tbl = len(re.findall(r"<table>.*?venv.*?</table>", content, re.DOTALL))
    if html_tbl:
        issues.append(issue(WARN, f"{html_tbl} garbage HTML tables (venv paths)"))

    # 25. mineru-algorithm div (should be {{< algorithm >}})
    mineru_div = content.count("mineru-algorithm")
    if mineru_div:
        issues.append(issue(WARN, f"{mineru_div} mineru-algorithm divs (use {{{{< algorithm >}}}})"))

    # 26. Hand-written TOC in preface (redundant with book-toc)
    if fname == "preface.md" and re.search(r"^##\s+目录\s*$", content, re.MULTILINE):
        found_toc = False
        for line in lines:
            if re.match(r"^##\s+目录\s*$", line):
                found_toc = True
                continue
            if found_toc and re.match(r"^第\s*\d+\s*章", line):
                issues.append(issue(WARN, "hand-written TOC in preface (delete, book-toc auto-generates)"))
                break

    # 27. ### inside callout quote blocks
    callout_heading = re.findall(r"\{\{< callout type=.quote. >\}\}\n###\s", content)
    if callout_heading:
        issues.append(issue(WARN, f"{len(callout_heading)} ### in quote callout (use **bold**)"))

    # 28. Mid-sentence breaks (MinerU artifact: Chinese line → blank line → short continuation)
    mid_breaks = 0
    if re.match(r'^(appendix|notation)', fname):
        pass  # skip code/model listings and symbol tables
    else:
        structured_re = re.compile(
            r'^(流入[：:]|流出[：:]|运行时长[=：]|存量[：:]|转化器[：:]|初始|'
            r'组合\s*[A-Z]|[A-Z][a-z]+\s*[A-Z][a-z]+|dt[=＝]|t[=＝])'
        )
        for i in range(len(lines) - 2):
            cur = lines[i].strip()
            nxt = lines[i + 1].strip()
            nnx = lines[i + 2].strip()
            if not (cur and nxt == "" and nnx):
                continue
            if not (re.search(r'[一-鿿]$', cur) and re.match(r'^[一-鿿a-zA-Z]', nnx)):
                continue
            if re.search(r'[。！？）\)》\]」』]|^#|^\$|^<|^\{|^\[|^{\{|^{\%|^- |^[0-9]+\.', cur):
                continue
            if len(cur) < 10:
                continue
            if re.search(r'(作家|学家|作者|教授|博士|主席|所长|董事长|秘书长)$', cur):
                continue  # quote attribution line
            if structured_re.match(cur) or structured_re.match(nnx):
                continue
            if len(cur) <= 16 and not re.search(r'[，,。；;]$', cur):
                continue
            # Real mid-sentence breaks have short continuations (colons excluded: they introduce lists)
            short_cont = re.match(r'^.{1,4}[。！？，、；）\)》\]」』\n]', nnx)
            if not short_cont:
                continue
            mid_breaks += 1
    if mid_breaks:
        issues.append(issue(WARN, f"{mid_breaks} mid-sentence breaks (join across blank line)"))

    # ==================== REVIEW (元素模板候选，需人工确认) ====================

    # Strip front matter and code fences for template detection
    body_raw = re.sub(r"^---\n.*?\n---\n", "", content, flags=re.DOTALL)
    body_nf = strip_fences(body_raw)
    body_lines = body_nf.split("\n")

    # Lines with <!-- validate-skip --> are known false positives — skip them
    skip_lines = {i for i, l in enumerate(body_lines) if '<!-- validate-skip -->' in l}

    # 28. 例X-X pattern → might need {{< example >}}
    example_hits = [l.strip() for i, l in enumerate(body_lines)
                    if i not in skip_lines
                    and re.match(r'^例\s*\d+[\-\.]\d+', l.strip())
                    and '{{<' not in l]
    if example_hits:
        issues.append(issue(REVIEW, f"{len(example_hits)} '例X-X' candidates (review → {{{{< example >}}}})"))

    # 29. 业界事例 → might need {{< callout >}}
    case_hits = [l.strip() for i, l in enumerate(body_lines)
                 if i not in skip_lines
                 and '业界事例' in l and '{{<' not in l]
    if case_hits:
        issues.append(issue(REVIEW, f"{len(case_hits)} '业界事例' candidates (review → {{{{< callout >}}}})"))

    # 30. Standalone 定义/定理/引理/命题 → might need {{< definition >}}/{{< theorem >}}
    defn_hits = [l.strip() for i, l in enumerate(body_lines)
                 if i not in skip_lines
                 and re.match(r'^(定义|定理|引理|命题|推论)\s*[\d\-\.]*[\s：:]', l.strip())
                 and '{{<' not in l and not l.strip().startswith('#')]
    if defn_hits:
        issues.append(issue(REVIEW, f"{len(defn_hits)} 定义/定理 candidates (review → {{{{< definition >}}}}/{{{{< theorem >}}}})"))

    # 31. Bare 来源/出处 lines → might need {{< caption >}}
    src_hits = [l.strip() for i, l in enumerate(body_lines)
                if i not in skip_lines
                and re.match(r'^(来源|出处|参考)[：:]', l.strip())
                and '{{<' not in l]
    if src_hits:
        issues.append(issue(REVIEW, f"{len(src_hits)} 来源/出处 candidates (review → {{{{< caption >}}}})"))

    # 32. ---Author, *Book* quote pattern → might need {{< callout type="quote" >}}
    quote_hits = [l.strip() for i, l in enumerate(body_lines)
                  if i not in skip_lines
                  and re.match(r'^—.+,?\s*\*[^\*]+\*', l.strip())
                  and '{{<' not in l]
    if quote_hits:
        issues.append(issue(REVIEW, f"{len(quote_hits)} '—Author, *Book*' candidates (review → {{{{< callout type=\"quote\" >}}}})"))

    # 33. Non-rectangular matrix/array (rows have inconsistent & counts)
    non_rect = []
    for m in re.finditer(
        r"\\begin\{(array|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|matrix)\}\s*\{([^}]*)\}",
        content,
    ):
        env = m.group(1)
        colspec = m.group(2)
        # Count expected columns
        spec_clean = re.sub(r"\{[^}]*\}", "", colspec).replace("|", "")
        expected = len(re.findall(r"[lcr]", spec_clean))
        if expected < 2:
            continue
        # Find matching \end{env}
        end_tag = f"\\end{{{env}}}"
        end_m = re.search(re.escape(end_tag), content[m.end():])
        if not end_m:
            continue
        body_text = content[m.end():m.end() + end_m.start()]
        # Skip arrays containing nested arrays — inner \\ confuses row splitting
        if re.search(r"\\begin\{(array|matrix|pmatrix|bmatrix)\}", body_text):
            continue
        rows = [r.strip() for r in body_text.split(r"\\") if r.strip()]
        if len(rows) < 2:
            continue
        col_counts = [r.count("&") + 1 for r in rows]
        if len(set(col_counts)) > 1:
            line_no = content[:m.start()].count("\n") + 1
            mode = max(set(col_counts), key=col_counts.count)
            bad = [(i + 1, c) for i, c in enumerate(col_counts) if c != mode]
            detail = ", ".join(f"行{i}={c}列" for i, c in bad[:3])
            if len(bad) > 3:
                detail += f" ... +{len(bad) - 3}"
            non_rect.append(
                f"L{line_no} \\begin{{{env}}}{{{colspec}}} (应为{expected}列，主流{mode}列，异常：{detail})"
            )
    if non_rect:
        issues.append(issue(WARN, f"{len(non_rect)} non-rectangular matrix/array: {'; '.join(non_rect[:5])}"))

    # 34. Array rows use ~ (tilde) instead of & as column separators (OCR error)
    tilde_rows = []
    for m in re.finditer(
        r"\\begin\{(array|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|matrix)\}\s*\{([^}]*)\}",
        content,
    ):
        env = m.group(1)
        colspec = m.group(2)
        spec_clean = re.sub(r"\{[^}]*\}", "", colspec).replace("|", "")
        expected = len(re.findall(r"[lcr]", spec_clean))
        if expected < 2:
            continue
        end_tag = f"\\end{{{env}}}"
        end_m = re.search(re.escape(end_tag), content[m.end():])
        if not end_m:
            continue
        body_text = content[m.end():m.end() + end_m.start()]
        if re.search(r"\\begin\{array\}", body_text):
            continue  # skip nested
        rows = [r.strip() for r in body_text.split(r"\\") if r.strip()]
        # Rows with 2+ ~ but zero & → OCR lost column separators
        bad = [r[:60] for r in rows if r.count("~") >= 2 and "&" not in r]
        if bad:
            line_no = content[:m.start()].count("\n") + 1
            tilde_rows.append(
                f"L{line_no} \\begin{{{env}}}{{{colspec}}} ({len(bad)}行用~代替&: {bad[0]}...)"
            )
    if tilde_rows:
        issues.append(issue(WARN, f"{len(tilde_rows)} array/matrix using ~ instead of &: {'; '.join(tilde_rows[:3])}"))

    return issues


def main():
    book_dir = sys.argv[1] if len(sys.argv) > 1 else "content/books/"
    files = sorted(glob.glob(f"{book_dir}/**/*.md", recursive=True))
    # Skip _index.md, non-chapter files
    files = [f for f in files if os.path.basename(f) != "_index.md" and "/images/" not in f]

    total_e = 0
    total_w = 0
    total_r = 0
    for path in files:
        issues = validate_file(path)
        if issues:
            short = os.path.relpath(path, start=os.path.commonprefix([path, book_dir]))
            errors = [i for i in issues if i[0] == ERR]
            warns = [i for i in issues if i[0] == WARN]
            reviews = [i for i in issues if i[0] == REVIEW]
            if errors or warns or reviews:
                print(f"{short}:")
                for _, msg in errors:
                    print(f"  {E} {msg}")
                for _, msg in warns:
                    print(f"  {W} {msg}")
                for _, msg in reviews:
                    print(f"  {R} {msg}")
            total_e += len(errors)
            total_w += len(warns)
            total_r += len(reviews)

    if total_e + total_w + total_r == 0:
        print("OK")
        return 0

    summary = []
    if total_e:
        summary.append(f"{total_e} error(s)")
    if total_w:
        summary.append(f"{total_w} warning(s)")
    if total_r:
        summary.append(f"{total_r} review(s)")
    print(f"\n{', '.join(summary)} found")

    return 1 if total_e > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
