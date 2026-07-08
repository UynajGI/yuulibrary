# Yuunagi Library — AI 协作约定

> 本文档是给 AI agent(Claude Code / Codex 等)看的项目约定与执行 SOP。
>
> 通用项目文档(fork 者 / 贡献者)见:
> - [README.md](README.md) — 项目介绍 + 快速开始 + Fork 部署
> - [docs/architecture.md](docs/architecture.md) — 站点架构 + AI 问答 + PageIndex + 质量校验
> - [docs/deployment.md](docs/deployment.md) — 部署详解 + CI + 环境变量 + 故障排查
> - [docs/content-workflow.md](docs/content-workflow.md) — 加书/论文/笔记流程 + scripts 索引
> - [CONTRIBUTING.md](CONTRIBUTING.md) — 贡献指南

## 常用命令

```bash
hugo server -p 1314 --bind 127.0.0.1    # 本地预览(http://localhost:1314/yuulibrary/)
hugo --gc --minify                        # 生产构建到 public/
python scripts/build_pageindex.py         # 构建 PageIndex 索引(hugo 前必须跑)
bash scripts/release.sh                   # 算下一个发布 tag(只读)
```

## 添加新书

完整流程见 `.claude/skills/add-book-to-library/SKILL.md`。**🔴 红线**:

1. MinerU pipeline 提取 PDF / EPUB → 合并 → 清洗(**EPUB pandoc 残留必须清理**:`::: fn1` / `::: blk1` / `[]{#page}` / `{.class}` / `-----` 表格分隔符)
2. `content/books/<book-slug>/` 下扁平目录(**无分类子目录**)
3. `_index.md`:`<section class="book-cover">` + `{{< book-toc >}}`,**front matter 必填 `description` + `tags` + `author` + `date` + `category`**。`date` 写添加当天,驱动书架"入库"排序
4. 每章 `ch01.md` 起,**front matter 含 `description`**
5. 标题层级:`#` 章 → `##` 节 → `###` 子节(**小标题必须用 markdown,不能纯文本**)
6. **🔴 英文书必须翻译成中文**:用 `translate_chapters.py` workflow 脚本(种子章串行建术语表 + asyncio 并发 + validate 自动验证重试),**不召唤 subagent**。交叉引用转换用 `convert_xrefs.py`(纯 regex,补零可靠)
7. **🔴 Part 页面必须用 book-part 模板**(参照 systems-beauty),weight 比所属第一章小 1
8. Phase 4.5 审核脚本未覆盖的语义问题(元素模板/OCR/Mermaid/标题层级/伪代码)→ `validate_book.py` 验证。**数学教材先跑 `format_theorems.py`** 批量加粗段落级定理/定义
9. **🔴 质量检查必须用 spot-check agent**:`Agent(subagent_type: "spot-check")`
10. **🔴 `_index.md` 必填 `author` 和 `date`**——`author` 用于 bookshelf 过滤,`date` 用于"入库"排序(写添加当天,**写完立刻验证是否 ≤ 当前 UTC 时间**,防止 Hugo 静默跳过未来页面)
11. `hugo server` 验证

## 添加新论文

完整流程见 `.claude/skills/add-paper-to-library/SKILL.md`。论文比书简单。**🔴 红线**:

1. 去重(`grep -ril "<作者>" content/papers/`)→ PDF 归档到 `pdfs/papers/`
2. **优先复用已有 MinerU 提取**(`find ~ -name "*.md" | xargs grep "<标题>"`),没有再提取
3. **全部图片带上** → `content/papers/<slug>/images/`,`convert_to_webp.sh` 批量转 WebP
4. `content/papers/<slug>/_index.md`(**必须 `_index.md`**),front matter 全齐:`title`(中文)/`description`/`date`/`author`/`year`/`category`(数组)/`tags`/`links`/`weight`。**`category` 是 arXiv 一级分类数组**(查 `data/arxiv_categories.json`)
5. **翻译 + 结构化分析用 workflow 脚本**(不召唤 subagent):
   - `clean_markdown.py` — 统一清洗
   - `translate_chapters.py <file.md>` — 翻译(输出 `.zh.md`,不碰源文件;**翻译后 `restore_images()` 自动补回丢失图片**)
   - `generate_paper_note.py <file.zh.md> --slug <slug> --meta <meta.json>` — ReAct 结构化分析(7 栏目)+ cross-link + 组装 `_index.md`
6. **🔴 LaTeX 公式 100% 原样**;图注用 `{{< caption >}}`,强调用 `{{< callout >}}`
7. **🔴 日期陷阱**:`date` 写昨天(如 `2026-07-07`),别写「今天」——Hugo 不构建未来日期的页面且**不报错**。详见 skill
8. `hugo --gc` → **验证 `public/papers/<slug>/index.html` 真的生成了**
9. 参照 `content/papers/berry-phase-solid-state-qubit/` 和 `content/papers/dissipation-driven-rabi-qpt/` 的结构

## 添加笔记

完整流程见 `.claude/skills/add-note-to-library/SKILL.md`。

