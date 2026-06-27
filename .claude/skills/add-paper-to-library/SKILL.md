---
name: add-paper-to-library
description: |
  把一篇学术论文（正文 + Supplemental Material）整理成 Hugo 论文笔记页面，加入个人数字图书馆的 `content/papers/` 板块。完整流程：归档 PDF → 提取正文/图 → 选图转 WebP → 写翻译笔记 → build 验证。
  触发词：add this paper, 加入论文, 添加论文, 把论文加入图书馆, convert paper to library, add paper to library, 写论文笔记, paper note.
---

# Add Paper to Library

把一篇学术论文（含 Supplemental Material）整理成结构化中文笔记，加入 Hugo（Hugo Book 主题）数字图书馆的 `content/papers/` 板块。

**与 add-book-to-library 的区别**：论文不做章节拆分、不用 MinerU VLM 流水线、不用 `book-toc`/`book-cover`/首页书架卡片。论文通常已有 MinerU 或 PDF 提取的 MD，只需翻译 + 写笔记 + 选图。比书简单一个数量级。

## 架构约定

```
content/papers/<paper-slug>/   # 单篇论文一个目录（section）
├── _index.md                  # 翻译正文 + 阅读笔记（全在一篇里）
└── images/                    # 精选插图（WebP），与 _index.md 同级

pdfs/papers/                   # 源 PDF 归档（整个 pdfs/ 已 gitignore）
├── Author 等 - YEAR - Title.pdf
└── Author 等 - YEAR - Title sm.pdf   # Supplemental Material（如有）
```

**🔴 关键规则**：
- 论文目录用 `_index.md`（section 列表页），**不是**普通 `.md`。`example-paper.md` 是历史遗留的单文件，新论文统一用 `_index.md`
- front matter 字段（见下）必须齐全；`weight` 比已有最后一篇 +1
- 图片用 `![](images/xxx.webp)` 相对路径，**🔴 只用 WebP，禁止 JPG/PNG**
- PDF 源放 `pdfs/papers/`（整个 `pdfs/` 已 gitignore，不会进 git）
- **🔴 英文论文必须翻译成中文**：正文、标题、图注、表格全部翻译，**LaTeX 公式保持原样不动**
- **不更新首页书架**：书架是 `content/_index.md` + `bookshelf.html`，只放书；论文在 `/papers/` section 自动列出
- **不在论文里手写目录**：一篇 `文章 + 笔记`，直接用 `##`/`###` 分节

### front matter 模板

```yaml
---
title: "<中文译名>"
description: "<一句话概括：作者（年）做了什么、核心结论>"
date: 2026-06-27            # 🔴 见下方「日期陷阱」
author: "<作者列表，逗号分隔>"
year: 2026
tags: ["领域1", "领域2", "关键词3"]   # 2-4 个中文标签
links:
  - name: "DOI (<期刊缩写>)"
    url: "https://doi.org/..."
  - name: "arXiv"
    url: "https://arxiv.org/abs/..."
weight: 3                   # 比已有 papers/ 最大 weight +1
---
```

---

## 工作流

### Phase 0：去重 + 归档 PDF

**🛑 第一步：去重检查（强制）**

```bash
# 对比已有论文目录的 title/作者，避免重复加
grep -ril "<第一作者姓>\|<关键词>" content/papers/
```

若已有同名/同作者论文 → **🛑 立即终止**，告知用户「这篇已在：content/papers/<slug>/」。

```bash
# PDF 复制到 pdfs/papers/（文件名保持 Zotero 风格：Author 等 - YEAR - Title.pdf）
cp /path/to/paper.pdf pdfs/papers/
[ -f /path/to/paper_sm.pdf ] && cp /path/to/paper_sm.pdf pdfs/papers/
```

### Phase 1：获取正文 + 图片

**优先复用已有提取**：很多论文在 `archive/papers/` 或其它工作目录里已有 MinerU 提取的 MD + images。**先找，找不到再提取。**

