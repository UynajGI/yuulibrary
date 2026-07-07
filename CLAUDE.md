# Yuunagi Library

个人的数字图书馆。Hugo + Hugo Book 主题多书站点，托管于 GitHub Pages。

## 常用命令

```bash
hugo server -p 1314 --bind 127.0.0.1    # 本地预览（http://localhost:1314/yuulibrary/）
hugo --gc --minify                        # 生产构建到 public/
python scripts/build_pageindex.py         # 构建 PageIndex 索引（hugo 前必须跑）
```

## 目录结构

```
yuulibrary/
├── hugo.toml                     # 主配置
├── content/
│   ├── _index.md                 # 图书馆首页（卡片式书单）
│   ├── books/
│   │   ├── rl-intro/             # 扁平存放，按书名 slug
│   │   │   ├── _index.md         # 封面 + 目录（section 列表页）
│   │   │   ├── ch01.md ~ ...     # 章节（front matter: title/weight/description）
│   │   │   ├── index_term.md     # 索引
│   │   │   └── images/           # 图片（与 .md 同级，相对路径引用）
│   │   ├── algo-trading/         # 无分类中间目录
│   │   ├── options-futures-derivatives/
│   │   ├── python-for-finance/
│   │   └── quant-finance-interview/
│   ├── notes/                    # 笔记（扁平存放，每篇一个 .md）
│   │   ├── _index.md             # section 定义
│   │   ├── <slug>.md             # 笔记正文（title/description/date/author/tags/weight）
│   ├── papers/                   # 论文笔记（arXiv 一级 category 数组，带 author/year/tags）
│   └── _reference/               # 元素模板速查（_ 前缀，菜单隐藏）
├── layouts/
│   ├── _shortcodes/              # book-toc/callout/definition/theorem/example 等
│   └── _partials/docs/inject/head.html  # KaTeX + pseudocode.js 加载
├── assets/custom.scss            # 全局样式
├── static/
│   ├── katex/ + pseudocode/ + rough.min.js  # 本地化数学/算法/手绘渲染
│   ├── chat/chat.js + chat.css              # AI 问答 Agent（BYOK 浏览器直连）
│   └── pageindex/                           # PageIndex 树索引 JSON（进 git，含 summary + line_num）
├── data/                       # Hugo data（symlink → .claude/skills/*/data/）
├── scripts/build_pageindex.py               # PageIndex 索引构建脚本
├── .claude/skills/add-book-to-library/   # 加书 skill（clean_markdown.py / translate_chapters.py / format_theorems.py / convert_xrefs.py / validate_book.py）
├── .claude/skills/add-paper-to-library/  # 加论文 skill（generate_paper_note.py）
├── .claude/skills/add-note-to-library/   # 加笔记 skill
├── .claude/scripts/count_words.py        # Markdown 字数统计
├── .github/workflows/deploy.yml  # push main → 自动部署
└── pdfs/                         # 源文件（本地，gitignore）
    ├── books/                   # 书籍 PDF/EPUB + 状态文件 + 提取输出
    ├── papers/                  # 论文 PDF
    └── archive/                 # 已完成（加书完成后移入源文件 + 状态 + -out/）
```

## 添加新书

完整流程见 `.claude/skills/add-book-to-library/SKILL.md`。核心步骤：

1. MinerU VLM 提取 PDF / EPUB 解包转换 → 合并 → 清洗（**EPUB pandoc 残留必须清理**：`::: fn1` / `::: blk1` / `[]{#page}` / `{.class}` / `-----` 表格分隔符）
2. 在 `content/books/<book-slug>/` 下创建扁平目录（**无分类子目录**）
3. `_index.md`：`<section class="book-cover">` + `{{< book-toc >}}`，**front matter 必填 `description` + `tags` + `author` + `date` + `category`**。`date` 写添加当天（如 `date: 2026-07-07`），驱动书架"入库"排序
4. 每章文件 `ch01.md` 起，**front matter 含 `description`**：
   ```yaml
   ---
   title: "第1章 · 引言"
   weight: 10
   description: "收益计算、风险评估——投资决策的基础。"
   ---
   ```
