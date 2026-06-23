---
name: add-book-to-library
description: |
  将 PDF 书籍转换为 Hugo 页面并加入个人数字图书馆。完整流程：PDF 提取（MinerU VLM）→ Markdown 清洗 → 章节拆分 → 格式化 → front matter 接入。
  触发词：add this book, 加入图书馆, 添加书籍, 把 PDF 转成网页, 把书加入图书馆, convert PDF to library, add book to library, 个人图书馆, digital library.
---

# Add Book to Library

将一本 PDF 学术书籍加入已有的 Hugo（Hugo Book 主题）数字图书馆。

## 架构

```
repo/
├── hugo.toml                       # 主配置
├── content/
│   ├── _index.md                   # 图书馆首页（书架卡片 + 最近笔记）
│   ├── books/                      # 书籍（扁平结构，按书名 slug）
│   │   └── <book-slug>/
│   │       ├── _index.md           # 封面 + 目录（section 列表页）
│   │       ├── preface.md
│   │       ├── ch01.md ~ ...       # 章节（每文件带 front matter）
│   │       ├── index_term.md       # 索引（可选）
│   │       └── images/             # 图片（与 .md 同级，相对路径引用）
│   ├── notes/                      # 笔记（带 date/tags）
│   └── papers/                     # 论文笔记（带 author/year/tags）
├── layouts/                        # 短代码 / 模板覆盖
│   ├── _shortcodes/
│   │   ├── solution.html           # {{< solution >}} 解答块
│   │   ├── caption.html            # {{< caption >}} 图注/表注
│   │   └── recent-notes.html       # 首页最近笔记
│   └── _default/
│       ├── list.html               # 卡片网格列表页
│       ├── taxonomy.html           # /tags/ 标签云
│       └── term.html               # /tags/foo/ 标签文章页
├── assets/custom.scss              # 全局样式（苹果风卡片/圆角）
└── pdfs/                           # PDF 源文件（本地，不入库）
```

**关键约定**：
- 书籍**扁平存放**：`content/books/<book-slug>/`，无分类中间目录（分类靠书名区分，菜单自动从目录结构生成）
- **每个 .md 文件必须有 front matter**：`title`（显示名）+ `weight`（排序，封面 1，前言 2，章节从 10 起递增）
- 书的封面页是 `_index.md`（section 列表页），章节是普通 `.md`

---

## 工作流

### 🛑 强制入口：状态文件

**处理任何书之前，必须先检查 `pdfs/<book-id>.state.json` 是否存在。**

- 存在 → 读取 `current_phase`，从中断点恢复
- 不存在 → **🛑 STOP，必须先完成 Phase 0 才能继续**

每个 phase 完成后**强制**写入状态文件。

---

### Phase 0：归集 PDF + 创建状态文件

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
    "phase_0": { "status": "done", "note": "PDF copied to pdfs/" },
    "phase_1": { "status": "pending", "note": "PDF to Markdown via MinerU VLM" },
    "phase_2": { "status": "pending", "note": "Clean markdown" },
    "phase_3": { "status": "pending", "note": "Choose slug + create dir" },
    "phase_4": { "status": "pending", "note": "Split into chapters + front matter" },
    "phase_5": { "status": "pending", "note": "Format special pages" },
    "phase_6": { "status": "pending", "note": "Build and verify" }
  }
}
```

### Phase 1：PDF → Markdown

调用 `/mineru-document-extractor`：

```bash
mineru-open-api extract book.pdf -o out/ -f md --model vlm --language en --timeout 3600
```

**失败分支**：API 超时 → 按 200 页拆分重试（`--pages 1-200` / `--pages 201-400`）。

### Phase 2：清洗 Markdown

运行 `scripts/clean_markdown.py`（在此 skill 的 scripts/ 下）：
- LaTeX 空白修复（`x _ {i}` → `x_{i}`）
- 数学内数字间距（`1 0 0` → `100`）
- 页眉泄露、脚注上标

**中文书额外手动清理**：OCR 伪影、重复标题行、ISBN/版权/客服信息。

🔴 **CHECKPOINT**：展示前 50 行 before/after，用户确认后继续。

### Phase 3：选择 slug + 创建目录

询问用户书的 URL slug（短横线命名，如 `quant-finance-interview`）。

```bash
mkdir -p content/books/<book-slug>/images
```

🔴 **CHECKPOINT**：确认 `content/books/<book-slug>/` 后继续。

更新状态文件 `slug` 字段。

### Phase 4：拆分章节 + front matter

找到 `## Chapter N` 或 `## 第N章` 边界，每章存为 `ch01.md`、`ch02.md` ……

