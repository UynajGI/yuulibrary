---
name: add-book-to-library
description: |
  将 PDF 书籍转换为 MkDocs 页面并加入个人数字图书馆。完整流程：PDF 提取（MinerU VLM）→ Markdown 清洗 → 章节拆分 → 格式化 → 导航与首页接入。
  触发词：add this book, 加入图书馆, 添加书籍, 把 PDF 转成网页, 把书加入图书馆, convert PDF to library, add book to library, 个人图书馆, digital library.
---

# Add Book to Library

将一本 PDF 学术书籍加入已有的 MkDocs 数字图书馆。

## 架构

```
repo/
├── mkdocs.yml
├── docs/
│   ├── index.md                    # 图书馆首页（卡片式书单）
│   ├── books/                      # 书籍（按学科分类）
│   │   └── <category>/
│   │       └── <book-slug>/
│   ├── papers/                     # 论文
│   │   └── <field>/
│   │       └── <paper-slug>/
│   ├── notes/                      # 笔记
│   ├── stylesheets/extra.css
│   └── javascripts/mathjax.js
├── pdfs/                           # PDF 源文件（本地，不入库）
└── .github/workflows/deploy.yml
```

`<category>` 由用户在添加时指定，如 `finance`、`math`、`cs`、`physics` 等。

---

## 工作流

### 🛑 强制入口：状态文件

**处理任何书之前，必须先检查 `pdfs/<book-id>.state.json` 是否存在。**

- 存在 → 读取 `current_phase`，从中断点恢复
- 不存在 → **🛑 STOP，必须先完成 Phase 0 才能继续**

每个 phase 完成后**强制**写入状态文件：`current_phase` 改为 `phase_N_done`，对应 phase 的 `status` 改为 `done`。

---

### Phase 0：归集 PDF + 创建状态文件

将 PDF 复制到仓库的 `pdfs/` 目录（已 gitignore，不会发布）：

```bash
cp /path/to/book.pdf pdfs/
```

创建状态文件 `pdfs/<book-id>.state.json`，记录每本书的处理进度：

```json
{
  "book_id": "<book-id>",
  "pdf": "<filename>",
  "type": null,
  "category": null,
  "slug": null,
  "current_phase": "phase_0_done",
  "phases": {
    "phase_0": { "status": "done", "note": "PDF copied to pdfs/" },
    "phase_1": { "status": "pending", "note": "PDF to Markdown via MinerU VLM" },
    "phase_2": { "status": "pending", "note": "Clean markdown" },
    "phase_3": { "status": "pending", "note": "Choose category" },
    "phase_4": { "status": "pending", "note": "Split into chapters" },
    "phase_5": { "status": "pending", "note": "Format special pages" },
    "phase_6": { "status": "pending", "note": "Wire nav and homepage" },
    "phase_7": { "status": "pending", "note": "Build and verify" }
  }
}
```

**Phase 0 完成后**：写入 `current_phase: "phase_0_done"`，`phase_0.status: "done"`。

### Phase 1：PDF → Markdown

调用 `/mineru-document-extractor`。学术书籍带公式：

```bash
mineru-open-api auth --verify
mineru-open-api extract book.pdf -o out/ -f md --model vlm --language en --timeout 3600
```

**失败分支**：MinerU API 超时或不可用 → 将 PDF 按 200 页拆分重试：
```bash
mineru-open-api extract book.pdf -o out_part1/ -f md --model vlm --language en --timeout 3600 --pages 1-200
mineru-open-api extract book.pdf -o out_part2/ -f md --model vlm --language en --timeout 3600 --pages 201-400
# 手动合并输出文件后继续
```

**Phase 1 完成后**：写入 `current_phase: "phase_1_done"`，`phase_1.status: "done"`。

### Phase 2：清洗 Markdown

运行 `scripts/clean_markdown.py` 处理：
- LaTeX 空白修复（`x _ {i}` → `x_{i}`）
- 数学内数字间距（`1 0 0` → `100`）
- 页眉泄露（章节名混入正文）
- 脚注上标（`$^{1}$`）

