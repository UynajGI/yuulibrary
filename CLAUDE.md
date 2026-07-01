# Yuunagi Library

个人的数字图书馆。Hugo + Hugo Book 主题多书站点，托管于 GitHub Pages。

## 常用命令

```bash
hugo server -p 1314 --bind 127.0.0.1    # 本地预览（http://localhost:1314/yuulibrary/）
hugo --gc --minify                        # 生产构建到 public/
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
│   ├── papers/                   # 论文笔记（带 author/year/tags）
│   └── _reference/               # 元素模板速查（_ 前缀，菜单隐藏）
├── layouts/
│   ├── _shortcodes/              # book-toc/callout/definition/theorem/example 等
│   └── _partials/docs/inject/head.html  # KaTeX + pseudocode.js 加载
├── assets/custom.scss            # 全局样式
├── static/katex/ + pseudocode/ + rough.min.js  # 本地化数学/算法/手绘渲染
├── .claude/skills/add-book-to-library/   # 加书 skill
├── .claude/skills/add-paper-to-library/  # 加论文 skill
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
3. `_index.md`：`<section class="book-cover">` + `{{< book-toc >}}`，必须加 `description` + `tags`
4. 每章文件 `ch01.md` 起，**front matter 含 `description`**：
   ```yaml
   ---
   title: "第1章 · 引言"
   weight: 10
   description: "收益计算、风险评估——投资决策的基础。"
   ---
   ```
5. 标题层级：`#` 章 → `##` 节 → `###` 子节（**小标题必须用 markdown 格式，不能是纯文本**）
6. **🔴 英文书必须翻译成中文**：翻译时同步转换元素模板（引用→`{{< callout type="quote" >}}`、来源→`{{< caption >}}`、第N章→`[第N章](ch0N.md)`）
7. **🔴 Part 页面必须用 book-part 模板**（参照 systems-beauty），weight 比所属第一章小 1
8. Phase 4.5 Haiku 逐章审核 → 元素模板（example/callout/caption）→ `validate_book.py` 验证
9. **🔴 质量检查必须用 spot-check agent**：`Agent(subagent_type: "spot-check")`
10. `hugo server` 验证，首页书架加卡片

## 添加新论文

完整流程见 `.claude/skills/add-paper-to-library/SKILL.md`，易忘点见 `.serena/memories/add-paper-patterns.md`。论文比书简单（不拆章、不用 MinerU VLM 流水线、不上首页书架），核心步骤：

1. 去重（`grep -ril "<作者>" content/papers/`）→ PDF 归档到 `pdfs/papers/`（含 SM 文件）
2. **优先复用已有 MinerU 提取**（`find ~ -name "*.md" | xargs grep "<标题>"`），没有再提取
3. 精选 5-8 张图 → `content/papers/<slug>/images/`，**WebP + 语义化命名**（`fig1-<主题>.webp`）
4. `content/papers/<slug>/_index.md`（**必须是 `_index.md`**，不是普通 .md），front matter 全齐：`title`(中文)/`description`/`date`/`author`/`year`/`tags`/`links`/`weight`
5. 翻译正文 + 写阅读笔记（一句话概括 / 核心论证链 / 实验参数表 / 批判性思考 / 局限性 / 关键公式速查 / 延伸阅读 / 术语对照）
6. **🔴 LaTeX 公式 100% 原样**；图注用 `{{< caption >}}`，强调用 `{{< callout >}}`
7. **🔴 日期陷阱**：`date` 写昨天（如 `2026-06-27`），别写「今天」——Hugo 不构建未来日期的页面，且**不报错**。详见 skill
8. `hugo --gc` → **验证 `public/papers/<slug>/index.html` 真的生成了**（不生成 = 日期在未来）
9. 参照 `content/papers/berry-phase-solid-state-qubit/` 和 `content/papers/dissipation-driven-rabi-qpt/` 的结构

## 添加笔记

完整流程见 `.claude/skills/add-note-to-library/SKILL.md`。将书籍/论文转化为 agent 思维框架笔记。

1. **输入**：已入库的书/论文 → 直接读取；外部 PDF → 先入库再做笔记
2. **思维框架笔记**（默认）→ 内部调用 `/huashu-nuwa` 生成 perspective skill + 笔记摘要
3. 笔记放 `content/notes/<slug>.md`（**扁平存放**，不用子目录）
4. front matter 必须：`title`/`description`/`date`(昨天)/`author`/`source_type`/`tags`/`weight`
5. 笔记内容：核心思维框架(3-7个) / 决策启发式 / 表达DNA / 推荐书单 / 批判性思考 / 关键引用
6. 产出两个产物：`content/notes/<slug>.md`（笔记页面）+ `.claude/skills/<person>-perspective/`（可调用 skill，可选）
7. **不手动分类**：笔记按 `date` 自动时间排序（最近在前），无需按主题分组

## 质量验证

```bash
python3 .claude/skills/add-book-to-library/scripts/validate_book.py content/books/
```

36 项机械验证（12 Error + 19 Warning + 5 Review，lefthook pre-commit + CI 自动运行）。
- `[E]` 阻断 commit：shortcode 闭合、`$` 配对、裸代码、double `\tag` 等
- `[W]` 应修复：交叉引用、标题层级、断行等
- `[R]` 需人工确认：元素模板候选（例X-X、业界事例、定义/定理等）
- 误报标记：行末加 `<!-- validate-skip -->` 跳过

## 可用 Agent

| Agent | 模型 | 用途 |
|-------|------|------|
| **spot-check** | Haiku | 随机抽查 2 章，18 点清单（先机械 grep → AI 逐章审核），发现问题直接修 |

用法：`Agent(subagent_type: "spot-check", prompt: "Spot-check the book at content/books/<slug>/")`

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
- **书架分类卡片**：`{{< bookshelf >}}` 生成分类卡片网格 + 缩放展开动画（首页和 `/books/` 页共用），新增书籍时需更新 shortcode 内的分类列表

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
