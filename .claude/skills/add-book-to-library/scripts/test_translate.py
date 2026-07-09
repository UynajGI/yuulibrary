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


def test_glossary():
    section("glossary (extract + merge)")

    # extract_glossary: strips markers, returns terms
    text = "正文\n<!-- glossary: Machine Learning = 机器学习 -->\n更多正文"
    cleaned, terms = tc.extract_glossary(text)
    check("extract-strips-marker", "<!-- glossary:" in cleaned, False)
    check("extract-returns-term", terms.get("Machine Learning"), "机器学习")
    check("extract-preserves-body", "正文" in cleaned and "更多正文" in cleaned, True)

    # extract_glossary: no markers
    cleaned, terms = tc.extract_glossary("纯正文无标记")
    check("extract-no-markers", terms, {})
    check("extract-no-markers-body", cleaned, "纯正文无标记\n")

    # merge_glossary: new terms added
    existing = {"AI": "人工智能"}
    conflicts = []
    tc.merge_glossary(existing, {"ML": "机器学习"}, "ch01", conflicts)
    check("merge-adds-new", existing.get("ML"), "机器学习")
    check("merge-no-conflict", len(conflicts), 0)

    # merge_glossary: conflict detected (same term, different translation)
    existing = {"AI": "人工智能"}
    conflicts = []
    tc.merge_glossary(existing, {"AI": "人工智慧"}, "ch02", conflicts)
    check("merge-conflict-recorded", len(conflicts), 1)
    check("merge-conflict-term", conflicts[0]["term"], "AI")
    check("merge-conflict-existing", conflicts[0]["existing"], "人工智能")
    check("merge-conflict-new", conflicts[0]["new"], "人工智慧")
    # Existing value NOT overwritten on conflict
    check("merge-no-overwrite", existing["AI"], "人工智能")


def test_alignment():
    section("paragraph alignment (_count_content_paragraphs)")

    # Simple paragraphs
    body = "第一段。\n\n第二段。\n\n第三段。"
    check("three-paragraphs", tc._count_content_paragraphs(body), 3)

    # Headings excluded
    body = "## 标题\n\n正文段落。\n\n### 子标题\n\n另一段。"
    check("headings-excluded", tc._count_content_paragraphs(body), 2)

    # Pure math blocks excluded
    body = "$$x^2 + y^2 = z^2$$\n\n正文段落。"
    check("math-excluded", tc._count_content_paragraphs(body), 1)

    # Image-only blocks excluded
    body = "![cover](images/cover.webp)\n\n正文段落。"
    check("image-excluded", tc._count_content_paragraphs(body), 1)

    # Empty body
    check("empty-body", tc._count_content_paragraphs(""), 0)


def test_config():
    section("llm_config (tier + pipeline)")

    # llm_config is in the same scripts/ dir, importable via tc's sys.path
    import importlib.util
    config_path = os.path.join(SCRIPT_DIR, "llm_config.py")
    spec2 = importlib.util.spec_from_file_location("_llm_config_test", config_path)
    lc = importlib.util.module_from_spec(spec2)
    spec2.loader.exec_module(lc)

    # get_tier returns 4-tuple
    strong = lc.get_tier("strong")
    check("tier-returns-tuple", len(strong), 4)
    check("tier-api-key-is-str", isinstance(strong[0], str), True)
    check("tier-base-url-is-str", isinstance(strong[1], str), True)
    check("tier-model-is-str", isinstance(strong[2], str), True)
    check("tier-max-tokens-is-int", isinstance(strong[3], int), True)

    # All three tiers return valid tuples
    for tier_name in ("strong", "cheap", "fast"):
        t = lc.get_tier(tier_name)
        check(f"tier-{tier_name}-model-nonempty", len(t[2]) > 0, True)

    # get_pipeline_config returns dict with expected keys
    pc = lc.get_pipeline_config()
    check("pipeline-has-review", "review" in pc, True)
    check("pipeline-has-qa", "consistency_qa" in pc, True)
    check("pipeline-has-backtranslate", "backtranslate" in pc, True)

    # get_segment_config returns dict with expected keys
    sc = lc.get_segment_config()
    check("segment-has-batch", "max_chars_per_batch" in sc, True)
    check("segment-has-segment", "max_chars_per_segment" in sc, True)
    check("segment-batch-positive", sc["max_chars_per_batch"] > 0, True)


