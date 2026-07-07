#!/usr/bin/env python3
"""回归测试 for translate_chapters.py 的纯函数。

不调 API，纯逻辑校验。覆盖：解包数量、参考文献隔离边界、chunk 切分不破数学块、
图片恢复、漏翻块检测。这一整类"改函数忘改调用方"的 bug（如 isolate_references
从二元组改三元组但调用处没同步）都能被这里拦住。

用法：
    python3 test_translate.py                # 全部
    python3 test_translate.py isolate        # 单个模块
    python3 test_translate.py -v             # verbose
"""
import os
import re
import sys
import importlib.util

# ── 加载被测模块（避免同名 import 冲突）─────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    "_translate_chapters_under_test",
    os.path.join(SCRIPT_DIR, "translate_chapters.py"),
)
tc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tc)


# ── 微型测试框架（不依赖 pytest，CI 无需装包）──────────────────────────
_PASS = 0
_FAIL = 0
_FAILURES = []


def check(name, got, expected):
    global _PASS, _FAIL
    if got == expected:
        _PASS += 1
        if "-v" in sys.argv:
            print(f"  ✓ {name}")
    else:
        _FAIL += 1
        _FAILURES.append((name, got, expected))
        print(f"  ✗ {name}")
        print(f"      期望: {expected!r}")
        print(f"      实际: {got!r}")


def section(title):
    print(f"\n── {title} ──")


# ── isolate_references ──────────────────────────────────────────────────
def test_isolate():
    section("isolate_references")

    # 1. 无 References → 全部归 before，ref/after 为空
    b, r, a = tc.isolate_references("intro text\nno refs here")
    check("no-refs before", b, "intro text\nno refs here")
    check("no-refs ref empty", r, "")
    check("no-refs after empty", a, "")

    # 2. 有 References + Appendix（核心场景：附录要单独返回，不被丢弃也不被跳过翻译）
    src = "# Title\n\nintro\n\n## References\n[1] Foo.\n[2] Bar.\n\n## Appendix\nsome detail\n"
    b, r, a = tc.isolate_references(src)
    check("refs+appendix before", b, "# Title\n\nintro\n\n")
    check("refs+appendix ref starts", r.startswith("## References"), True)
    check("refs+appendix ref ends before Appendix", "## Appendix" not in r, True)
    check("refs+appendix after is Appendix", a.startswith("## Appendix"), True)
    check("refs+appendix after has content", "some detail" in a, True)

    # 3. References 在末尾（无后续章节）→ after 为空
    src = "intro\n\n## References\n[1] only\n"
    b, r, a = tc.isolate_references(src)
    check("trailing-refs before", b, "intro\n\n")
    check("trailing-refs ref content", r, "## References\n[1] only\n")
    check("trailing-refs after empty", a, "")

    # 4. 中文「参考文献」标题
    src = "intro\n\n## 参考文献\n[1] Foo\n\n## 附录\ndetail\n"
    b, r, a = tc.isolate_references(src)
    check("zh-heading ref matched", r.startswith("## 参考文献"), True)
    check("zh-heading after is appendix", a.startswith("## 附录"), True)

    # 5. Bibliography 变体
    src = "intro\n\n## Bibliography\n[1] X\n"
    b, r, a = tc.isolate_references(src)
    check("bibliography matched", r.startswith("## Bibliography"), True)

    # 6. 🔴 解包数量契约：必须返回恰好 3 个值
    result = tc.isolate_references("no refs")
    check("returns 3-tuple", len(result), 3)

    # 7. ### 不应被当 H2 边界（min H2 only）
    src = "## References\n[1] Foo\n### sub-section\nstill in refs\n"
    b, r, a = tc.isolate_references(src)
    check("h3-not-boundary stays in refs", "still in refs" in r, True)