**失败分支**：脚本报错 → 检查输入是否为 MinerU VLM 输出格式，手动检查第一处报错行的原始内容。

**中文书注意**：`clean_markdown.py` 主要处理英文 LaTeX 问题。中文书额外手动清理：
- OCR 伪影（空字母碎片如 `A\nB C\nD`）
- 重复的标题/作者行
- ISBN、版权声明、客服联系方式
- 源代码下载链接和客服邮箱（保留 GitHub 链接即可）

🔴 **CHECKPOINT**：清洗完成后，展示前 50 行的 before/after 对比。用户确认清洗质量后继续。

**Phase 2 完成后**：写入 `current_phase: "phase_2_done"`，`phase_2.status: "done"`。

### Phase 3：选择分类

询问用户：
1. 这是书籍、论文还是笔记？（决定放 `books/`、`papers/` 还是 `notes/`）
2. 属于哪个学科分类？（如 `finance`、`math`、`cs`）
3. 书的 URL slug 是什么？（短横线命名，如 `quant-finance-interview`）

🔴 **CHECKPOINT**：确认路径 `docs/<type>/<category>/<book-slug>/` 后继续。

**Phase 3 完成后**：写入 `current_phase: "phase_3_done"`，更新 `type`、`category`、`slug` 字段。

### Phase 4：拆分章节

```bash
mkdir -p docs/<type>/<category>/<book-slug>/images
```

找到 `## Chapter N` 或 `## 第N章` 边界，每个章节存为 `ch01.md`、`ch02.md` ……

修正标题层级：
- 章节标题 → `#`（H1）
- 节（N.M）→ `##`（H2）
- 问题/主题 → `###`（H3）

页码 ≤ 15 的薄书不拆分，合并为一个文件。

**修复代码注释被误识别为标题**：遍历所有 `ch*.md`，将代码块（` ``` ` 包裹区域内）中以 `# ` 开头的行降级为 `## `，防止 Python 注释 `# 这是一段说明` 被渲染为 H1。

**失败分支**：`## Chapter` 模式匹配不到 → 改用 `# Chapter` 或 `### Chapter` 匹配；仍失败则让用户提供章节边界关键词。

**Phase 4 完成后**：写入 `current_phase: "phase_4_done"`，`phase_4.status: "done"`。

### Phase 5：格式化

#### 封面 + 目录（`index.md`）

用 HTML + markdown 混排：
- 居中书名、作者、封面图片
- 双栏目录表格：左列章节链接，右列小节链接

#### 符号说明（`notations.md`）

**强制**：4 栏 markdown 表格：

```markdown
| 符号 | 含义 | 符号 | 含义 |
|------|------|------|------|
| E | 期望 | π | 策略 |
```

#### 算法列表（`algorithms.md`，如有）

**强制**：表格带章节链接：

```markdown
| # | 算法 | 章节 |
|---|------|------|
| 1 | Q 学习算法 | [第5章](ch05.md) |
```

#### 跨页面交叉引用

**强制**：遍历所有 `ch*.md`，将正文中的「第 N 章」转为可点击链接：
```
第3章 → [第3章](ch03.md)
```
不替换标题行（`# 第N章`）和已有链接。**链接用 `.md` 后缀，mkdocs 构建时自动转为 `.html`。**

#### 解答块

将 `解答：` 起头的内容包裹：
```html
<div class="solution" markdown="1">

解答：...

</div>
```

**失败分支**：`</div>` 漏写 → build 时 HTML 错乱。每个 `解答：` 出现次数应等于 `<div class="solution">` 出现次数。

#### 索引（`index_term.md`）

6 栏表格：`| 术语 | 章节 | 术语 | 章节 | 术语 | 章节 |`

跨页面锚点：先 `mkdocs build`，从 `site/` 的 HTML 提取实际 `id` 属性，再回填链接。

**失败分支**：锚点 404 → 检查 mkdocs 生成的 slug 与索引中引用的 slug 是否一致（mkdocs 会去除中文标点、转小写英文）。