```bash
# 全盘搜已提取的 MD（标题片段）
find ~/ -maxdepth 6 -name "*.md" 2>/dev/null | xargs grep -l "<论文标题片段>" 2>/dev/null
```

**提取（仅当没有现成 MD 时）**：
- 用 mineru-document-extractor skill，或
- 命令行 `magic-pdf -p paper.pdf -o out/ -m auto`

提取产物：一个 `.md`（含 `![](images/xxx.jpg)` 引用）+ 一个 `images/` 目录（JPG）。

**识别正文图 vs 数据表图**：MinerU 常把每个子图拆成单独文件，并生成 `<details>` 包裹的表格数据（不是真图）。**只挑真正的 figure**，数据表一律丢弃。判断方法：
- 图片尺寸 / 内容一眼能看出是坐标轴图 → 保留
- MD 里紧跟 `<details><summary>line/scatter</summary>` 的图 → 那张图本身是真图，`<details>` 是其底层数据，丢 `<details>` 保图
- 一张多面板 figure 被拆成 N 个子图 → 挑最有代表性的 1-2 个，不必全留

### Phase 2：选图 + 转 WebP

**精选，不贪多**：一篇论文笔记留 5-8 张图足够（封面类示意 + 核心结果图 + SM 里关键的 1-2 张）。图太多读者抓不住重点。

```bash
# 建目录
DEST=content/papers/<slug>/images
mkdir -p "$DEST"

# 用语义化文件名转换（比 hash 名好维护）
convert <提取目录>/images/<hash>.jpg "$DEST/fig1-magnetization.webp"
convert <提取目录>/images/<hash>.jpg "$DEST/fig2-relaxation.webp"
# ... SM 图加 sm- 前缀
convert <sm提取目录>/images/<hash>.jpg "$DEST/sm-fig2-circuit.webp"
```

**命名规范**：`fig<N>-<一句话主题>.webp`（正文图）/ `sm-fig<N>-<主题>.webp`（SM 图）。比 MinerU 的 hash 名可读得多。

> 也可用现成脚本：`.claude/skills/add-book-to-library/scripts/convert_to_webp.sh <images_dir> <md_dir>`（批量转 + 改引用）。但论文通常手挑几张，直接 `convert` 更可控。

### Phase 3：写笔记 `_index.md`

**整体结构**（参照 `content/papers/berry-phase-solid-state-qubit/_index.md` 和 `content/papers/dissipation-driven-rabi-qpt/_index.md`）：

```markdown
---
<front matter 见上>
---

# <英文原标题>
## <中文译名>

**<作者列表（缩写名）>**

<机构列表（· 分隔）>

*<期刊>* **<卷>**, <页> (<年>)

## 摘要
<全文中文翻译摘要>

---
## 背景与动机
<翻译 + 必要的中文注释，技术术语首次出现给英文原词>

## <主体章节：模型 / 方法 / 主要结果 ...>
<翻译，公式保持 LaTeX 原样；关键图用 ![](images/figN-xxx.webp) + {{< caption >}}>

{{< callout type="important" title="..." >}}<核心要点>{{< /callout >}}

---
## 实验方案 / 数值方法（如适用）
---
## 结论
---
## 补充材料要点（如有 SM）
<SM 不必全译，提炼关键：方法细节表、与正文的对照、额外结论>

---
## 参考文献
{{< callout type="note" title="关于参考文献" >}}学术论文的参考文献条目按国际惯例保留原文...{{< /callout >}}
1. <条目，关键文献加 — **注释**>

---
## 阅读笔记

### 一句话概括
<一句话说清「用什么方法做了什么、发现了什么」>

### 核心论证链
<1. 2. 3. ... 把论文逻辑主线拆成可复述的步骤>

### <方法/物理的深入讨论小节>（如「三种方法的分工」「关键物理：X 从哪来」）

### 实验参数详解
| 参数 | 数值 | 含义 |
（把散落的参数集中成表）

### 批判性思考
**1. ...**  **2. ...**  （质疑假设、边界条件、与相关工作对比）

### 局限性
- <未验证的、理想化的、单一参数的...>

### 关键公式速查
| 公式 | 含义 | 出处 |

### 延伸阅读
- **作者（年）[ref]** — <为什么关联>（**有相关笔记的显式 cross-link**）

### 术语对照
| 中文 | 英文 | 含义 |
```