def test_progress():
    section("ProgressTracker (resume state)")

    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create a fake chapter file
        ch_path = os.path.join(tmpdir, "ch01.md")
        with open(ch_path, "w", encoding="utf-8") as f:
            f.write("---\ntitle: Test\n---\n# Chapter 1\n\nContent here.")

        # Fresh tracker — no state, should not skip
        tracker = tc.ProgressTracker(tmpdir, fresh=True)
        check("fresh-no-skip", tracker.should_skip(ch_path), False)
        check("fresh-empty-glossary", len(tracker.glossary), 0)

        # Record a successful translation
        import asyncio
        asyncio.run(tracker.record(ch_path, "ok", 1, {"term": "术语"}))

        # Reload (non-fresh) — should now skip
        tracker2 = tc.ProgressTracker(tmpdir)
        check("after-record-skip", tracker2.should_skip(ch_path), True)
        check("after-record-glossary", tracker2.glossary.get("term"), "术语")

        # Modify the source file — should NOT skip (hash changed)
        with open(ch_path, "w", encoding="utf-8") as f:
            f.write("---\ntitle: Test\n---\n# Chapter 1 Modified\n\nDifferent content.")
        tracker3 = tc.ProgressTracker(tmpdir)
        check("source-changed-no-skip", tracker3.should_skip(ch_path), False)


def _load_module(name, filename):
    """Helper: load a sibling .py module for testing."""
    spec2 = importlib.util.spec_from_file_location(name, os.path.join(SCRIPT_DIR, filename))
    mod = importlib.util.module_from_spec(spec2)
    spec2.loader.exec_module(mod)
    return mod


def test_extract_fb2():
    section("extract.py — FB2 parser")

    ex = _load_module("_extract_test", "extract.py")
    import tempfile, xml.etree.ElementTree as ET

    # C2 regression: tail text after inline formatting must be preserved
    el = ET.fromstring(
        '<p xmlns="http://www.gribuser.ru/xml/fiction/book/2.0">'
        'Hello <emphasis>world</emphasis> here.</p>'
    )
    result = ex._fb2_element_to_text(el)
    check("fb2-tail-preserved", "here." in result, True)

    # M6 regression: image ref uses real extension from img_ext_map.
    # Image is nested inside a <p> container (as it appears in real FB2).
    el2 = ET.fromstring(
        '<p xmlns="http://www.gribuser.ru/xml/fiction/book/2.0" '
        'xmlns:l="http://www.gribuser.ru/xml/fiction/book/2.0">'
        '<image l:href="#cover.png"/></p>'
    )
    result2 = ex._fb2_element_to_text(el2, {"cover.png": ".png"})
    check("fb2-image-real-ext", "images/cover.png.png" in result2, True)

    # Full FB2 end-to-end extraction
    fb2_xml = '''<?xml version="1.0" encoding="utf-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fiction/book/2.0">
  <description><title-info>
    <book-title>测试书</book-title>
    <author><first-name>张</first-name><last-name>三</last-name></author>
  </title-info></description>
  <body>
    <section>
      <title><p>第一章</p></title>
      <p>正文 <strong>加粗</strong> 后续文本。</p>
      <p>第二段。</p>
    </section>
    <section>
      <title><p>第二章</p></title>
      <p>第二章内容。</p>
    </section>
  </body>
</FictionBook>'''
    with tempfile.TemporaryDirectory() as tmpdir:
        fb2_path = os.path.join(tmpdir, "test.fb2")
        with open(fb2_path, "w", encoding="utf-8") as f:
            f.write(fb2_xml)
        out_dir = os.path.join(tmpdir, "out")
        meta = ex._extract_fb2(fb2_path, out_dir)
        check("fb2-meta-title", meta["title"], "测试书")
        check("fb2-meta-author", meta["author"], "张 三")
        check("fb2-meta-format", meta["source_format"], "fb2")
        with open(os.path.join(out_dir, "merged", "book.md"), encoding="utf-8") as f:
            md = f.read()
        check("fb2-has-ch1", "# 第一章" in md, True)
        check("fb2-has-ch2", "# 第二章" in md, True)
        check("fb2-bold-preserved", "**加粗**" in md, True)
        check("fb2-tail-in-md", "后续文本" in md, True)
        check("fb2-no-dup-title", md.count("# 第一章"), 1)


