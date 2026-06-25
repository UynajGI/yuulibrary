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
- 图片用 `![](images/xxx.webp)` 相对路径，与 .md 同级。**🔴 只用 WebP，禁止 JPG/PNG**
- PDF 源放 `pdfs/`（gitignore），MinerU 原始 MD 保留到 `pdfs/<book>-out/merged/book.md`

---

## 工作流

### 🛑 强制入口：去重 + 状态文件

处理任何书之前，**第一步必须做去重检查**：

```bash
# 计算新 PDF/EPUB 的 SHA256
sha256sum /path/to/book.{pdf,epub}

# 对比所有已有文件（hash 碰撞 = 绝对重复）
sha256sum pdfs/*.{pdf,epub} 2>/dev/null | grep <hash 前 8 位>
```

若 hash 匹配 → **🛑 立即终止**，告知「这本书已在图书馆中」。

**自动路由**：
- `.pdf` → Phase 1A（MinerU VLM）
- `.epub` → Phase 1B（unzip + pandoc）

然后检查 `pdfs/<book-id>.state.json`：
- 存在 → 读 `current_phase`，从中断点恢复
- 不存在 → **🛑 STOP，必须先完成 Phase 0**

每 phase 完成强制写状态文件。格式见 [Phase 0](#phase-0)。

---

### Phase 0：归集 PDF + 状态文件

**🛑 第一步：去重检查（强制，不可跳过）**

```bash
# 用 SHA256 对比所有已有 PDF
sha256sum /path/to/book.pdf
sha256sum pdfs/*.pdf | grep <hash>
```

```bash
# 同时检查 state 文件里是否有同书名/同作者
grep -il "强化学习入门\|叶强" pdfs/*.state.json
```

如果在状态文件或 `content/books/` 中发现匹配 → **立即终止，告知用户「这本书已在图书馆中：content/books/<slug>/」**，不创建新状态文件。

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
    "phase_1": { "status": "pending", "note": "Phase 1A (PDF via MinerU VLM) or Phase 1B (EPUB via unzip+pandoc)" },
    "phase_2": { "status": "pending", "note": "Clean markdown" },
    "phase_3": { "status": "pending", "note": "Choose slug + create dir" },
    "phase_4": { "status": "pending", "note": "Split into chapters + front matter" },
    "phase_5": { "status": "pending", "note": "Format: cover, TOC, templates" },
    "phase_6": { "status": "pending", "note": "Build and verify" }
  }
}
```

---

### Phase 1A：PDF → Markdown（默认）

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

### Phase 1B：EPUB → Markdown（ebook 格式）

EPUB 是 ZIP 包着 XHTML，不需 VLM。直接解压转换。

```bash
# 解压
mkdir -p pdfs/<book-id>-out/epub/
unzip -o pdfs/<book>.epub -d pdfs/<book-id>-out/epub/

# 找到 XHTML 内容目录（通常是 OEBPS/ 或 OPS/）
find pdfs/<book-id>-out/epub/ -name "*.xhtml" -o -name "*.html" | head -5

