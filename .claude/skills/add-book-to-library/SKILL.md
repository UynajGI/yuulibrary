---
name: add-book-to-library
description: |
  将 PDF 书籍转换为 Hugo 页面并加入个人数字图书馆。完整流程：PDF 提取（MinerU VLM）→ Markdown 清洗 → 章节拆分 → 格式化 → front matter 接入。
  触发词：add this book, 加入图书馆, 添加书籍, 把 PDF 转成网页, 把书加入图书馆, convert PDF to library, add book to library, 个人图书馆, digital library.
---

# Add Book to Library

将一本 PDF 学术书籍加入 Hugo（Hugo Book 主题）数字图书馆。

## 架构约定

```
content/books/<book-slug>/   # 扁平存放，无分类子目录
├── _index.md                # 封面 + 目录（section 列表页）
├── preface.md               # 前言（weight: 2）
├── ch01.md ~ ...            # 章节（weight: 10 起递增）
├── notations.md             # 符号说明（可选，weight: 3）
├── algorithms.md            # 算法列表（可选，weight: 4）
├── index_term.md            # 索引（可选）
└── images/                  # 图片，与 .md 同级，相对路径引用
```

**🔴 关键规则**：
- 每文件必须有 front matter：`title` + `weight` + `description`
- `_index.md` 必须加 `tags`、`description`、`BookCollapseSection: true`
- 菜单从目录结构 + weight 自动生成，无需手写 nav
- 图片用 `![](images/xxx.jpg)` 相对路径，与 .md 同级
- PDF 源放 `pdfs/`（gitignore），MinerU 原始 MD 保留到 `pdfs/<book>-out/merged/book.md`

---

## 工作流

### 🛑 强制入口：状态文件

处理任何书之前，必须检查 `pdfs/<book-id>.state.json`：
- 存在 → 读 `current_phase`，从中断点恢复
- 不存在 → **🛑 STOP，必须先完成 Phase 0**