1. **输入**:已入库的书/论文 → 直接读取;外部 PDF → 先入库再做笔记
2. **直接分析蒸馏**:LLM 通读原文后提炼核心思维框架、决策启发式、表达 DNA
3. 笔记放 `content/notes/<slug>.md`(**扁平存放**)
4. front matter 必须:`title`/`description`/`date`(昨天)/`author`/`source_type`/`source_title`/`tags`/`weight`
5. 笔记内容:一句话概括 / 核心思维框架 / 决策启发式 / 表达 DNA / 批判性思考 / 关键引用
6. **善用已有 JS**:rough.js 手绘图、pseudocode.js 算法、KaTeX 数学、mermaid 流程图
7. **不手动分类**:笔记按 `date` 自动时间排序

## 可用 Agent 与 Workflow 脚本

| 工具 | 类型 | 用途 |
|-------|------|------|
| **spot-check** | Agent | 随机抽查 2 章,18 点清单(先机械 grep → AI 逐章审核),发现问题直接修 |
| **translate_chapters.py** | 脚本 | 翻译英文 MD → 中文(种子章建术语表 + 并发 + validate 验证重试 + **图片引用丢失自动补回**)。book 原地写,paper 输出 `.zh.md` |
| **convert_xrefs.py** | 脚本 | 纯 regex 交叉引用转换(「第N章」→ markdown 链接 `ch0N.md`,补零可靠) |
| **clean_markdown.py** | 脚本 | 统一清洗(book+paper):噪声删除 + LaTeX 碎片修复 + 图注配对 + 标题层级 |
| **format_theorems.py** | 脚本 | 数学教材段落级定理/定义加粗(MinerU 不标标题,幂等,Phase 4.5 前置) |
| **generate_paper_note.py** | 脚本 | 论文结构化分析(ReAct 7 栏目)+ cross-link + 组装 `_index.md` |
| **validate_book.py** | 脚本 | 36 项机械验证(12 Error + 19 Warning + 5 Review) |
| **test_translate.py** | 脚本 | 翻译脚本纯函数回归测试(34 用例,零依赖,CI 自动跑) |

用法:
- `Agent(subagent_type: "spot-check", prompt: "Spot-check the book at content/books/<slug>/")`
- `python3 .claude/skills/add-book-to-library/scripts/translate_chapters.py content/books/<slug>/`
- `python3 .claude/skills/add-paper-to-library/scripts/generate_paper_note.py <file.zh.md> --slug <slug> --meta <meta.json>`

## 语法约定

- **元素模板**:`{{< callout >}}` / `{{< definition >}}` / `{{< theorem >}}` / `{{< proposition >}}` / `{{< lemma >}}` / `{{< corollary >}}` / `{{< remark >}}` / `{{< proof >}}` / `{{< example >}}` / `{{< key-point >}}` / `{{< algorithm >}}`(详见 `content/_reference/elements.md`)
- **手绘图形**:`{{< rough-canvas >}}` 创建 rough.js 手绘风格 Canvas
- **解答块**:`{{< solution >}}` ... `{{< /solution >}}`(绿色左边框)
- **图注/表注**:`{{< caption >}}` 图8.1 描述 `{{< /caption >}}`
- **数学公式**:行内 `$...$`,行间 `$$...$$`(Goldmark passthrough 原样透传 KaTeX)。**不要用 `\[...\]` / `\(...\)`**——KaTeX 不渲染。
- **算法块**:`{{< algorithm title="名称" >}}<pre class="pseudocode">...</pre>{{< /algorithm >}}`
- **伪代码语法**:小写裸命令 `state`/`for{}`/`if{}`/`repeat`/`until{}`/`endfor`/`return{}`,不是 `\STATE`/`\FOR`
- **跨页面链接**:章节间用 markdown 链接到 `ch0N.md`(如「第5章」→ `ch05.md`),BookPortableLinks 自动转 permalink
- **封面目录**:`{{< book-toc >}}` 自动生成,不要手写 HTML 表格
- **书架分类卡片**:`{{< bookshelf >}}` 和 `{{< papershelf >}}` 全自动生成——`category` 与 `tags` 完全解耦。每架末尾自动显示"全部"卡片。**新增内容无需手动编辑 shortcode**
- **馆藏统计**:`{{< stats >}}` 首页仪表盘——自动统计 books/papers/notes 数量 + 最近添加 + 标签云

## 样式体系

- H3:蓝色左边框卡片(题目标题)
- `.solution`:绿色左边框背景(解答块)
- 表格:全宽,索引页 6 栏
- 图片:居中带阴影
- **主题切换(日/夜/自动三态)**:架构详见 [docs/architecture.md#主题切换三态](docs/architecture.md#主题切换三态)。要点:`hugo.toml` 的 `BookTheme='light'`,所有 dark 样式用 `:root[data-effective-theme="dark"]` 选择器,**不要用 `@media prefers-color-scheme`**

## 技术要点

- KaTeX(非 MathJax)渲染数学,处理 `$...$` 和 `$$...$$` 分隔符
- `uglyurls = true`:URL 为 `ch01.html`(与旧 mkdocs `use_directory_urls:false` 一致,旧链接不失效)
- 书籍目录用 `_index.md`(section 列表页),章节用普通 `.md`
- 图片全部 WebP 格式,与 `.md` 同级,用相对路径 `images/`
- Hugo Book 主题用 `layouts/_shortcodes/`(注意下划线前缀,Hugo 0.146+ 增强目录结构)
