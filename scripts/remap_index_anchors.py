#!/usr/bin/env python3
"""重新映射 index_term.md 的 MkDocs 锚点到 Hugo 标题 ID。

MkDocs 的 toc.permalink 生成两类锚点：
  - 命名锚 #33 #gamma #black-scholes：来自标题文本 slug（Hugo 生成 33-xxx / gamma / black-scholes）
  - 顺序锚 #_5 #_10：按标题出现顺序编号，无文本线索

策略：
  1. 对命名锚：在目标章节找以该锚为前缀的 Hugo heading id（如 #33 → #33-偏导数...）
  2. 对顺序锚 #_N：用索引条目的术语文本，在章节中搜索最接近的标题
  3. 无法匹配的输出警告，保留原锚（页面顶部）
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


def hugo_slugify(text: str) -> str:
    """近似 Hugo/Goldmark 的 heading id slug 规则。
    Goldmark: 小写、非字母数字-下划线变连字符、合并连续连字符、去首尾连字符。
    中文保留。点号和空格删除（MkDocs 行为）或变连字符？观察：'2.2 逻辑推理'→'22-逻辑推理'
    即点号删除、空格变连字符。"""
    s = text.strip().lower()
    # 点号删除（'2.2'→'22'）
    s = s.replace(".", "")
    # 非 [a-z0-9_-及unicode字母数字] 变连字符
    out: list[str] = []
    for ch in s:
        if ch.isalnum() or ch == "_" or ord(ch) > 127:
            out.append(ch)
        elif ch in "- ":
            out.append("-")
        else:
            out.append("-")
    s = "".join(out)
    # 合并连续连字符、去首尾
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def extract_headings(md_path: Path) -> list[tuple[str, str]]:
    """提取 markdown 标题（级别, 文本），返回 (hugo_id, text) 列表。"""
    headings: list[tuple[str, str]] = []
    if not md_path.exists():
        return headings
    text = md_path.read_text(encoding="utf-8")
    for m in re.finditer(r"^(#{1,6})\s+(.+?)\s*$", text, re.MULTILINE):
        level = len(m.group(1))
        title = m.group(2).strip()
        # 去掉行内格式（** __ 等）
        title_clean = re.sub(r"\*+|_+|`+", "", title)
        slug = hugo_slugify(title_clean)
        headings.append((slug, title_clean))
    return headings


def find_named_anchor(anchor: str, headings: list[tuple[str, str]]) -> str | None:
    """命名锚 #33 → 找以 '33' 开头的 slug；#gamma → 精确或前缀匹配。"""
    a = anchor.lstrip("#")
    # 1. 精确匹配
    for slug, _ in headings:
        if slug == a:
            return slug
    # 2. anchor 是 slug 的前缀（'33' 匹配 '33-偏导数'；'qr' 匹配 'qr分解'）
    #    要求 anchor 后面跟 '-' 或中文字符（避免 '3' 匹配 '32-积分'）
    for slug, _ in headings:
        if slug.startswith(a):
            rest = slug[len(a):]
            if rest == "" or rest[0] == "-" or ord(rest[0]) > 127:
                return slug
    return None


def find_term_anchor(term: str, headings: list[tuple[str, str]]) -> str | None:
    """用术语文本在标题里找最匹配的 heading id。
    优先级：标题==术语 > 标题以术语结尾（'3.2 积分' vs '积分'）> 标题包含术语。"""
    # 1. 标题恰好等于术语
    for slug, title in headings:
        if title == term:
            return slug
    # 2. 标题以术语结尾（'3.2 积分' 结尾是 '积分'；排除 '积分基础' 这类以术语开头的）
    for slug, title in headings:
        if title.endswith(term) and len(title) > len(term):
            return slug
    # 3. 标题包含术语（'积分基础' 包含 '积分'）
    for slug, title in headings:
        if term in title:
            return slug
    # 4. 术语包含标题
    for slug, title in headings:
        if title in term:
            return slug
    return None


def remap(index_path: Path, content_dir: Path) -> int:
    text = index_path.read_text(encoding="utf-8")
    book_dir = index_path.parent

    # 预提取各章节的 heading（缓存）
    heading_cache: dict[str, list[tuple[str, str]]] = {}

    def get_headings(chapter: str) -> list[tuple[str, str]]:
        if chapter not in heading_cache:
            heading_cache[chapter] = extract_headings(book_dir / chapter)
        return heading_cache[chapter]

    # 匹配 [术语](chXX.md#anchor)
    pattern = re.compile(r"\[([^\]]+)\]\((ch\d+\.md)(#[^)]*)?\)")

    stats = {"named": 0, "term": 0, "miss": 0, "noanchor": 0}

    def repl(m: re.Match) -> str:
        term = m.group(1)
        chapter = m.group(2)
        anchor = (m.group(3) or "").lstrip("#")

        if not anchor:
            stats["noanchor"] += 1
            return m.group(0)

        headings = get_headings(chapter)

        # 命名锚（不以 _ 开头）：gamma, 33, black-scholes, lu, qr
        if not anchor.startswith("_"):
            slug = find_named_anchor(anchor, headings)
            if slug:
                stats["named"] += 1
                return f"[{term}]({chapter}#{slug})"
            # 命名锚匹配失败 → 回退到术语搜索（如 #3 实指 '3.2 积分'）
            slug = find_term_anchor(term, headings)
            if slug:
                stats["term"] += 1
                return f"[{term}]({chapter}#{slug})"
        else:
            # 顺序锚 _N：用术语文本搜索
            slug = find_term_anchor(term, headings)
            if slug:
                stats["term"] += 1
                return f"[{term}]({chapter}#{slug})"

        # 未匹配：保留原锚（指向页面顶部，#_N 在 Hugo 无效但 #xxx 命名的可能仍部分可用）
        stats["miss"] += 1
        print(f"  MISS: [{term}]({chapter}#{anchor})")
        return f"[{term}]({chapter})"  # 退化为页面链接，避免死链

    new_text = pattern.sub(repl, text)

    index_path.write_text(new_text, encoding="utf-8")
    print(f"\n重映射完成: 命名锚={stats['named']}, 术语匹配={stats['term']}, "
          f"未匹配={stats['miss']}, 无锚={stats['noanchor']}")
    return stats["miss"]


def main() -> int:
    content_dir = Path("content").resolve()
    index_path = content_dir / "books/quant-finance-interview/index_term.md"
    if not index_path.exists():
        print(f"找不到 {index_path}", file=sys.stderr)
        return 1
    misses = remap(index_path, content_dir)
    return 0  # 不因 miss 而失败退出


if __name__ == "__main__":
    sys.exit(main())