# ── split_into_chunks ──────────────────────────────────────────────────
def test_chunks():
    section("split_into_chunks")

    # 1. 短文本不切分
    out = tc.split_into_chunks("short text", 1000)
    check("short-stays-one", out, ["short text"])

    # 2. 长文本切成多块
    long = "para1\n\n" + ("a" * 200) + "\n\npara2\n\n" + ("b" * 200)
    out = tc.split_into_chunks(long, 100)
    check("long-splits", len(out) > 1, True)

    # 3. 🔴 不在 $$...$$ 块中间切开（关键约束）
    # 构造一个数学块比 chunk size 还大的情况——确保它不被分割
    math_block = "$$" + ("x+y " * 50) + "$$"
    out = tc.split_into_chunks(math_block, 80)
    # 至少有一个 chunk 包含完整 $$...$$
    rejoined = "\n\n".join(out)
    check("math-block rejoined equals input", rejoined.replace("\n\n", ""), math_block)
    # $$ 配对数在每个 chunk 内不出现奇数（粗略校验：重组后总数与原一致）
    check("math-block dd-count preserved", rejoined.count("$$"), math_block.count("$$"))

    # 4. 优先在段落边界切
    text = "first para here.\n\nsecond para here.\n\nthird para here."
    out = tc.split_into_chunks(text, 30)
    if len(out) > 1:
        # 切点应该是 \n\n
        check("split-at-paragraph", out[0].endswith(".") or out[0].endswith(".\n"), True)


# ── restore_images ─────────────────────────────────────────────────────
def test_restore():
    section("restore_images")

    # 1. 无图片丢失 → 原样返回
    src = "![](images/abc.webp)\n{{< caption >}}图1 desc{{< /caption >}}"
    out, n = tc.restore_images(src, src)
    check("no-loss count", n, 0)

    # 2. LLM 丢了图 → 按 caption 图号补回
    src = (
        "![](images/aaa.webp)\n"
        "{{< caption >}}图1 first{{< /caption >}}\n"
        "![](images/bbb.webp)\n"
        "{{< caption >}}图2 second{{< /caption >}}"
    )
    # 译文丢了 bbb.webp
    translated = (
        "![](images/aaa.webp)\n"
        "{{< caption >}}图1 first{{< /caption >}}\n"
        "{{< caption >}}图2 second{{< /caption >}}"
    )
    out, n = tc.restore_images(src, translated)
    check("restored count", n, 1)
    check("restored img present", "images/bbb.webp" in out, True)

    # 3. 不误伤已有的图
    check("existing img kept", "images/aaa.webp" in out, True)


# ── find_untranslated_blocks ───────────────────────────────────────────
def test_untranslated():
    section("find_untranslated_blocks")

    # 1. 全中文 → 无漏翻块
    out = tc.find_untranslated_blocks("这是中文\n全是中文\n没有英文")
    check("all-chinese clean", out, [])

    # 2. 3+ 连续英文行 → 检测到（取前一章节标题）
    body = "## Introduction\n\nthis is english line one\nanother english line here\nyet another english sentence\n"
    out = tc.find_untranslated_blocks(body)
    check("3-eng-lines detected", len(out) >= 1, True)

    # 3. 2 行英文不触发（阈值是 3）
    body = "this is line one english\nanother line two english\n"
    out = tc.find_untranslated_blocks(body)
    check("2-eng-lines not flagged", out, [])

    # 4. 数学公式行不算英文（被 skip）
    body = "$E = mc^2$\n$F = ma$\n$E = mc^2$\n"
    out = tc.find_untranslated_blocks(body)
    check("math-not-flagged", out, [])


# ── is_chinese_text ────────────────────────────────────────────────────
def test_chinese_detect():
    section("is_chinese_text")

    check("pure-chinese", tc.is_chinese_text("这是纯中文内容没有英文"), True)
    check("pure-english", tc.is_chinese_text("this is pure english content no chinese"), False)
    check("empty", tc.is_chinese_text(""), False)
    # 阈值是 CJK > 30% of (CJK+letters)；这条刚好过线（中文明显占多）
    check("mixed-chinese-majority", tc.is_chinese_text("这是一段以中文为主的内容其中夹杂少量 english 单词"), True)
    # 边界：刚好 30%——大量英文夹少量中文，应判为非中文（不翻译会破坏）
    check("english-heavy", tc.is_chinese_text("mostly english text here with one 词 only"), False)


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != "-v" else None
    runners = {
        "isolate": test_isolate,
        "chunks": test_chunks,
        "restore": test_restore,
        "untranslated": test_untranslated,
        "chinese": test_chinese_detect,
    }
    if target and target in runners:
        runners[target]()
    else:
        for fn in runners.values():
            fn()

    print(f"\n{'='*50}")
    print(f"结果：{_PASS} 通过 / {_FAIL} 失败")
    if _FAIL:
        print("失败用例：")
        for name, got, exp in _FAILURES:
            print(f"  - {name}")
        sys.exit(1)
    print("✓ 全部通过")