**🔴 关键：每个文件加 front matter**：

```yaml
---
title: "第1章 · 引言"
weight: 10
---
```

- 封面页 → `_index.md`：`title: "<书名>"`，`weight: 1`，`BookCollapseSection: true`
- 前言 → `preface.md`：`title: "前言"`，`weight: 2`
- 符号/算法列表 → `weight: 3/4`
- 章节从 `weight: 10` 起递增（`ch01`=10, `ch02`=11...）

标题层级：章节 `#`（H1），节 N.M `##`（H2），问题/主题 `###`（H3）。
页码 ≤ 15 的薄书不拆分。

**修复代码注释被误识别为标题**：代码块内 `# ` 开头的行降级为 `## `。

**失败分支**：`## Chapter` 匹配不到 → 改用 `# Chapter` / `### Chapter`；仍失败让用户提供章节边界词。

### Phase 4.5：逐章审核（Haiku 并行）

每章 spawn 一个 Haiku agent 独立校对：
1. **OCR 错误** — 数学符号误识别（λ→入、∑→Σ 空）
2. **算法伪代码格式** — 行合并/缩进/变量名
3. **表格图标题** — `表N.N`/`图N.N` 独立成行
4. **Mermaid 伪流程图** — 删 `<details>` + mermaid 块，留原图 `![](images/xxx.jpg)`
5. **标题层级** — 代码注释 `#` 误为 H1
6. **交叉引用** — `第N章` 转链接

每个 agent 返回修复后内容 + 修复清单。

### Phase 5：格式化

#### 封面 + 目录（`_index.md`）

```markdown
---
title: "<书名>"
weight: 1
BookCollapseSection: true
---

<div style="text-align: center; padding: 3rem 0 2rem;">
  <h1 style="font-weight: 700;"><书名></h1>
  <p style="color: var(--gray-500);">作者</p>
</div>

## 目录

<table style="width:100%;"><tbody>
<tr><td style="width:20%"><a href="{{< relref "/books/<slug>/ch01.md" >}}"><strong>第1章</strong></a></td><td>章标题</td></tr>
...
</tbody></table>
```

**注意**：封面页文件名是 `_index.md`（不是 `index.md`），设 `BookCollapseSection: true` 让菜单默认折叠。

#### 符号说明（`notations.md`）

4 栏 markdown 表格：

```markdown
---
title: "常用符号"
weight: 3
---

| 符号 | 含义 | 符号 | 含义 |
|------|------|------|------|
| E | 期望 | π | 策略 |
```

#### 算法列表（`algorithms.md`，如有）

```markdown
---
title: "算法列表"
weight: 4
---

| # | 算法 | 章节 |
|---|------|------|
| 1 | Q 学习算法 | [第5章](ch05.md) |
```

#### 算法伪代码

使用 pseudocode.js（本地 `static/pseudocode.min.js`）。**语法是小写无斜杠**：

```html
<pre class="pseudocode">
\begin{algorithm}
\caption{算法 1: Sarsa算法}
\begin{algorithmic}
state 输入: episodes, α, γ
state 输出: Q
for{each episode}
    state S ← first state
    repeat
        state Q(S, A) ← Q(S, A) + α(R + γQ(S', A') - Q(S, A))
    until{S is terminal state}
endfor
\end{algorithmic}
\end{algorithm}
</pre>
```

| pseudocode.js 命令 | LaTeX 等价 |
|---|---|
| `state` | `\STATE` |
| `for{...} ... endfor` | `\FOR{...} \ENDFOR` |
| `if{...} ... endif` | `\IF{...} \ENDIF` |
| `while{...} ... endwhile` | `\WHILE{...} \ENDWHILE` |
| `repeat ... until{...}` | `\REPEAT \UNTIL{...}` |
| `return{...}` | `\RETURN{...}` |
| `procedure{name}{params} ... endprocedure` | `\PROCEDURE` |
| `require` / `ensure` / `input` / `output` | `\REQUIRE` 等 |
| `// comment` | `\COMMENT{...}` |

**依赖**：KaTeX（本地 `static/katex/`）+ pseudocode.js，已在 `layouts/_partials/docs/inject/head.html` 全站加载，无需每页引入。

#### 表格标题