**Phase 5 完成后**：写入 `current_phase: "phase_5_done"`，`phase_5.status: "done"`。

### Phase 6：接入导航和首页

#### mkdocs.yml nav

在对应分类位置插入：
```yaml
nav:
  - 首页: index.md
  - 书籍:
    - <分类名>:
      - <书名>:
        - 封面: books/<category>/<book-slug>/index.md
        - 第1章 · <标题>: books/<category>/<book-slug>/ch01.md
        - ...
```

章节标题从每个 `ch*.md` 的 `#` 行提取，>50 字符则截断。

#### 首页卡片

在 `docs/index.md` 的对应分类区域添加卡片：
```markdown
-   :material-book-open-variant: __书名__

    ---

    *作者 · 语言*

    简介

    [:octicons-arrow-right-24: 开始阅读](books/<category>/<book-slug>/index.md)
```

**Phase 6 完成后**：写入 `current_phase: "phase_6_done"`，`phase_6.status: "done"`。

### Phase 7：验证

```bash
mkdocs build
```

检查：
- 构建零错误
- 所有内部链接可点击
- 公式在页面中正确渲染
- 解答块样式正常

🔴 **CHECKPOINT**：`mkdocs build` 通过后展示章节数、图片数、内部链接数。用户决定何时 push。

**Phase 7 完成后**：写入 `current_phase: "phase_7_done"`，`phase_7.status: "done"`。整本书处理完毕。

---

## 失败模式速查

| 症状 | 一线修复 | 仍失败 |
|------|---------|--------|
| 公式不渲染 | `mathjax.js` 检查 inlineMath 含 `$` 分隔符 | mkdocs.yml 检查 `extra_javascript` 路径 |
| HTML 内 md 不解析 | mkdocs.yml 加 `md_in_html` | 改用 `<img src>` 替代 `![](path)` |
| 解答块颜色消失 | 检查 `extra.css` 中 `.solution` 定义 | 检查 `<div>` 是否有 `markdown="1"` |
| 嵌套解答块（问题文本也变绿） | 查 `<div>` 和 `</div>` 配对 | grep `解答：` 出现次数 = `<div class="solution">` 出现次数 |
| 索引锚点 404 | `mkdocs build` 后从 HTML 提取 id | 手动比对 mkdocs slug 规则 |
| 图片不显示 | 检查路径相对 `docs/` 而非文件所在目录 | `![](images/x.jpg)` 不是 `![](../images/x.jpg)` |
| Build 报错 nav 路径 | 检查 `mkdocs.yml` 的 nav 路径文件存在 | `use_directory_urls: false` 确保 .md 链接稳定 |

---

## 反例黑名单（不要做）

| # | 禁止 | 原因 | 正确做法 |
|---|------|------|---------|
| 1 | 跳过清洗直接翻译/拆分 | 残留 `\text {word}` 等 LaTeX 垃圾会污染全书 | Phase 2 必须在 Phase 4 之前 |
| 2 | 用 `!!! admonition` | 每行需 4 空格缩进 + 空行，一处错整块崩 | 用 `<div class="solution" markdown="1">` |
| 3 | 直接编辑 `site/` 下的文件 | `site/` 是构建产物，下次 build 被覆盖 | 只改 `docs/` 源文件 |
| 4 | 翻译时动 LaTeX 公式 | `$x_i$` 变成 `$x _ i$` 直接破坏数学内容 | 翻译 prompt 明确黑名单保护 |
| 5 | 章节标题用 `##` | mkdocs 侧边栏 H2 会缩进过深 | 章节标题用 `#`，节用 `##` |
| 6 | 不 build 直接手写锚点 | mkdocs slug 规则与直觉不同（去除中文标点等） | `mkdocs build` → 从 HTML 提取 `id` |
| 7 | PDF 源文件放入 docs/ | 会发布到网站上，浪费带宽和存储 | 放 `pdfs/`（已 gitignore） |
| 8 | 交叉引用用 `.html` 后缀 | mkdocs build 会报 warning，期望 `.md` | 统一用 `.md` 后缀，mkdocs 构建时自动转换 |
