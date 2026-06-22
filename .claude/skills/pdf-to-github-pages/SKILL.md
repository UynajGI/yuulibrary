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

### Phase 2：清洗 Markdown

运行 `scripts/clean_markdown.py` 处理：
- LaTeX 空白修复（`x _ {i}` → `x_{i}`）
- 数学内数字间距（`1 0 0` → `100`）
- 页眉泄露（章节名混入正文）
- 脚注上标（`$^{1}$`）

**失败分支**：脚本报错 → 检查输入是否为 MinerU VLM 输出格式，手动检查第一处报错行的原始内容。

🔴 **CHECKPOINT**：清洗完成后，展示前 50 行的 before/after 对比。用户确认清洗质量后继续。

### Phase 3：选择分类

询问用户：
1. 这是书籍、论文还是笔记？（决定放 `books/`、`papers/` 还是 `notes/`）
2. 属于哪个学科分类？（如 `finance`、`math`、`cs`）
3. 书的 URL slug 是什么？（短横线命名，如 `quant-finance-interview`）

🔴 **CHECKPOINT**：确认路径 `docs/<type>/<category>/<book-slug>/` 后继续。

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

**失败分支**：`## Chapter` 模式匹配不到 → 改用 `# Chapter` 或 `### Chapter` 匹配；仍失败则让用户提供章节边界关键词。

### Phase 5：格式化

#### 封面 + 目录（`index.md`）

用 HTML + markdown 混排：
- 居中书名、作者、封面图片
- 双栏目录表格：左列章节链接，右列小节链接

#### 符号说明（`notations.md`，可选）

4 栏 markdown 表格：`| 符号 | 含义 | 符号 | 含义 |`

#### 解答块

将 `解答：` 起头的内容包裹：
```html
<div class="solution" markdown="1">

解答：...

</div>
```

**失败分支**：`</div>` 漏写 → build 时 HTML 错乱。每个 `解答：` 出现次数应等于 `<div class="solution">` 出现次数，Phase 6 build 失败时优先排查此项。

#### 索引（`index_term.md`，可选）

6 栏表格：`| 术语 | 章节 | 术语 | 章节 | 术语 | 章节 |`

跨页面锚点：先 `mkdocs build`，从 `site/` 的 HTML 提取实际 `id` 属性，再回填链接。

**失败分支**：锚点 404 → 检查 mkdocs 生成的 slug 与索引中引用的 slug 是否一致（mkdocs 会去除中文标点、转小写英文）。

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

### Phase 7：验证

```bash
mkdocs build
```

检查：
- 构建零错误
- 所有内部链接可点击
- 公式在页面中正确渲染
- 解答块样式正常

🔴 **CHECKPOINT**：`mkdocs build` 通过后展示章节数、图片数、内部链接数。用户确认后 push。

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