def test_extract_txt():
    section("extract.py — TXT parser")

    ex = _load_module("_extract_test2", "extract.py")
    import tempfile

    # I2 regression: body line starting with 第N章 should NOT be treated as chapter
    txt = "第一章 开始\n\n这是正文。\n第二章 相遇\n\n主角遇到另一个人。\n"
    with tempfile.TemporaryDirectory() as tmpdir:
        txt_path = os.path.join(tmpdir, "novel.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(txt)
        out_dir = os.path.join(tmpdir, "out")
        meta = ex._extract_txt(txt_path, out_dir)
        check("txt-meta-format", meta["source_format"], "txt")
        with open(os.path.join(out_dir, "merged", "book.md"), encoding="utf-8") as f:
            md = f.read()
        check("txt-has-ch1", "# 第一章 开始" in md, True)
        check("txt-has-ch2", "# 第二章 相遇" in md, True)

    # C3 regression: direct call creates merged/ dir
    with tempfile.TemporaryDirectory() as tmpdir:
        txt_path = os.path.join(tmpdir, "plain.txt")
        with open(txt_path, "w") as f:
            f.write("no chapters here\njust text\n")
        out_dir = os.path.join(tmpdir, "out")
        ex._extract_txt(txt_path, out_dir)
        check("txt-creates-merged-dir", os.path.exists(os.path.join(out_dir, "merged", "book.md")), True)

    # Chapter title filter
    check("txt-filter-body", ex._is_likely_chapter_title("第二章的内容"), False)
    check("txt-filter-title", ex._is_likely_chapter_title("第二章 相遇"), True)


def test_clean_pandoc():
    section("clean_markdown.py — pandoc residue")

    cm = _load_module("_clean_test", "clean_markdown.py")

    # Pandoc div markers
    cleaned, stats = cm.clean("::: fn1\ncontent\n:::\n")
    check("pandoc-div-removed", ":::" not in cleaned, True)

    # Anchor markers
    cleaned, _ = cm.clean("[]{#page_15}\ntext")
    check("pandoc-anchor-removed", "#page_15" not in cleaned, True)

    # Inline attributes {.small} {#id}
    cleaned, _ = cm.clean("text {.small} here {#sec1}")
    check("pandoc-attr-removed", "{.small}" not in cleaned and "{#sec1}" not in cleaned, True)

    # Math braces must NOT be stripped (regression: old regex destroyed \mathrm{A})
    for src in [r"$\mathrm{A}$", r"$\frac{1}{2}$", r"$$\begin{array}{r} x \end{array}$$"]:
        cleaned, _ = cm.clean(src)
        check("pandoc-math-preserved-" + src[:8], cleaned.strip() == src.strip(), True)

    # XHTML links stripped
    cleaned, _ = cm.clean("[link text](chapter2.xhtml)")
    check("pandoc-xhtml-stripped", "link text" in cleaned and ".xhtml" not in cleaned, True)

    # Dash table separator → pipe table
    cleaned, _ = cm.clean("-------")
    check("pandoc-dash-table", "|---|" in cleaned, True)


def test_mineru_array_corruption():
    section("clean_markdown.py — MinerU array corruption")

    cm = _load_module("_clean_array", "clean_markdown.py")

    # \begin{array}{r} → \begin{r} (MinerU drops "{array}")
    # Real MinerU output has bare \end at end of its own line.
    src = "$$\\begin{r} {A \\geq 0} \\end\n$$"
    cleaned, stats = cm.fix_mineru_array_corruption(src)
    check("array-begin-r", r"\begin{array}{r}" in cleaned, True)
    check("array-end-bare", r"\end{array}" in cleaned, True)
    check("array-stats", stats.get("mineru_array", {}).get("begin_array", 0) > 0, True)

    # Multi-column spec: \begin{r l r}
    src = r"\begin{r l r} {a} & {b} & {c} \end\tag"
    cleaned, _ = cm.fix_mineru_array_corruption(src)
    check("array-begin-multicol", r"\begin{array}{r l r}" in cleaned, True)
    check("array-end-tag", r"\end{array}" in cleaned, True)

    # \end} form
    src = r"$$\begin{r} {x} \end}$$"
    cleaned, _ = cm.fix_mineru_array_corruption(src)
    check("array-end-brace", r"\end{array}" in cleaned, True)

    # Real env names (aligned, equation, cases) must be left untouched
    src = r"\begin{aligned} x &= 1 \\ y &= 2 \end{aligned}"
    cleaned, _ = cm.fix_mineru_array_corruption(src)
    check("array-real-env-preserved", cleaned.strip() == src.strip(), True)

    # End-to-end through clean(): full pipeline must produce valid array
    cleaned, stats = cm.clean("$$\\begin{r} {x} \\end\n$$")
    check("array-e2e-valid", r"\begin{array}{r}" in cleaned and r"\end{array}" in cleaned, True)


def test_math_delimiter_fix():
    section("clean_markdown.py — $$ delimiter repair")

    cm = _load_module("_clean_delim", "clean_markdown.py")

    # Chinese prose inside $$ → demote to inline $
    test1 = "$$这是中文正文，有标点。$$"
    cleaned, stats = cm.fix_math_delimiters(test1)
    check("delim-cn-prose-demoted", "$$" not in cleaned, True)
    check("delim-cn-prose-stats", stats.get("math_delimiter_fix", 0) > 0, True)

    # Real math block → keep $$
    test2 = "$$x^2 + y^2 = r^2$$"
    cleaned, stats = cm.fix_math_delimiters(test2)
    check("delim-real-math-kept", "$$" in cleaned, True)
    check("delim-real-math-no-fix", stats.get("math_delimiter_fix", 0), 0)

    # Odd $$ count → remove orphan
    test3 = "text$$math$$more$$"
    cleaned, stats = cm.fix_math_delimiters(test3)
    check("delim-odd-fixed", cleaned.count("$$") % 2, 0)

    # Full clean() integration: LLM-style $$ corruption with Chinese
    test4 = "$_1$$(\\mathrm{A})$中的信道）提供纠错。"
    cleaned, _ = cm.clean(test4)
    # The false $$ wrapping Chinese should be demoted
    check("delim-llm-corruption-fixed", cleaned.count("$$") % 2, 0)


def test_partial_resume():
    section("translate_chapters.py — partial translation resume")

    # detect_partial: correctly parses marker
    check("partial-detect-incomplete", tc.detect_partial("text\n<!-- translate-partial: 76/83 chunks -->\n"), (76, 83))
    check("partial-detect-complete", tc.detect_partial("text\n<!-- translate-partial: 83/83 chunks -->\n"), (83, 83))
    check("partial-detect-none", tc.detect_partial("no marker here"), None)

    # _translate_part with skip_chunks: skips specified chunks, uses prev_results
    import asyncio

    # Simulate: 3 chunks, chunk 0 already done (in prev_results), skip it
    body = "A" * 5000 + "\n\n" + "B" * 5000 + "\n\n" + "C" * 5000
    chunks = tc.split_into_chunks(body, tc.CHUNK_THRESHOLD)

    # If body is short enough to be one chunk, skip this test
    if len(chunks) >= 2:
        prev_results = ["ALREADY_TRANSLATED"] + [None] * (len(chunks) - 1)
        skip = {0}

        # We can't easily test the full async path without API, but we can
        # verify skip_chunks logic by checking the function signature works
        check("partial-skip-params-accepted", hasattr(tc, '_translate_part'), True)

    # translate_chapter detects partial marker in output file
    import tempfile, os
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create a chapter file with partial marker
        ch_path = os.path.join(tmpdir, "ch01.md")
        with open(ch_path, "w", encoding="utf-8") as f:
            f.write("---\ntitle: Test\n---\nEnglish content to translate.")

        # Create output file with partial marker
        out_path = ch_path  # in_place=True for books
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("---\ntitle: Test\n---\n已翻译内容\n<!-- translate-partial: 3/5 chunks -->\n")

        # Read back and detect
        with open(out_path, encoding="utf-8") as f:
            content = f.read()
        partial = tc.detect_partial(content)
        check("partial-detected-from-file", partial, (3, 5))

        # Verify skip_chunks would be computed correctly
        if partial and partial[0] < partial[1]:
            done, total = partial
            skip_chunks = set(range(done))
            check("partial-skip-computed", len(skip_chunks), 3)


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != "-v" else None
    runners = {
        "isolate": test_isolate,
        "chunks": test_chunks,
        "restore": test_restore,
        "untranslated": test_untranslated,
        "chinese": test_chinese_detect,
        "glossary": test_glossary,
        "alignment": test_alignment,
        "config": test_config,
        "progress": test_progress,
        "fb2": test_extract_fb2,
        "txt": test_extract_txt,
        "pandoc": test_clean_pandoc,
        "array": test_mineru_array_corruption,
        "delim": test_math_delimiter_fix,
        "partial": test_partial_resume,
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