每 phase 完成强制写状态文件。格式见 [Phase 0](#phase-0)。

---

### Phase 0：归集 PDF + 状态文件

```bash
cp /path/to/book.pdf pdfs/
```

创建 `pdfs/<book-id>.state.json`：

```json
{
  "book_id": "<book-id>",
  "pdf": "<filename>",
  "slug": null,
  "current_phase": "phase_0_done",
  "phases": {
    "phase_0": { "status": "done" },
    "phase_1": { "status": "pending", "note": "PDF to Markdown via MinerU VLM" },
    "phase_2": { "status": "pending", "note": "Clean markdown" },
    "phase_3": { "status": "pending", "note": "Choose slug + create dir" },
    "phase_4": { "status": "pending", "note": "Split into chapters + front matter" },
    "phase_5": { "status": "pending", "note": "Format: cover, TOC, templates" },
    "phase_6": { "status": "pending", "note": "Build and verify" }
  }
}
```

---

### Phase 1：PDF → Markdown

调用 `/mineru-document-extractor`。大书（>200页）分批：

```bash
mineru-open-api extract book.pdf --pages 1-110 -o out/part1/ --model vlm --language ch --timeout 2400
mineru-open-api extract book.pdf --pages 111-220 -o out/part2/ --model vlm --language ch --timeout 2400
# ... 依此类推

# 合并
cat out/part1/*.md out/part2/*.md > out/merged/book.md
```

**失败分支**：API 超时 → 缩小 `--pages` 范围重试，或增加 `--timeout`。

---

### Phase 2：清洗 Markdown

1. 跑 `scripts/clean_markdown.py`（LaTeX 空白、数字间距、页眉泄露）
2. 逐条检查 MinerU 损坏（13 项清单详见 `references/cleanup-reference.md`）：
   - `$$` 误包正文、孤儿 `$$`、标题平铺、裸代码、缩进丢失、转义残留、
     `def__init__` 粘连、代码注释被标为标题、`mineru-algorithm` div 等
3. 删除版权信息（ISBN、客服热线/邮箱）

🔴 **CHECKPOINT**：展示清理前后对比，用户确认后继续。

---

### Phase 3：选择 slug + 创建目录

询问用户 URL slug。创建：

```bash
mkdir -p content/books/<book-slug>/images
```

🔴 **CHECKPOINT**：确认目录后更新状态文件 `slug` 字段。

---

### Phase 4：拆分章节 + front matter

**找章节边界**：`# 第N章` / `## Chapter N` / `# Topic Name`。注意 MinerU 可能把子节（`# 8.3 xxx`）标为新章，需手动合并。

**每章 front matter**：
```yaml
---
title: "第1章 · 引言"
weight: 10
description: "收益计算、风险评估——投资决策的基础。"
---
```

- `description` 必须加（`{{< book-toc >}}` 用它显示简介）
- 封面 `_index.md`：weight=1，必须加 `tags`（2-3个领域标签）
- 前言：weight=2
- 章节：weight=10 起递增

**🔴 标题层级修复**（MinerU 把全部层级标成 `##`）：
- 章：`# 第N章 标题`（H1，每章唯一）
- 节：`## N.M 标题`（H2）
- 子节：`### N.M.K 标题`（H3）
- `## N. 标题`（单数字+点）→ `### N. 标题`
- `## (N)标题` → `### (N)标题`
- 验证：每章 H2:H3 ≈ 1:2~1:5
- 薄书（≤15页）不拆分

**失败分支**：`## Chapter` 匹配不到 → 尝试 `# Chapter` / `### Chapter`；仍失败让用户提供边界词。

---

### Phase 4.5：逐章审核（Haiku 并行）

每 4-5 章 spawn 一个 Haiku agent，独立校对：
1. **OCR 错误** — 数学符号误识别
2. **元素模板** — 例X-X → `{{< example >}}`、业界事例 → `{{< callout >}}`、定理/定义 → 对应 shortcode
3. **表格图注** — `表N.N`/`图N.N` → `{{< caption >}}`
4. **Mermaid** — 删 `<details>` + mermaid，留原图
5. **标题层级** — 代码注释 `#` 误为 H1、子节降级
6. **交叉引用** — `第N章` → `[第N章](ch0N.md)`
7. **代码块** — 补 ` ```python ` 围栏、numpy/torch 代码
8. **伪代码** — 用**小写裸命令**（`state`/`for{}`/`if{}`/`repeat`/`until{}`/`endfor`/`return{}`），不是 `\STATE`/`\FOR`

🔴 **处理顺序**：Haiku agent 先（语义修复）→ 机械化脚本后（空块/compound 分解）

---

### Phase 5：格式化

#### 封面 + 目录（`_index.md`）

**🔴 必须用 `book-cover` section + `{{< book-toc >}}`，不手写 HTML：**

```markdown
---
title: "<书名>"
description: "<一句话简介>"
weight: 1
BookCollapseSection: true
tags: ["标签1", "标签2"]
---

<section class="book-cover">
  <h1 class="book-cover-title"><书名></h1>
  <p class="book-cover-subtitle"><副标题></p>
  <p class="book-cover-author"><作者></p>
</section>

## 目录

{{< book-toc >}}
```

`book-toc` 自动遍历当前 section 的 `.md` 页（按 weight 排序），显示 title + description。

#### 首页卡片

`content/_index.md` 的 `<div class="bookshelf">` 加 `<a class="book-row">`。

#### 符号说明 / 算法列表（如需要）

4 栏表格（符号）或 3 栏表格（算法），front matter 含 `title` + `weight: 3/4`。

#### 元素模板

详见 `content/reference/elements.md`。Phase 4.5 自动转换：
- 例X-X → `{{< example >}}`，业界事例 → `{{< callout type="note" >}}`
- 定义 → `{{< definition >}}`，定理 → `{{< theorem >}}`
- 算法 → `{{< algorithm >}}`，要点 → `{{< key-point >}}`

#### 其他

- **解答块**：`{{< solution >}}...{{< /solution >}}`，不可用 `<div>`
- **图注**：`{{< caption >}}图N.N 描述{{< /caption >}}`
- **交叉引用**：`第3章` → `[第3章](ch03.md)`，不替换标题行
- **索引**：先 `hugo build`，从 `public/` HTML 提取 heading `id`，回填链接

---

### Phase 6：验证

```bash
python3 .claude/skills/add-book-to-library/scripts/validate_book.py content/books/<book-slug>/
hugo --gc --minify
```

检查：0 issue、构建零错误、内部链接可点击、公式渲染正常、新书在菜单。

🔴 **CHECKPOINT**：展示章节数、图片数。用户决定何时 push。

---

## 失败模式速查（关键 8 条）

| 症状 | 一线修复 | 仍失败 |
|------|---------|--------|
| 公式不渲染 / `\boldsymbol` 失败 | 检查 KaTeX passthrough + full extension | 核对 `hugo.toml` 和 `static/katex/` |
| 正文拆字 / display math 吞正文 | `$$` 误包 → 去 `$$`；孤儿 `$$` → 补全 | Phase 2 重扫 |
| 标题全同级（无层次）| `## N.M.K` → `###` | Phase 4 检查 H2/H3 比例 |
| 图片不显示 / Build REF_NOT_FOUND | 路径 `![](images/x.jpg)` + `.md` 链接 | 检查相对路径和 relref |
| 书不在菜单 | 检查 `_index.md` 的 `title`/`weight` | 菜单从 content/books/ 自动生成 |
| 代码无高亮 / 裸露 | ` ```python ` 围栏 | Phase 4.5 补 fence |
| 图注/解答块样式丢失 | 用 shortcode 不是 `<div>` | `{{< caption >}}` / `{{< solution >}}` |
| shortcode 内 markdown 不解析 | 模板用 `.Inner \| .Page.RenderString` | 检查 shortcode 定义 |

完整版 + OCR/表格/Mermaid 细节 → `references/cleanup-reference.md`

---

## 反例黑名单（不要做）

| # | 禁止 | 正确做法 |
|---|------|---------|
| 1 | 跳过清洗直接拆分 | Phase 2 必须在 Phase 4 前 |
| 2 | 用 `<div class="solution">` | `{{< solution >}}` shortcode |
| 3 | 用 `<p class="caption">` | `{{< caption >}}` shortcode |
| 4 | 编辑 `public/` 下文件 | 只改 `content/` 源文件 |
| 5 | 翻译/清洗时动 LaTeX 公式 | `$x_i$` 保持原样 |
| 6 | 章节标题用 `##` | 章 `#`，节 `##`，子节 `###` |
| 7 | 不 build 手写锚点 | `hugo build` → 从 HTML 提取 id |
| 8 | PDF 放入 content/ | 放 `pdfs/`（已 gitignore） |
| 9 | 交叉引用用 `.html` 后缀 | 统一 `.md` |
| 10 | 书放分类子目录 `books/<cat>/<book>/` | 扁平 `books/<book>/` |
| 11 | `.md` 不加 front matter | 每文件 `title`/`weight`/`description` |
| 12 | 删图片引用 | 只删 `<details>`/mermaid，不碰 `![]()` |
| 13 | 手写 nav / 封面 HTML 目录 | `{{< book-toc >}}` 自动生成 |
| 14 | `_index.md` 不打 tags | 打 2-3 个领域标签 |
| 15 | 例题/业界事例保持标题 | 转 `{{< example >}}` / `{{< callout >}}` |
| 16 | 代码块不标语言 | ` ```python ` |
| 17 | 先机械化脚本再 Haiku | Phase 4.5 (Haiku) → 机械清洗 → 验证 |
| 18 | 不复制 MinerU images 到 book | 合并到 `content/books/<slug>/images/` |
| 19 | 不留 MinerU 原始 MD | 保留到 `pdfs/<book>-out/merged/book.md` |
| 20 | 拆分只靠 heading 自动匹配 | 手动确认章节边界，合并多余拆分 |
| 21 | 首页书架忘加新书卡片 | `content/_index.md` 加 `<a class="book-row">` |
| 22 | 封面手写 `<div style="">` | `<section class="book-cover">` 模板 |
