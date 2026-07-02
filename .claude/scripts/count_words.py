#!/usr/bin/env python3
"""Markdown 字数统计工具 —— 剥离 front matter / 代码 / 公式 / shortcode 后统计正文。

用法:
  python3 .claude/scripts/count_words.py content/notes/linear-response-theory-foundations.md
  python3 .claude/scripts/count_words.py content/notes/           # 统计目录下所有 .md
  python3 .claude/scripts/count_words.py content/notes/ -d        # 逐文件明细
"""

import re
import sys
from pathlib import Path


def strip_front_matter(text: str) -> str:
    """剥离 YAML front matter（开头的 --- ... ---）"""
    return re.sub(r'^---\n.*?\n---\n', '', text, count=1, flags=re.DOTALL)


def strip_math(text: str) -> str:
    """剥离 LaTeX 数学公式（行间 $$...$$ 和行内 $...$）"""
    text = re.sub(r'\$\$.*?\$\$', '', text, flags=re.DOTALL)  # 行间
    text = re.sub(r'\$(?!\$).*?\$', '', text)                  # 行内（不匹配 $$）
    return text


def strip_code(text: str) -> str:
    """剥离 Markdown 代码块和行内代码"""
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)  # 围栏代码块
    text = re.sub(r'`[^`]+`', '', text)                       # 行内代码
    return text


def strip_shortcodes(text: str) -> str:
    """剥离 Hugo shortcode {{< ... >}} 和 {{% ... %}}"""
    text = re.sub(r'\{\{[<%] .*?[>%]\}\}', '', text, flags=re.DOTALL)
    return text


def strip_html_comments(text: str) -> str:
    """剥离 HTML 注释 <!-- ... -->"""
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    return text


def strip_markdown_syntax(text: str) -> str:
    """剥离常见 Markdown 语法符号（链接、图片、标题标记、列表标记、表格分隔等）"""
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)     # 图片
    text = re.sub(r'\[([^\]]*)\]\([^\)]*\)', r'\1', text)  # 链接保留文本
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)  # 标题 #
    text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)  # 列表
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)  # 编号列表
    text = re.sub(r'^[\|\s\-:]+$', '', text, flags=re.MULTILINE)  # 表格分隔行
    text = re.sub(r'[*_~]{1,3}', '', text)            # 粗体/斜体/删除线
    return text


def count_stats(text: str) -> dict:
    """统计正文文本的各种计数"""
    # 中文字符
    cjk = len(re.findall(r'[一-鿿㐀-䶿豈-﫿]', text))
    # 中文标点
    cjk_punct = len(re.findall(r'[　-〿＀-￯]', text))
    # 英文单词（连续的字母序列）
    words = len(re.findall(r'[a-zA-Z]+', text))
    # 数字
    digits = len(re.findall(r'\d+', text))
    # 总非空白字符
    total = len(re.sub(r'\s+', '', text))

    return {
        "chinese_chars": cjk,
        "chinese_punct": cjk_punct,
        "english_words": words,
        "digit_tokens": digits,
        "total_non_ws": total,
    }


def analyze_file(filepath: Path) -> dict | None:
    """分析单个文件，返回统计字典"""
    try:
        raw = filepath.read_text(encoding='utf-8')
    except Exception as e:
        print(f"  [skip] {filepath.name}: {e}", file=sys.stderr)
        return None

    # 统计原始文件的公式和代码块数量
    math_display = len(re.findall(r'\$\$', raw)) // 2
    math_inline  = len(re.findall(r'(?<!\$)\$(?!\$).*?(?<!\$)\$(?!\$)', raw))
    code_blocks  = len(re.findall(r'```', raw)) // 2

    # 逐步剥离
    text = strip_front_matter(raw)
    text = strip_html_comments(text)
    text = strip_shortcodes(text)
    text = strip_code(text)
    text = strip_math(text)
    text = strip_markdown_syntax(text)

    stats = count_stats(text)
    stats["file"] = str(filepath)
    stats["math_display"] = math_display
    stats["math_inline"] = math_inline
    stats["code_blocks"] = code_blocks
    return stats


def format_stats(stats: dict, show_file: bool = False) -> str:
    """格式化输出单文件统计"""
    lines = []
    if show_file:
        lines.append(f"\n  {stats['file']}")
    lines.append(f"  中文字符:     {stats['chinese_chars']:>6}")
    lines.append(f"  中文标点:     {stats['chinese_punct']:>6}")
    lines.append(f"  英文单词:     {stats['english_words']:>6}")
    lines.append(f"  数字标记:     {stats['digit_tokens']:>6}")
    lines.append(f"  正文非空字符: {stats['total_non_ws']:>6}")
    # 粗略估计"可读字数" = 中文字符+中文标点+英文单词+数字
    readable = stats['chinese_chars'] + stats['chinese_punct'] + stats['english_words'] + stats['digit_tokens']
    lines.append(f"  ≈ 可读字数:   {readable:>6}")
    lines.append(f"  行间公式:     {stats['math_display']:>6} 个")
    lines.append(f"  行内公式:     {stats['math_inline']:>6} 个")
    lines.append(f"  代码块:       {stats['code_blocks']:>6} 个")
    return "\n".join(lines)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    detail = '-d' in sys.argv

    if not args:
        print("用法: python3 count_words.py <file.md|dir/> [-d]", file=sys.stderr)
        sys.exit(1)

    target = Path(args[0])
    if not target.exists():
        print(f"路径不存在: {target}", file=sys.stderr)
        sys.exit(1)

    if target.is_file():
        stats = analyze_file(target)
        if stats:
            print(format_stats(stats))
    elif target.is_dir():
        md_files = sorted(target.rglob("*.md"))
        if not md_files:
            print(f"目录下无 .md 文件: {target}", file=sys.stderr)
            sys.exit(1)

        all_stats = []
        for f in md_files:
            s = analyze_file(f)
            if s:
                all_stats.append(s)
                if detail:
                    print(format_stats(s, show_file=True))

        # 汇总
        total = {
            "chinese_chars": sum(s["chinese_chars"] for s in all_stats),
            "chinese_punct": sum(s["chinese_punct"] for s in all_stats),
            "english_words": sum(s["english_words"] for s in all_stats),
            "digit_tokens": sum(s["digit_tokens"] for s in all_stats),
            "total_non_ws": sum(s["total_non_ws"] for s in all_stats),
            "math_display": sum(s["math_display"] for s in all_stats),
            "math_inline": sum(s["math_inline"] for s in all_stats),
            "code_blocks": sum(s["code_blocks"] for s in all_stats),
        }
        print(f"\n  ── 合计 ({len(all_stats)} 个文件) ──")
        print(format_stats({**total, "file": "total"}))


if __name__ == "__main__":
    main()