用 shortcode（**不是** `<p class="caption">`）：
```
{{< caption >}}表5.1　n步Q收获{{< /caption >}}
```
紧接在 `<table>` 之前。

#### 跨页面交叉引用

遍历所有 `ch*.md`，将正文「第 N 章」转为链接：
```
第3章 → [第3章](ch03.md)
```
**链接用 `.md` 后缀**——Hugo Book 主题的 `BookPortableLinks` 会自动转为 permalink。不替换标题行（`# 第N章`）和已有链接。

#### 解答块

用 shortcode（**不是** `<div class="solution" markdown="1">`）：
```
{{< solution >}}

解答：...

{{< /solution >}}
```
shortcode 内部可正常写 Markdown。

**失败分支**：`{{< /solution >}}` 漏写 → grep `{{< solution >}}` 出现次数应等于 `{{< /solution >}}`。

#### 元素模板（统一框式元素）

一套统一的 shortcode，左边框色区分类型，圆角，柔和背景：

| 元素 | shortcode | 用途 | 配色 |
|------|-----------|------|------|
| 提示框 | `{{< callout type="tip" title="标题" >}}...{{< /callout >}}` | tip/note/warning/important | 蓝/灰/橙/红 |
| 定义 | `{{< definition title="MDP" >}}...{{< /definition >}}` | 教材定义 | 紫 |
| 定理 | `{{< theorem type="定理" title="贝尔曼方程" >}}...{{< /theorem >}}` | 定理/引理/命题/推论 | 蓝 |
| 例题 | `{{< example title="赌徒破产" >}}...{{< /example >}}` | 例题，可嵌套 solution | 绿 |
| 要点 | `{{< key-point >}}...{{< /key-point >}}` | 章节末总结 | 橙 |
| 算法 | `{{< algorithm title="Sarsa" >}}<pre class="pseudocode">...{{< /algorithm >}}` | pseudocode.js 算法块 | 青 |

#### 算法块（pseudocode.js，用 algorithm shortcode 包裹）

用 `{{< algorithm >}}` 包裹 `<pre class="pseudocode">`，给统一框式外观（青色标签）。语法见下方 pseudocode.js 命令表。

#### 标题层级规范

- 章标题：`# 第N章 标题`（H1，每章一个，最顶部）
- 节：`## N.M 标题`（H2）
- 问题/子节：`### 标题`（H3）
- **禁止**：同一文件出现多个 `#` H1（MinerU 常见错误，会把节标题也标成 H1，需 Phase 2 降级）

#### 索引（`index_term.md`，如有）

6 栏表格：`| 术语 | 章节 | 术语 | 章节 | 术语 | 章节 |`。

跨页面锚点：**先 `hugo build`，从 `public/` 的 HTML 提取实际 heading `id`**（Hugo 用 Goldmark slugify，中文保留、空格→`-`、点号删除），再回填链接。可用 `scripts/remap_index_anchors.py` 辅助（项目根）。

### Phase 6：验证（原 Phase 7，已无"接入导航"步骤）

Hugo 的左侧菜单从**目录结构 + front matter 的 weight** 自动生成，无需手写 nav。首页书架卡片也无需手动加（若要让新书出现在首页，在 `content/_index.md` 手动加一张卡片即可）。

```bash
hugo --gc --minify
```

检查：
- 构建零错误零警告
- 所有内部链接可点击（`.md` 链接被主题解析）
- 公式、解答块、算法块渲染正常
- 新书出现在左侧菜单（自动折叠）

🔴 **CHECKPOINT**：通过后展示章节数、图片数。用户决定何时 push。

---

## 失败模式速查