5. 标题层级：`#` 章 → `##` 节 → `###` 子节（**小标题必须用 markdown 格式，不能是纯文本**）
6. **🔴 英文书必须翻译成中文**：用 `translate_chapters.py` workflow 脚本（种子章串行建术语表 + 其余 asyncio 并发 + validate 自动验证重试），不召唤 subagent。交叉引用转换用 `convert_xrefs.py`（纯 regex，补零可靠）
7. **🔴 Part 页面必须用 book-part 模板**（参照 systems-beauty），weight 比所属第一章小 1
8. Phase 4.5 审核脚本未覆盖的语义问题（元素模板/OCR/Mermaid/标题层级/伪代码）→ `validate_book.py` 验证。**数学教材先跑 `format_theorems.py`** 批量加粗段落级定理/定义，再派 agent 转 shortcode
9. **🔴 质量检查必须用 spot-check agent**：`Agent(subagent_type: "spot-check")`
10. **🔴 `_index.md` 必填 `author` 和 `date` 字段**——`author` 用于 bookshelf 过滤，`date` 用于"入库"排序（写添加当天的日期，如 `date: 2026-07-07`，**写完立刻验证是否 ≤ 当前 UTC 时间**，防止 Hugo 静默跳过未来页面）
11. `hugo server` 验证

## 添加新论文

完整流程见 `.claude/skills/add-paper-to-library/SKILL.md`。论文比书简单（不拆章、不用 MinerU VLM 流水线、不上首页书架），核心步骤：

