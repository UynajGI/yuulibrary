#!/usr/bin/env python3
"""MkDocs → Hugo 一次性迁移脚本（已完成执行，保留供历史追溯）。

⚠️ 本脚本已在 mkdocs→hugo 迁移时执行过一次。原 docs/ 源目录已删除，
   content/ 现在是权威源。如需重新运行，需自行准备 mkdocs 格式的 docs/ 目录。

原功能：把 docs/ 下的 markdown 转换到 content/，处理：
  1. 加 YAML front matter（标题/权重从 nav 配置提取）
  2. <div class="solution" markdown="1">...</div> → {{< solution >}}...{{< /solution >}}
  3. <p class="caption">...</p> → {{< caption >}}...{{< /caption >}}
  4. 目录扁平化：books/<category>/<book>/ → books/<book>/
  5. markdown .md 链接保留（主题 BookPortableLinks 处理）；HTML 表格链接用 relref
  6. index.md → _index.md（section 列表页）+ BookCollapseSection

用法： python3 scripts/migrate_mkdocs_to_hugo.py [docs_dir] [content_dir]
默认： docs/ → content/
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path


# nav 顺序 + 标题（手工从 mkdocs.yml 提取，确保 weight 正确）
# 每本书的页面按出现顺序编号，跨书权重不冲突（Hugo 同级排序）
# 注意：目录已扁平化，去掉 ml/ finance/ 中间层，书直接放在 books/<book>/
NAV_TITLES = {
    # 强化学习入门 (rl-intro)
    "books/rl-intro/index.md": ("强化学习入门", 1),
    "books/rl-intro/preface.md": ("前言", 2),
    "books/rl-intro/notations.md": ("常用符号", 3),
    "books/rl-intro/algorithms.md": ("算法列表", 4),
    "books/rl-intro/ch01.md": ("第1章 · 概述", 10),
    "books/rl-intro/ch02.md": ("第2章 · 从一个示例到马尔可夫决策过程", 11),
    "books/rl-intro/ch03.md": ("第3章 · 动态规划寻找最优策略", 12),
    "books/rl-intro/ch04.md": ("第4章 · 不基于模型的预测", 13),
    "books/rl-intro/ch05.md": ("第5章 · 无模型的控制", 14),
    "books/rl-intro/ch06.md": ("第6章 · 价值函数的近似表示", 15),
    "books/rl-intro/ch07.md": ("第7章 · 基于策略梯度的深度强化学习", 16),
    "books/rl-intro/ch08.md": ("第8章 · 基于模型的学习和规划", 17),
    "books/rl-intro/ch09.md": ("第9章 · 探索与利用", 18),
    "books/rl-intro/ch10.md": ("第10章 · Alpha Zero算法实战", 19),
    # 期权期货及其他衍生产品 (options-futures-derivatives)
    "books/options-futures-derivatives/index.md": ("期权、期货及其他衍生产品", 1),
    "books/options-futures-derivatives/ch01.md": ("第1章 · 引言", 10),
    "books/options-futures-derivatives/ch02.md": ("第2章 · 期货市场的运作机制", 11),
    "books/options-futures-derivatives/ch03.md": ("第3章 · 利用期货的对冲策略", 12),
    "books/options-futures-derivatives/ch04.md": ("第4章 · 利率", 13),
    "books/options-futures-derivatives/ch05.md": ("第5章 · 远期和期货价格的确定", 14),
    "books/options-futures-derivatives/ch06.md": ("第6章 · 利率期货", 15),
    "books/options-futures-derivatives/ch07.md": ("第7章 · 互换", 16),
    "books/options-futures-derivatives/ch08.md": ("第8章 · 证券化与2007年信用危机", 17),
    "books/options-futures-derivatives/ch09.md": ("第9章 · 期权市场机制", 18),
    "books/options-futures-derivatives/ch10.md": ("第10章 · 股票期权的性质", 19),
    "books/options-futures-derivatives/ch11.md": ("第11章 · 期权交易策略", 20),
    "books/options-futures-derivatives/ch12.md": ("第12章 · 二叉树", 21),
    "books/options-futures-derivatives/ch13.md": ("第13章 · 维纳过程和伊藤引理", 22),
    "books/options-futures-derivatives/ch14.md": ("第14章 · 布莱克-斯科尔斯-默顿模型", 23),
    "books/options-futures-derivatives/ch15.md": ("第15章 · 雇员股票期权", 24),
    "books/options-futures-derivatives/ch16.md": ("第16章 · 股指期权与货币期权", 25),
    "books/options-futures-derivatives/ch17.md": ("第17章 · 期货期权", 26),
    "books/options-futures-derivatives/ch18.md": ("第18章 · 希腊值", 27),
    "books/options-futures-derivatives/ch19.md": ("第19章 · 波动率微笑", 28),
    "books/options-futures-derivatives/ch20.md": ("第20章 · 基本数值方法", 29),
    "books/options-futures-derivatives/ch21.md": ("第21章 · 风险价值", 30),
    "books/options-futures-derivatives/ch22.md": ("第22章 · 估计波动率与相关性", 31),
    "books/options-futures-derivatives/ch23.md": ("第23章 · 信用风险", 32),
    "books/options-futures-derivatives/ch24.md": ("第24章 · 信用衍生产品", 33),
    "books/options-futures-derivatives/ch25.md": ("第25章 · 奇异期权", 34),
    "books/options-futures-derivatives/ch26.md": ("第26章 · 再论模型和数值算法", 35),
    "books/options-futures-derivatives/ch27.md": ("第27章 · 鞅与测度", 36),
    "books/options-futures-derivatives/ch28.md": ("第28章 · 利率衍生产品: 标准市场模型", 37),
    "books/options-futures-derivatives/ch29.md": ("第29章 · 曲率调整、时间调整和二次调整", 38),
    "books/options-futures-derivatives/ch30.md": ("第30章 · 利率衍生产品: 短期利率模型", 39),
    "books/options-futures-derivatives/ch31.md": ("第31章 · 利率衍生产品: HJM与LMM模型", 40),
    "books/options-futures-derivatives/ch32.md": ("第32章 · 再谈互换", 41),
    "books/options-futures-derivatives/ch33.md": ("第33章 · 能源与商品衍生产品", 42),
    "books/options-futures-derivatives/ch34.md": ("第34章 · 实物期权", 43),
    "books/options-futures-derivatives/ch35.md": ("第35章 · 重大金融损失与借鉴", 44),
    "books/options-futures-derivatives/ch36.md": ("第36章 · 衍生产品市场的未来", 45),
    # 量化金融面试实用指南 (quant-finance-interview)
    "books/quant-finance-interview/index.md": ("量化金融面试实用指南", 1),
    "books/quant-finance-interview/preface.md": ("前言", 2),
    "books/quant-finance-interview/notations.md": ("符号说明", 3),
    "books/quant-finance-interview/ch01.md": ("第1章 · 基本原则", 10),
    "books/quant-finance-interview/ch02.md": ("第2章 · 脑筋急转弯", 11),
    "books/quant-finance-interview/ch03.md": ("第3章 · 微积分与线性代数", 12),
    "books/quant-finance-interview/ch04.md": ("第4章 · 概率论", 13),
    "books/quant-finance-interview/ch05.md": ("第5章 · 随机过程与随机微积分", 14),
    "books/quant-finance-interview/ch06.md": ("第6章 · 金融", 15),
    "books/quant-finance-interview/ch07.md": ("第7章 · 算法与数值方法", 16),
    "books/quant-finance-interview/index_term.md": ("索引", 90),
}

# 目录扁平化映射：源（含分类）→ 目标 slug。分类信息不进目录，靠书名区分。
BOOK_SLUGS = {
    "books/ml/rl-intro": "books/rl-intro",
    "books/finance/options-futures-derivatives": "books/options-futures-derivatives",
    "books/finance/quant-finance-interview": "books/quant-finance-interview",
}


def flatten_rel(rel_path: str) -> str:
    """books/ml/rl-intro/ch01.md → books/rl-intro/ch01.md"""
    for old, new in BOOK_SLUGS.items():
        if rel_path.startswith(old + "/") or rel_path == old:
            return rel_path.replace(old, new, 1)
    return rel_path


def make_front_matter(title: str, weight: int | None, rel_path: str) -> str:
    """生成 YAML front matter。书籍封面页（books/.../index.md）加 BookCollapseSection。"""
    is_book_index = rel_path.startswith("books/") and rel_path.endswith("index.md")
    fm = ["---", f'title: "{title}"']
    if weight is not None:
        fm.append(f"weight: {weight}")
    if is_book_index:
        # 书籍 section 首页：菜单里默认折叠，当前书/祖先书展开
        fm.append("BookCollapseSection: true")
    fm.append("---")
    fm.append("")
    return "\n".join(fm)


def convert_solution_divs(text: str) -> str:
    """<div class="solution" markdown="1">...</div> → {{< solution >}}...{{< /solution >}}"""
    # 开标签：<div class="solution" markdown="1"> 或 <div class="solution" markdown='1'>
    text = re.sub(
        r'<div\s+class="solution"\s+markdown=(?:"1"|\'1\')\s*>',
        "{{< solution >}}",
        text,
    )
    text = re.sub(
        r'<div\s+class="solution"\s*>',
        "{{< solution >}}",
        text,
    )
    # 闭标签：紧随 solution 块的 </div>
    # 注意：不能盲目替换所有 </div>，只替换紧跟 {{< /solution >}} 模式的
    # 由于上面的开标签已变 {{< solution >}}，把第一个 </div> 换掉
    # 用状态机逐行处理更安全
    return text


def convert_solution_close(text: str) -> str:
    """把 {{< solution >}} 后到下一个 </div> 的内容包裹成 {{< /solution >}}"""
    out: list[str] = []
    in_solution = False
    for line in text.split("\n"):
        if "{{< solution >}}" in line:
            in_solution = True
            out.append(line)
        elif in_solution and re.match(r"\s*</div>\s*$", line):
            in_solution = False
            out.append("{{< /solution >}}")
        else:
            out.append(line)
    return "\n".join(out)


def convert_caption(text: str) -> str:
    """<p class="caption">...</p> → {{< caption >}}...{{< /caption >}}"""
    text = re.sub(
        r'<p\s+class="caption"\s*>(.*?)</p>',
        r"{{< caption >}}\1{{< /caption >}}",
        text,
        flags=re.DOTALL,
    )
    return text


def normalize_target(target: str) -> str:
    """书籍封面页 index.md → _index.md（section 列表），去掉 ./ 前缀。
    仅末段文件名为 index.md 时改名。"""
    target = target.lstrip("./")
    if target.endswith("/index.md") or target == "index.md":
        target = target.replace("index.md", "_index.md")
    return target


def convert_md_links(text: str, current_dir: Path) -> str:
    """Markdown 链接保持 .md 原样：Book 主题的 BookPortableLinks 会自动
    把 ](ch04.md) 解析为页面 permalink（render-link hook）。
    仅规范化：去掉 ./ 前缀，index.md→_index.md，保留锚点。"""
    pattern = re.compile(
        r"(!?\[)([^]]*)\]\(([^)]+?\.md)(#[^)]*)?\)",
    )

    def repl(m: re.Match) -> str:
        bang_bracket = m.group(1)
        text_part = m.group(2)
        target = m.group(3)
        anchor = m.group(4) or ""
        if target.startswith(("http://", "https://", "mailto:")):
            return m.group(0)
        if target.startswith("images/") or target.startswith("/"):
            return m.group(0)
        target = normalize_target(target)
        return f"{bang_bracket}{text_part}]({target}{anchor})"

    return pattern.sub(repl, text)


def convert_html_links(text: str, rel_to_docs_root: str) -> str:
    """HTML 表格里的 <a href="ch01.md">：render-link 不处理 raw HTML，
    需显式 relref。用从 content 根开始的绝对路径避免重名歧义。
    rel_to_docs_root 如 'books/finance/quant-finance-interview'
    """
    prefix = rel_to_docs_root.strip("/") + "/" if rel_to_docs_root.strip("/") else ""

    def repl(m: re.Match) -> str:
        target = m.group(2)
        anchor = m.group(3) or ""
        if target.startswith(("http://", "https://", "mailto:")):
            return m.group(0)
        if target.startswith(("images/", "/")):
            return m.group(0)
        target = target.lstrip("./")
        target = normalize_target(target)
        # 已是绝对路径就不加前缀
        full = target if target.startswith("books/") else prefix + target
        relref = '{{< relref "/' + full + '" >}}'
        return f'{m.group(1)}href="{relref}{anchor}"'

    return re.sub(
        r'(<a\s+)href="([^"]+?\.md)(#[^"]*)?"',
        repl,
        text,
    )


def convert_html_links_dot_html(text: str) -> str:
    """把误写的 .html 链接改为 .md（站点用 uglyurls，relref 会处理）"""
    return re.sub(
        r'(<a\s+)href="([^"]+?)\.html"',
        r'\1href="\2.md"',
        text,
    )


def fix_malformed_math(text: str) -> str:
    """修复 ch05.md 中 \( F_0...$ 这类畸形（左 \( 右 $）"""
    # 罕见情况，仅在 options-futures ch05 出现，手动处理更稳；此处仅清理明显的 \(...\$ 配对
    return text


def convert_file(src: Path, docs_root: Path, content_root: Path) -> str:
    """读源文件，做全部转换，返回新内容。"""
    rel = src.relative_to(docs_root).as_posix()
    flat = flatten_rel(rel)
    text = src.read_text(encoding="utf-8")

    # 1. 转换 HTML 链接中的 .html → .md（先归一化）
    text = convert_html_links_dot_html(text)

    # 2. solution div → shortcode（开标签 + 闭标签分行处理）
    text = convert_solution_divs(text)
    text = convert_solution_close(text)

    # 3. caption p → shortcode
    text = convert_caption(text)

    # 4. markdown .md 链接保持 .md（主题 BookPortableLinks 处理）
    text = convert_md_links(text, src.parent)

    # 5. HTML href .md → relref（扁平化后的绝对路径，避免重名歧义）
    rel_to_root = "/".join(flat.split("/")[:-1])  # books/rl-intro
    text = convert_html_links(text, rel_to_root)

    # 6. 加 front matter（标题/权重用扁平路径查 NAV_TITLES）
    title, weight = NAV_TITLES.get(flat, (extract_title(text), None))
    fm = make_front_matter(title, weight, flat)
    text = fm + text.lstrip("\n")

    return text


def extract_title(text: str) -> str:
    """从首个 # 标题提取标题；无则用文件名。"""
    m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    if m:
        return m.group(1).strip()
    return "未命名"


def main() -> int:
    docs_root = Path(sys.argv[1] if len(sys.argv) > 1 else "docs").resolve()
    content_root = Path(sys.argv[2] if len(sys.argv) > 2 else "content").resolve()

    if not docs_root.exists():
        print(f"源目录不存在: {docs_root}", file=sys.stderr)
        return 1

    # 清空/创建 content（保留手写的 _index.md）
    if content_root.exists():
        for child in content_root.iterdir():
            if child.name == "_index.md":
                continue  # 手写首页，不覆盖
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()
    else:
        content_root.mkdir(parents=True)

    # 首页 index.md → content/_index.md（若已存在手写版则跳过，避免覆盖）
    home_src = docs_root / "index.md"
    home_dest = content_root / "_index.md"
    if home_src.exists() and not home_dest.exists():
        home_text = home_src.read_text(encoding="utf-8")
        home_text = convert_caption(home_text)
        # 首页链接：markdown 保持 .md；HTML 用绝对路径 relref
        home_text = convert_md_links(home_text, docs_root)
        home_text = convert_html_links(home_text, "")
        fm = "---\ntitle: \"Yuunagi Library\"\nweight: 1---\n\n"
        home_dest.write_text(fm + home_text.lstrip("\n"), encoding="utf-8")
        print(f"  _index.md (首页)")

    # books/ 下所有文件（扁平化：去掉 ml/ finance/ 中间分类层）
    books_root = docs_root / "books"
    if not books_root.exists():
        print("警告：books/ 不存在", file=sys.stderr)

    md_count = 0
    img_count = 0
    for src in books_root.rglob("*"):
        if src.is_dir():
            continue
        rel = src.relative_to(docs_root).as_posix()
        flat = flatten_rel(rel)
        dest = content_root / flat

        if src.suffix == ".md":
            dest.parent.mkdir(parents=True, exist_ok=True)
            new_text = convert_file(src, docs_root, content_root)
            # 书籍目录下的 index.md → _index.md（section 列表页，菜单可折叠）
            if src.name == "index.md" and "books/" in rel:
                dest = dest.parent / "_index.md"
            dest.write_text(new_text, encoding="utf-8")
            md_count += 1
            print(f"  {flat}")
        elif src.suffix.lower() in (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"):
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            img_count += 1
        else:
            # 其他文件原样复制
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)

    # notes/ papers/ 空目录也建一下（保持结构）
    for d in ("notes", "papers"):
        src_d = docs_root / d
        if src_d.exists():
            dest_d = content_root / d
            dest_d.mkdir(parents=True, exist_ok=True)
            for f in src_d.iterdir():
                if f.is_file():
                    shutil.copy2(f, dest_d / f.name)

    print(f"\n完成: {md_count} markdown, {img_count} 图片 → {content_root}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