| 症状 | 一线修复 | 仍失败 |
|------|---------|--------|
| 公式不渲染 | 检查 `$`/`$$` 分隔符；KaTeX 在 head inject 全站加载 | 确认 `assets/katex.json` 含 `$` 分隔符 |
| `\boldsymbol` 未渲染 | KaTeX 本地包含全扩展 | 检查 `static/katex/` 完整 |
| 超宽公式溢出 | `\begin{aligned}` 手动断行 | — |
| shortcode 内 md 不解析 | shortcode 模板用 `.Inner \| .Page.RenderString` | 检查 `layouts/_shortcodes/solution.html` |
| 解答块颜色消失 | 检查 `assets/custom.scss` 中 `.solution` 定义 | 确认用 `{{< solution >}}` 不是 `<div>` |
| 索引锚点 404 | `hugo build` 后从 HTML 提取 id | 用 `scripts/remap_index_anchors.py` |
| 图片不显示 | 相对路径 `![](images/x.jpg)`，与 .md 同级 | 不是 `![](../images/)` |
| Build 报 REF_NOT_FOUND | `.md` 链接路径错误；HTML 表格链接用 `{{< relref >}}` | 检查 `relref` 绝对路径 `/books/<slug>/ch01.md` |
| 书不在菜单 | 书的 `_index.md` 存在 + `title`/`weight` 正确 | 菜单从 `content/books/` 自动生成 |
| 图注/表注未区分 | 用 `{{< caption >}}...{{< /caption >}}` | — |
| OCR 伪影 `<details>` | 删除空 `<details>`，留 `![](image)` | Phase 4.5 Haiku 审核 |

---

## 反例黑名单（不要做）

| # | 禁止 | 原因 | 正确做法 |
|---|------|------|---------|
| 1 | 跳过清洗直接拆分 | LaTeX 垃圾污染全书 | Phase 2 必须在 Phase 4 前 |
| 2 | 用 `<div class="solution" markdown="1">` | Hugo Goldmark 不支持 md_in_html | 用 `{{< solution >}}` shortcode |
| 3 | 用 `<p class="caption">` | 直接写 HTML class 不被 shortcode 处理 | 用 `{{< caption >}}` shortcode |
| 4 | 编辑 `public/` 下文件 | `public/` 是构建产物，下次 build 被覆盖 | 只改 `content/` 源文件 |
| 5 | 翻译时动 LaTeX 公式 | `$x_i$` → `$x _ i$` 破坏数学 | 翻译 prompt 黑名单保护公式 |
| 6 | 章节标题用 `##` | 菜单层级错误 | 章节 `#`，节 `##` |
| 7 | 不 build 手写锚点 | Hugo Goldmark slug 规则与直觉不同 | `hugo build` → 从 HTML 提取 id |
| 8 | PDF 放入 content/ | 会发布到网站 | 放 `pdfs/`（已 gitignore） |
| 9 | 交叉引用用 `.html` 后缀 | Hugo 期望 `.md`，BookPortableLinks 自动转换 | 统一 `.md` |
| 10 | 书放分类子目录 `books/<cat>/<book>/` | 菜单递归不到深层，书会消失 | 扁平 `books/<book>/` |
| 11 | .md 文件不加 front matter | 菜单不显示、排序乱 | 每文件加 `title`/`weight` |
| 12 | 删图片引用 | 书中原始插图，删了不可逆 | 永远只删 `<details>`/mermaid，不碰 `![]()` |
| 13 | 手写 mkdocs nav / 首页卡片接入 | Hugo 无 nav 配置，菜单自动生成 | Phase 6 已删除"接入导航"步骤 |

---

## 经验总结

### 基础设施（已就绪，无需每书配置）

1. **KaTeX 本地化** — `static/katex/`（CSS/JS/20 字体），`$`/`$$` 分隔符
2. **pseudocode.js 本地化** — `static/pseudocode.min.{js,css}`
3. **全站加载** — `layouts/_partials/docs/inject/head.html` 注入 KaTeX auto-render + pseudocode 渲染
4. **BookPortableLinks** — markdown `.md` 链接自动转 permalink（`hugo.toml` 设 `warning`）
5. **lefthook pre-push** — `hugo --gc --minify` 阻断构建失败的提交

### 常见 OCR 误识别

| 原文 | 误识别 | 修复 |
|------|--------|------|
| λ | 入 | 上下文替换 |
| S₁ | .s. | Phase 4.5 Haiku |
| `\mathrm{S}` | `\mathrm {~ s ~}` | `\\[a-z]+ {` → `\\\1{` |

### 表格格式化

- 格子世界：`<table class="grid-world">`（CSS 固定格子）
- 数据表格：居中、padding（custom.scss 已配置）
- 表注：`{{< caption >}}表N.N 标题{{< /caption >}}`

### Mermaid 流程图清理

MinerU 双重输出流程图：原图 PNG + `<details><summary>flowchart</summary>`mermaid````</details>`。
**处理**：删 `<details>` 和 mermaid 块，留 `![](images/xxx.jpg)` 原图。

### 版权信息清理

Phase 2 删除：ISBN、版权声明、客服热线/邮箱、源代码下载链接（保留 GitHub 链接）。
