# 内容工作流

> 面向想加自己的书 / 论文 / 笔记的 fork 者。
>
> 完整 AI 协作 SOP(Phase 编号、红线、spot-check agent)见各 skill 的 `SKILL.md`,本文档是人类可读的总览。

## 加书

完整流程见 [`.claude/skills/add-book-to-library/SKILL.md`](../.claude/skills/add-book-to-library/SKILL.md)。

### 流程

```
PDF/EPUB/DOCX/FB2/TXT 源
  → extract.py 统一提取(按格式路由: PDF/DOCX→MinerU, EPUB→pandoc, FB2→XML, TXT→编码检测+切分)
  → clean_markdown.py 清洗(删噪声 + 修 LaTeX 碎片 + 图注配对 + pandoc/FB2 残留)
  → translate_chapters.py 翻译(英文→中文,种子章建术语表 + 并发 + 断点续跑 + 一致性 QA)
  → validate_book.py 验证(36 项)
  → content/books/<slug>/(_index.md + ch01.md ~ chNN.md + images/)
```

支持的输入格式:
- **PDF** — MinerU VLM 提取(公式/表格保真度高),大书分批 `--pages`
- **DOCX** — MinerU VLM 提取(原生支持,同 PDF 路径)
- **EPUB** — unzip + pandoc(无需 VLM,瞬时 + 免费)
- **FB2** — XML 解析(俄语小说常见格式,结构化好解析)
- **TXT** — 编码检测(UTF-8/GBK/Big5/Shift-JIS) + 章节启发式切分

### 关键约定