**翻译/写作要点**：
- **公式 100% 保持原样**：`$...$` 行内、`$$...$$` 行间、`\tag{N}` 保留编号。KaTeX passthrough 原样透传，动了就坏
- **技术术语首次出现给英文**：「绝热（adiabatic）」「立体角（solid angle）」——读者能顺藤摸瓜查原文
- **图注用 `{{< caption >}}` shortcode**，不要 `<p class="caption">`
- **强调/警示用 `{{< callout >}}`**：`type="important"`（核心结论）、`type="note"`（旁注/方法论说明）
- **参考文献条目保留英文原文**（作者、刊名、卷期、年），关键文献加 `— **中文短评**`
- **cross-link 相关笔记**：如果图书馆里有相关论文笔记，在「延伸阅读」和正文里显式提及（如「本图书馆有对应笔记」），形成知识网

### Phase 4：build 验证

```bash
hugo --gc 2>&1 | tail -10
```

**🔴 验证清单（逐项过）**：

1. **页面真的生成了**（最常翻车）：
   ```bash
   ls public/papers/<slug>/index.html   # 必须存在
   ```
   **如果不存在 → 见下方「日期陷阱」**（95% 是这个原因）

2. **出现在 papers 列表里**：
   ```bash
   grep -c "<slug>" public/papers/index.html   # 应 ≥ 1
   ```

3. **front matter 完整**：`title`/`description`/`date`/`author`/`year`/`tags`/`links`/`weight` 齐全

4. **图片全部引用且存在**：
   ```bash
   for img in $(grep -oE 'images/[a-z0-9-]+\.webp' content/papers/<slug>/_index.md | sort -u); do
     [ -f "content/papers/<slug>/$img" ] && echo "OK $img" || echo "MISSING $img"
   done
   ```

5. **数学渲染**：检查 HTML 里有 KaTeX 定界符透传
   ```bash
   grep -oE "\\\\\(" public/papers/<slug>/index.html | wc -l   # 应 > 0
   ```

6. **validator 过**（book 的 validator 对 paper 也能跑基本检查）：
   ```bash
   python3 .claude/skills/add-book-to-library/scripts/validate_book.py content/papers/<slug>/
   ```

---

## 🔴 日期陷阱（最容易翻车，单独讲）

**Hugo 默认不构建 `date` 在未来的页面**。这是 add-paper 比 add-book 更容易踩的坑——书有 state 文件和长流程，日期一般写当天；论文是当天一把梭，很容易写成本地「今天」而 UTC 还是「昨天」。

**症状**：
- `hugo list all` 里能看到这篇（`section,papers`），但 `public/papers/<slug>/index.html` **不生成**
- `hugo --gc` 不报错、不警告，静默跳过
- Pages 计数没增加

**根因**：
- front matter `date: 2026-06-28`（无时间）→ Hugo 解析成 `2026-06-28T00:00:00Z`（**UTC 午夜**）
- 若本地时区是 UTC+8（Asia/Shanghai），本地 6/28 凌晨对应 UTC 6/27 晚上 → `2026-06-28T00:00:00Z` 还在未来 ~7 小时
- Hugo 默认 `buildFuture = false` → 跳过

