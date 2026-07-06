#!/usr/bin/env python3
"""把段落级的 定理/定义/引理/推论/性质 X.Y.Z 加粗，便于后续 agent 识别并转 shortcode。

背景：MinerU 把数学教材里的定理/定义/引理/推论作为普通段落输出（行首直接
"定理 2.2.1 ..."），没有标记成标题。Phase 4.5 审核时需要 agent 逐个识别，
既慢又会漏。本脚本机械化地把这些段落的前缀加粗：

  定理 2.2.1 如果矩阵 A ...   →  **定理 2.2.1**　如果矩阵 A ...
  定义 3.1.1 设函数 y=f(x) ...  →  **定义 3.1.1**　设函数 y=f(x) ...

只处理行首匹配，不动正文中间的引用（如 "由定理 3.2.3 知"）。
加粗后，派审核 agent 把加粗块转成 {{< definition >}} / {{< theorem >}} shortcode。

用法：
  python3 format_theorems.py content/books/<slug>/            # 整本书
  python3 format_theorems.py content/books/<slug>/ch01.md     # 单章
"""
import re, sys, glob

PATTERN = re.compile(r'^(定理|定义|引理|推论|性质|命题|公理)\s+(\d+\.\d+\.\d+)\s')


def fix(text: str) -> tuple:
    """返回 (新文本, 替换数)。"""
    count = 0
    out = []
    for line in text.split('\n'):
        m = PATTERN.match(line)
        if m:
            rest = line[m.end():]
            # 用全角空格分隔前缀和正文，视觉上更清晰
            out.append(f'**{m.group(1)} {m.group(2)}**　{rest}')
            count += 1
        else:
            out.append(line)
    return '\n'.join(out), count


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    target = sys.argv[1]
    if target.endswith('.md'):
        files = [target]
    elif target.endswith('/'):
        files = sorted(glob.glob(target + '*.md'))
    else:
        files = sorted(glob.glob(target + '/*.md'))
    # 排除非正文章节（_index / preface / index_term / part 等）
    files = [f for f in files if not re.search(r'(_index|preface|index_term|part-)\.md$', f)]

    if not files:
        print(f'未找到章节 .md 文件: {target}', file=sys.stderr)
        sys.exit(1)

    total = 0
    for f in files:
        text = open(f, encoding='utf-8').read()
        new, n = fix(text)
        if n > 0:
            open(f, 'w', encoding='utf-8').write(new)
            print(f'  {f.split("/")[-1]}: {n} 处')
            total += n
    print(f'\n共 {total} 处定理/定义/引理/推论/性质块加粗')
    if total:
        print('\n下一步：派审核 agent 把 **定理 X.Y.Z**　... 块转成 shortcode：')
        print('  - **定义 X.Y**  → {{< definition title="..." >}}...{{< /definition >}}')
        print('  - **定理 X.Y**  → {{< theorem title="..." >}}...{{< /theorem >}}')
        print('  - **引理 X.Y**  → {{< theorem type="引理" title="..." >}}...')
        print('  - **推论 X.Y**  → {{< theorem type="推论" title="..." >}}...')


if __name__ == '__main__':
    main()