# 批量 XHTML → Markdown（用 pandoc）
mkdir -p pdfs/<book-id>-out/epub-md/
for f in pdfs/<book-id>-out/epub/OEBPS/*.xhtml; do
  name=$(basename "$f" .xhtml)
  pandoc -f html -t markdown "$f" -o "pdfs/<book-id>-out/epub-md/${name}.md"
done

# 按文件名排序合并（EPUB 的 spine 顺序通常与文件名一致）
cat pdfs/<book-id>-out/epub-md/*.md | sed '/^::: {#.*}$/d' > pdfs/<book-id>-out/merged/book.md

# 提取图片（EPUB 的 images/ 通常在 OEBPS/ 或 OPS/ 下）
find pdfs/<book-id>-out/epub/ -type d -iname "images" -o -iname "image" -o -iname "img"
# 找到后复制到 Phase 3 创建的 content/books/<slug>/images/
# 路径通常在 epub/OEBPS/images/ 或 epub/OPS/images/
```

**图片路径修复**：pandoc 转换后图片引用仍指向 EPUB 内部路径（如 `OEBPS/images/foo.jpg`）。Phase 3 统一归集 + 转 WebP：

```bash
# 复制图片到最终目录
cp pdfs/<book-id>-out/epub/OEBPS/images/* content/books/<slug>/images/

# 修正 markdown 中的图片路径（EPUB 内部路径 → 扁平 images/）
sed -i 's|OEBPS/images/|images/|g; s|OPS/images/|images/|g' pdfs/<book-id>-out/merged/book.md
```

WebP 转换在 Phase 3 统一处理。

**失败分支**：
- pandoc 不可用 → `apt install pandoc` / `brew install pandoc`
- XHTML 文件不在 OEBPS/ → `find` 搜索 `.xhtml`，手动确认目录
- 图片找不到 → `find` 搜索 `*.jpg` `*.png` `*.gif` `*.svg`，确认 EPUB 的图片目录结构

**优势**（与 PDF 相比）：
- 无 VLM 调用，免费 + 瞬时
- 无 OCR 损坏，标题层级天然正确
- 数学公式、代码块保留原始格式

---

### Phase 2：清洗 Markdown

1. 跑 `scripts/clean_markdown.py`（LaTeX 空白、数字间距、页眉泄露）
2. 逐条检查 MinerU 损坏（13 项清单详见 `references/cleanup-reference.md`）：
   - `$$` 误包正文、孤儿 `$$`、标题平铺、裸代码、缩进丢失、转义残留、
     `def__init__` 粘连、代码注释被标为标题、`mineru-algorithm` div 等
3. 删除版权信息（ISBN、客服热线/邮箱）
4. **列表标准化**：`（1）` `①` `●` `1）` `◆` → `1.` / `- ` 标准 Markdown 列表

🔴 **CHECKPOINT**：展示清理前后对比，用户确认后继续。

---

### Phase 3：选择 slug + 创建目录

询问用户 URL slug。创建：

```bash
mkdir -p content/books/<book-slug>/images
```

#### 图片归集 + WebP 转换

MinerU 或 EPUB 提取的图片统一归集到 `content/books/<slug>/images/`，**全部转为 WebP**：

```bash
# 1. 复制 MinerU 图片（Phase 1A）或 EPUB 图片（Phase 1B）
cp pdfs/<book-id>-out/part*/*.jpg content/books/<slug>/images/   # MinerU
# 或
cp pdfs/<book-id>-out/epub/OEBPS/images/* content/books/<slug>/images/  # EPUB

# 2. 全部 JPG/PNG → WebP + 替换引用（一键脚本）
.claude/skills/add-book-to-library/scripts/convert_to_webp.sh \
  content/books/<slug>/images/ \
  pdfs/<book-id>-out/merged/
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

**失败分支**：

| 症状 | 一线修复 | 仍失败 |
|------|---------|--------|
| `## Chapter` 匹配不到章节边界 | 尝试 `# Chapter` / `### Chapter` | 让用户提供边界关键词 |
| MinerU 把子节（`# 8.3 xxx`）误标为新章 | 检查编号连续性；`# N.M` 无「章」字的降级为 `##` | 手工合并到所属章文件 |
| 拆分后某章只有 1-2 个段落 | 向前合并到上一章（子节被误拆） | 让用户确认合并 |
| 图片引用断裂（拆分后路径不对） | `![](images/xxx.webp)` 相对路径，确认 images/ 与 .md 同级 | Phase 6 用 validate_book.py 扫描 |

🔴 **CHECKPOINT**：展示拆分结果（章数、每章行数、H1 标题清单），用户确认后再进 Phase 4.5。

**🔴 Part 分隔页**：如果书有「第X部分」的篇章结构，Part 页码作为独立页面，不嵌入章节内。用卡片链接到所属章节：

```html
<a class="part-chapter" href="ch01.html">
  <span class="part-chapter-num">第 1 章</span>
  <span class="part-chapter-title">系统之基础</span>
  <span class="part-chapter-desc">要素、连接、目标；存量和流量。</span>
</a>
```

- Part 页 weight 在所属第一章之前（如 part-1=9，ch01=10）
- 链接用 `.html` 后缀（`uglyurls = true`），不用 `.md` 或 `{{< relref >}}`
- 🔴 Goldmark 不处理 `<div>` 内的 Markdown/短代码，链接必须用纯 HTML `<a href="xxx.html">`

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

🔴 **处理顺序**：机械 grep 扫描（AI 会漏，grep 不会）→ Haiku agent 逐章审核 → 机械化脚本（空块/compound 分解）→ validate_book.py

```bash
# 先跑机械 grep 过滤（非标准列表、弯引号、callout 内 heading）
grep -rn '^●\|^◆\|^①\|^（[0-9]）' content/books/<slug>/
grep -rn 'type="[^"]*"' content/books/<slug>/
grep -rn '^### .*学家\|^### .*作者' content/books/<slug>/
# 命中 → sed 机械化修复，不依赖 AI 逐一判断
```

🔴 **CHECKPOINT**：展示审核统计（修复数、剩余 warning 数、validate_book.py 输出），用户确认后进 Phase 5。

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
| 图片不显示 / Build REF_NOT_FOUND | 路径 `![](images/x.webp)` + `.md` 链接 | 检查相对路径和 relref |
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
| 17 | 跳过机械 grep 直接 Haiku | 机械 grep 扫描（AI 会漏）→ Haiku 逐章审核 → 机械清洗（空块/compound）→ 验证 |
| 18 | 不复制 MinerU images 到 book | 合并到 `content/books/<slug>/images/` |
| 19 | 不留 MinerU 原始 MD | 保留到 `pdfs/<book>-out/merged/book.md` |
| 20 | 拆分只靠 heading 自动匹配 | 手动确认章节边界，合并多余拆分 |
| 21 | 首页书架忘加新书卡片 | `content/_index.md` 加 `<a class="book-row">` |
| 22 | 封面手写 `<div style="">` | `<section class="book-cover">` 模板 |
| 23 | 图片用 JPG/PNG 格式 | WebP only（Phase 3 统一转换），质量 80 有损模式 |