**修复（任选其一）**：
1. **写昨天的日期**（最简单）：`date: 2026-06-27`。论文笔记用「加入日期」而非「写作时刻」，差一天无所谓。已有笔记（berry-phase、dissipation-rabi-qpt）都用这个约定。
2. **带时区且是过去**：`date: 2026-06-27T23:00:00+08:00`
3. **全局开 buildFuture**（不推荐，会影响定时发布场景）：`hugo.toml` 加 `buildFuture = true`

**自检命令**（写完 date 后立刻验）：
```bash
date -u                              # 当前 UTC 时间
grep "^date" content/papers/<slug>/_index.md
# 确保 date 解析后的 UTC 时刻 ≤ 上面 date -u 的输出
```

---

## 失败模式速查

| 症状 | 一线修复 |
|------|---------|
| `public/papers/<slug>/index.html` 不生成 | **日期陷阱**——date 改成昨天（见上） |
| `hugo list all` 有但 build 没产物 | 同上，未来日期被跳过 |
| 图片不显示 / Build REF_NOT_FOUND | 路径写 `images/x.webp`（相对 _index.md），文件在 `content/papers/<slug>/images/` |
| 公式不渲染 | 检查 `$...$` / `$$...$$` 没被误改；KaTeX passthrough 在 `layouts/_partials/docs/inject/head.html` |
| 用了 JPG/PNG | `convert x.jpg x.webp` 重转，只留 WebP |
| 论文没进 `/papers/` 列表 | 检查 `_index.md`（不是普通 .md）+ front matter `title`/`weight` |
| 图注/解答块样式丢 | 用 `{{< caption >}}` shortcode，不要 `<div>` |
| 标签没聚合到 `/tags/` | `_index.md` 的 `tags` 数组写对（中文标签 OK） |

---

## 反例黑名单

| # | 禁止 | 正确做法 |
|---|------|---------|
| 1 | 用普通 `.md`（如 `my-paper.md`） | 用 `_index.md`（section 列表页，URL 干净） |
| 2 | `date` 写「今天」导致未来日期 | 写昨天的日期（`2026-06-27` 风格） |
| 3 | 翻译时动 LaTeX 公式 | 公式 100% 原样，`\tag{N}` 保留 |
| 4 | 图片留 JPG/PNG | 全部 WebP（`convert -quality 80`） |
| 5 | 图用 MinerU 的 hash 文件名 | 重命名为 `fig<N>-<主题>.webp` |
| 6 | 把所有 MinerU 子图全塞进去 | 精选 5-8 张代表性图 |
| 7 | 数据表 `<details>` 当图保留 | 丢 `<details>`，只留真 figure |
| 8 | 在首页书架加论文卡片 | 书架只放书；论文在 `/papers/` 自动列 |
| 9 | 手写 HTML 目录 / `<div class="caption">` | 用 `{{< caption >}}` / `{{< callout >}}` shortcode |
| 10 | 参考文献条目翻译成中文 | 条目保留英文原文，关键文献加中文短评 |
| 11 | PDF 放进 `content/` | 放 `pdfs/papers/`（整个 `pdfs/` gitignore） |
| 12 | 编辑 `public/` 下文件 | 只改 `content/` 源，重新 `hugo --gc` |
| 13 | SM 全文逐字翻译 | SM 提炼要点（方法表、与正文对照、额外结论） |
| 14 | 不 cross-link 相关笔记 | 「延伸阅读」里显式指向图书馆内相关论文笔记 |

---

## 参考实现

- **`content/papers/berry-phase-solid-state-qubit/`** — Leek et al. 2007，标杆模板（Science 论文，结构完整）
- **`content/papers/dissipation-driven-rabi-qpt/`** — De Filippis et al. 2023，含 SM 的 PRL 论文（多图、方法对照表、批判性思考）
- **`content/papers/example-paper.md`** — 历史遗留单文件（DQN），结构更简单，**新论文不要学它的单文件形式**

参照前两个 `_index.md` 的章节骨架和 front matter 写，基本不会出错。