- **目录扁平**:每本书 `content/books/<slug>/` 一个子目录,**无分类中间目录**。`<slug>` 用书名英文化(如 `rl-intro`、`algo-trading`)
- **`_index.md` 必填字段**:`title` / `description` / `date` / `author` / `tags` / `category`。`date` 写添加当天(如 `2026-07-08`),驱动书架"入库"排序
- **章节文件**:`ch01.md` 起,front matter 含 `title` / `weight` / `description`
- **标题层级**:`#` 章 → `##` 节 → `###` 子节(小标题必须用 markdown,不能纯文本)
- **英文书必须翻译成中文**:用 `translate_chapters.py` workflow 脚本
- **图片全 WebP**:用 `convert_to_webp.sh` 批量转,放 `images/` 子目录,相对路径引用
- **🔴 日期**:`date` 写当天带时区（如 `2026-07-09T08:00:00+08:00`），或 `date: 2026-07-09`（仅当 UTC 已过当日）。stats.html 优先用 git commit 时间回退。详见 [deployment.md#故障排查](deployment.md#故障排查)

### 分类

`category` 字段管书架路由(书籍自定义如 `quant`/`ml`/`physics`/`philosophy`)。分类定义在 `data/book_categories.json`(含 `name_zh` 显示名 + `hidden` 隐藏标记)。`category` 与 `tags` 完全解耦。

---

## 加论文

完整流程见 [`.claude/skills/add-paper-to-library/SKILL.md`](../.claude/skills/add-paper-to-library/SKILL.md)。

论文比书简单(不拆章、不上首页书架)。提取同样用 MinerU pipeline（非 VLM）。

### 流程

```
论文 PDF
  → pdf2doi 提取 DOI/arXiv ID + 元数据
  → 去重检查(grep 已有论文)
  → MinerU 提取(或复用已有提取)
  → clean_markdown.py 清洗
  → translate_chapters.py 翻译(输出 .zh.md,不碰源文件)
  → generate_paper_note.py 结构化分析(7 栏目)+ 组装 _index.md
  → content/papers/<slug>/(_index.md + images/)
```

### 关键约定

- **`_index.md`**(不是普通 `.md`):单篇论文一个 section
- **`category` 是 arXiv 一级分类数组**(如 `["quant-ph"]`、`["quant-ph", "cond-mat"]`),查 `data/arxiv_categories.json`。多归属
- **全部图片带上**:论文全文翻译了,图片是正文一部分
- **LaTeX 公式 100% 原样**:翻译时不动 `$...$` / `$$...$$` / `\tag{N}`。**不要用 `\[...\]` / `\(...\)`**——KaTeX 不渲染
- **🔴 日期**:同书,`date` 写当天带时区

### 结构化分析 7 栏目

`generate_paper_note.py` 用 ReAct(LLM + read_section 工具)生成:
1. 一句话概括
2. 核心论证链
3. 实验参数详解
4. 批判性思考
5. 局限性
6. 关键公式速查
7. 术语对照

---

## 加笔记

完整流程见 [`.claude/skills/add-note-to-library/SKILL.md`](../.claude/skills/add-note-to-library/SKILL.md)。

从书/论文蒸馏思维框架,无需外部 skill 依赖。

### 流程

```
已入库的书/论文(或外部 PDF 先入库)
  → LLM 通读原文 → 提炼核心思维框架、决策启发式、表达 DNA
  → content/notes/<slug>.md
```

### 关键约定

- **扁平存放**:每篇一个 `.md`,不用子目录
- **front matter 必须**:`title` / `description` / `date`(当天带时区)/ `author` / `source_type` / `source_title` / `tags` / `weight`
- **内容结构**:一句话概括 / 核心思维框架 / 决策启发式 / 表达 DNA / 批判性思考 / 关键引用
- **善用已有 JS**:rough.js 手绘图(`{{< rough-canvas >}}`)、pseudocode.js 算法(`{{< algorithm >}}`)、KaTeX 数学、mermaid 流程图
- **不手动分类**:笔记按 `date` 自动时间排序,无需按主题分组

---

## scripts/ 索引

| 脚本 | 进 git? | 用途 |
|------|---------|------|
| `build_pageindex.py` | ✅ | 构建 PageIndex 索引 JSON(lefthook + CI 都调) |
| `release.sh` | ✅ | 算下一个发布 tag(`YYYY.MM.DD.NN`),只读 |
| `check_latex_render.py` | ✅ | lefthook latex-render hook 实现(表格裸 `\|` + display math 行首 `+`/`-`) |
| `migrate_mkdocs_to_hugo.py` | ✅ | 一次性迁移脚本(mkdocs→Hugo,历史包袱) |
| `remap_index_anchors.py` | ✅ | 重映射 index 锚点 |
| `fix_display_math.py` | ❌(本地) | 修复 display math 格式 |
| `count_words.py`(在 `.claude/scripts/`) | ❌(本地) | Markdown 字数统计 |

> `.gitignore` 排除 `scripts/*`,只白名单上述前 3 个 + 历史 2 个。fork 者拿到的 `scripts/` 与此表一致。

### skill 脚本(`.claude/skills/*/scripts/`)

| 脚本 | 用途 |
|------|------|
| `add-book-to-library/scripts/translate_chapters.py` | 翻译英文 MD → 中文(种子章建术语表 + 并发 + validate 重试 + 图片引用丢失自动补回) |
| `add-book-to-library/scripts/clean_markdown.py` | 统一清洗(book + paper):噪声删除 + LaTeX 碎片修复 + 图注配对 + 标题层级 |
| `add-book-to-library/scripts/convert_xrefs.py` | 纯 regex 交叉引用转换(「第N章」→ markdown 链接 `ch0N.md`,补零可靠) |
| `add-book-to-library/scripts/format_theorems.py` | 数学教材段落级定理/定义加粗(MinerU 不标标题,幂等) |
| `add-book-to-library/scripts/convert_to_webp.sh` | 批量 JPG/PNG → WebP + 改 .md 引用 |
| `add-book-to-library/scripts/validate_book.py` | 36 项机械验证(12 Error + 19 Warning + 5 Review) |
| `add-book-to-library/scripts/test_translate.py` | 翻译脚本纯函数回归测试(34 用例,零依赖) |
| `add-paper-to-library/scripts/generate_paper_note.py` | 论文结构化分析(ReAct 7 栏目)+ cross-link + 组装 `_index.md` |