1. 去重（`grep -ril "<作者>" content/papers/`）→ PDF 归档到 `pdfs/papers/`（含 SM 文件）
2. **优先复用已有 MinerU 提取**（`find ~ -name "*.md" | xargs grep "<标题>"`），没有再提取
3. **全部图片带上** → `content/papers/<slug>/images/`，用 `convert_to_webp.sh` 批量转 WebP（hash 文件名，和书一致）
4. `content/papers/<slug>/_index.md`（**必须是 `_index.md`**，不是普通 .md），front matter 全齐：`title`(中文)/`description`/`date`/`author`/`year`/`category`(数组)/`tags`/`links`/`weight`。**`category` 是 arXiv 一级分类数组**（`["quant-ph"]`, `["quant-ph", "cond-mat"]`），查 `data/arxiv_categories.json`
5. **翻译 + 结构化分析用 workflow 脚本**（不召唤 subagent）：
   - `clean_markdown.py` — 统一清洗（book+paper）：噪声删除 + LaTeX 碎片修复 + 图注配对 + 标题层级 + ref 分行 + `<details>` 删除 + `<div class="mineru-algorithm">` → ```matlab 代码块
   - `translate_chapters.py <file.md>` — 翻译（输出到 `.zh.md`，不碰源文件；分段翻译防截断；自动验证重试；漏翻块检测；**翻译后 `restore_images()` 自动补回丢失的图片引用**）
   - `format_theorems.py <dir>/` — 数学教材段落级定理/定义加粗（MinerU 不标标题，幂等，book 专用）
   - `generate_paper_note.py <file.zh.md> --slug <slug> --meta <meta.json>` — ReAct 结构化分析（7 栏目 + 自我审查改进）+ cross-link + 组装 `_index.md`。category 支持数组多归属
6. **🔴 LaTeX 公式 100% 原样**；图注用 `{{< caption >}}`，强调用 `{{< callout >}}`
7. **🔴 日期陷阱**：`date` 写昨天（如 `2026-07-04`），别写「今天」——Hugo 不构建未来日期的页面，且**不报错**。详见 skill
8. `hugo --gc` → **验证 `public/papers/<slug>/index.html` 真的生成了**（不生成 = 日期在未来）
9. 参照 `content/papers/berry-phase-solid-state-qubit/` 和 `content/papers/dissipation-driven-rabi-qpt/` 的结构

## 添加笔记

完整流程见 `.claude/skills/add-note-to-library/SKILL.md`。直接从书/论文蒸馏思维框架，无需外部 skill 依赖。

1. **输入**：已入库的书/论文 → 直接读取；外部 PDF → 先入库再做笔记
2. **直接分析蒸馏**：LLM 通读原文后提炼核心思维框架、决策启发式、表达 DNA
3. 笔记放 `content/notes/<slug>.md`（**扁平存放**，不用子目录）
4. front matter 必须：`title`/`description`/`date`(昨天)/`author`/`source_type`/`source_title`/`tags`/`weight`
5. 笔记内容：一句话概括 / 核心思维框架 / 决策启发式 / 表达DNA / 批判性思考 / 关键引用
6. **善用已有 JS**：rough.js 手绘图（`{{< rough-canvas >}}`）、pseudocode.js 算法（`{{< algorithm >}}`）、KaTeX 数学、mermaid 流程图
7. **不手动分类**：笔记按 `date` 自动时间排序（最近在前），无需按主题分组

## 聊天 AI 问答

站点内置了一个 BYOK（用户自带 Key）浏览器直连的 AI 问答 Agent。右下角浮动按钮打开聊天面板。

- **检索管线**（5 阶段）：BM25 召回 top50 → RM3 伪相关反馈扩展 query → 词法精排（proximity + phrase + coverage）→ MMR 去冗余（4-gram shingle Jaccard）→ token budget packing（感知对话历史）。BM25 匹配 summary 字段（对齐标准 PageIndex 格式）
- **ReAct agent loop**：模型自主调用 `search_library` 工具检索，多轮推理（最多 4 轮工具调用），不靠单次 RAG
- **思考模式**：DeepSeek 思考模式可开关（设置面板 checkbox），思考内容折叠展示
- **LLM**：浏览器直连 Anthropic / DeepSeek / OpenAI / 硅基流动 / OpenRouter / 智谱 / 通义千问 / Ollama / Gemini
- **Key 安全**：默认 sessionStorage（关页面清除），勾选"记住"才 localStorage
- **PageIndex 索引**：`build_pageindex.py` 生成树索引（title/node_id/text/summary/line_num）。summary = LLM 摘要（≥200 token 节点，litellm 多 provider 路由）或原文（短节点）。本地 lefthook `--incremental` 秒级增量，CI deploy.yml 同步更新
- **复用**：`static/chat/` 可直接复制到其他 Hugo 项目，注入 `window.YUU_CHAT_BASE` 即可

## 质量验证

```bash
python3 .claude/skills/add-book-to-library/scripts/validate_book.py content/books/
python3 .claude/skills/add-book-to-library/scripts/validate_book.py content/papers/
```

36 项机械验证（12 Error + 19 Warning + 5 Review），lefthook pre-commit + CI 自动运行。
- **lefthook pre-commit**：trailing-whitespace → markdownlint → image-refs → front-matter → book-validate → paper-validate
- **lefthook pre-push**：hugo-build → html-check（页面存在=error, broken link=warning）
- **markdownlint**：9 条活跃规则（详见 `.markdownlint.yml`），抓渲染 bug
- `[E]` 阻断 commit：shortcode 闭合、`$` 配对、裸代码、double `\tag` 等
- `[W]` 应修复：交叉引用、标题层级、断行等
- `[R]` 需人工确认：元素模板候选（例X-X、业界事例、定义/定理等）
- 误报标记：行末加 `<!-- validate-skip -->` 跳过
- **`latex-render`**（lefthook pre-commit）：抓两种常见 Markdown/KaTeX 渲染坑——表格 LaTeX 里的裸 `|`（被当列分隔，用 `\lvert`/`\rvert`/`\vert`）和 `$$` 块内行首 `+`/`-`（被当列表项，用 `\;+\;` 或单行）

### 字数统计

```bash
python3 .claude/scripts/count_words.py content/notes/<slug>.md   # 单文件
python3 .claude/scripts/count_words.py content/papers/ -d          # 目录+明细
```

自动剥离 front matter / 代码块 / 公式 / shortcode 后统计中文字符、英文单词、可读字数。详见脚本注释。

## 可用 Agent 与 Workflow 脚本

| 工具 | 类型 | 用途 |
|-------|------|------|
| **spot-check** | Agent | 随机抽查 2 章，18 点清单（先机械 grep → AI 逐章审核），发现问题直接修 |
| **translate_chapters.py** | 脚本 | 翻译英文 MD → 中文（种子章建术语表 + 并发 + validate 验证重试 + **图片引用丢失自动补回**）。book 原地写，paper 输出 `.zh.md` |
| **convert_xrefs.py** | 脚本 | 纯 regex 交叉引用转换（第N章→[第N章](ch0N.md)，补零可靠） |
| **clean_markdown.py** | 脚本 | 统一清洗（book+paper）：噪声删除 + LaTeX 碎片修复 + 图注配对 + 标题层级 + book 页眉/bullet + mineru-algorithm div → 代码块 |
| **format_theorems.py** | 脚本 | 数学教材段落级定理/定义/引理/推论加粗（MinerU 不标标题，幂等，Phase 4.5 前置步骤） |
| **generate_paper_note.py** | 脚本 | 论文结构化分析（ReAct 7 栏目）+ cross-link + 组装 `_index.md` |
| **validate_book.py** | 脚本 | 36 项机械验证（12 Error + 19 Warning + 5 Review） |

用法：
- `Agent(subagent_type: "spot-check", prompt: "Spot-check the book at content/books/<slug>/")`
- `python3 .claude/skills/add-book-to-library/scripts/translate_chapters.py content/books/<slug>/`
- `python3 .claude/skills/add-paper-to-library/scripts/generate_paper_note.py <file.zh.md> --slug <slug> --meta <meta.json>`

## 语法约定

- **元素模板**：`{{< callout >}}` / `{{< definition >}}` / `{{< theorem >}}` / `{{< proposition >}}` / `{{< lemma >}}` / `{{< corollary >}}` / `{{< remark >}}` / `{{< proof >}}` / `{{< example >}}` / `{{< key-point >}}` / `{{< algorithm >}}`（详见 `content/_reference/elements.md`）
- **手绘图形**：`{{< rough-canvas >}}` 创建 rough.js 手绘风格 Canvas（详见 `content/_reference/elements.md`）
- **解答块**：`{{< solution >}}` ... `{{< /solution >}}`（绿色左边框）
- **图注/表注**：`{{< caption >}}` 图8.1 描述 `{{< /caption >}}`
- **数学公式**：行内 `$...$`，行间 `$$...$$`（Goldmark passthrough 原样透传 KaTeX）
- **算法块**：`{{< algorithm title="名称" >}}<pre class="pseudocode">...</pre>{{< /algorithm >}}`
- **伪代码语法**：小写裸命令 `state`/`for{}`/`if{}`/`repeat`/`until{}`/`endfor`/`return{}`，不是 `\STATE`/`\FOR`
- **跨页面链接**：`[第5章](ch05.md)`，BookPortableLinks 自动转 permalink
- **封面目录**：`{{< book-toc >}}` 自动生成，不要手写 HTML 表格
- **书架分类卡片**：`{{< bookshelf >}}` 和 `{{< papershelf >}}` 全自动生成——遍历所有 `_index.md` 的 `category` 字段精确归类。`category` 与 `tags` 完全解耦：`category` 管书架路由，`tags` 管 `/tags/` 浏览。每架末尾自动显示"全部"卡片——遍历所有 `_index.md` 的 `tags`/`author`/`description` 自动归类，**新增内容无需手动编辑 shortcode**。`author` 字段为必需，`tags` 决定所属分类

## 样式体系

- H3：蓝色左边框卡片（题目标题）
- `.solution`：绿色左边框背景（解答块），用 `{{< solution >}}` 短代码
- 表格：全宽，索引页 6 栏
- 图片：居中带阴影
- 暗色模式：Book 主题自带，跟随系统

## 技术要点

- KaTeX（非 MathJax）渲染数学，处理 `$...$` 和 `$$...$$` 分隔符
- `uglyurls = true`：URL 为 `ch01.html`（与旧 mkdocs `use_directory_urls:false` 一致，旧链接不失效）
- 书籍目录用 `_index.md`（section 列表页），章节用普通 `.md`
- 图片全部 WebP 格式，与 `.md` 同级，用相对路径 `images/`
- Hugo Book 主题用 `layouts/_shortcodes/`（注意下划线前缀，Hugo 0.146+ 增强目录结构）
