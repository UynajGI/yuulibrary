---
name: add-paper-to-library
description: |
  把一篇学术论文（正文 + Supplemental Material）整理成 Hugo 论文笔记页面，加入个人数字图书馆的 `content/papers/` 板块。完整流程：归档 PDF → 提取正文/图 → 全图转 WebP → 翻译+结构化分析（workflow 脚本）→ build 验证。
  触发词：add this paper, 加入论文, 添加论文, 把论文加入图书馆, convert paper to library, add paper to library, 写论文笔记, paper note.
---

# Add Paper to Library

把一篇学术论文（含 Supplemental Material）整理成结构化中文笔记，加入 Hugo（Hugo Book 主题）数字图书馆的 `content/papers/` 板块。

**与 add-book-to-library 的区别**：论文不做章节拆分、不用 `book-toc`/`book-cover`/首页书架卡片。论文通常已有 MinerU 或 PDF 提取的 MD，翻译用 `.claude/skills/add-book-to-library/scripts/translate_chapters.py`（单文件模式），结构化分析用 `.claude/skills/add-paper-to-library/scripts/generate_paper_note.py`。比书简单一个数量级。

## 架构约定

```
content/papers/<paper-slug>/   # 单篇论文一个目录（section）
├── _index.md                  # 翻译正文 + 阅读笔记（全在一篇里）
└── images/                    # 全部插图（WebP），与 _index.md 同级

pdfs/papers/                   # 源 PDF 归档（整个 pdfs/ 已 gitignore）
├── Author 等 - YEAR - Title.pdf
└── Author 等 - YEAR - Title sm.pdf   # Supplemental Material（如有）
```

**🔴 关键规则**：
- 论文目录用 `_index.md`（section 列表页），**不是**普通 `.md`。`example-paper.md` 是历史遗留的单文件，新论文统一用 `_index.md`
- front matter 字段（见下）必须齐全；`weight` 比已有最后一篇 +1
- 图片用 ``images/xxx.webp`` 相对路径，**🔴 只用 WebP，禁止 JPG/PNG**
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
category: ["quant-ph"]       # 🔴 arXiv 一级分类数组，查 data/arxiv_categories.json
tags: ["领域1", "领域2"]      # 1-2 个宽泛标签
links:
  - name: "DOI (<期刊缩写>)"
    url: "https://doi.org/..."
  - name: "arXiv"
    url: "https://arxiv.org/abs/..."
weight: 3                   # 比已有 papers/ 最大 weight +1
```

**🔴 category 规则**：
- **数组，多归属**——一篇论文可以身兼多类：`["quant-ph", "cond-mat"]`
- **只用 arXiv 一级分类**（`quant-ph`, `cond-mat`, `physics`, `math-ph`, `cs`, `q-fin`, `hep-th`, `gr-qc`, `stat`, `q-bio`, `nlin` 等），完整列表见 `.claude/skills/add-paper-to-library/data/arxiv_categories.json`（symlink → `data/arxiv_categories.json`，Hugo 读取用）
- 非 arXiv 领域（金融、哲学等）用自定义 key：`finance`, `philosophy`, `personal-dev`, `history`
- **查 arXiv 自动填**：有 DOI → 查 arXiv API 拿 primary category → 写进 `meta.json`。人工只在非 arXiv 论文时介入
---
```

---

## 工作流

### Phase 0：提取元数据 + 去重 + 归档 PDF

**第一步：提取元数据**

```bash
# pdf2doi 一步提取 DOI/arXiv ID + 标题 + 作者（比 pdftotext + curl arXiv API 快）
pdf2doi /path/to/paper.pdf
```

有 arXiv ID → 用 arXiv API 拿分类和摘要：
```bash
curl -s "https://export.arxiv.org/api/query?id_list=<arxiv_id>" 2>/dev/null
```

**🛑 第二步：去重检查（强制）**

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

> 后续 Phase 2/3 操作的 MD 文件路径记为 `<提取的.md>`（MinerU 提取或已有），位于 `pdfs/papers/<id>-out/` 下。翻译输出到同目录的 `<提取的>.zh.md`（不碰源文件）。

```bash
# 全盘搜已提取的 MD（标题片段）
find ~/ -maxdepth 6 -name "*.md" 2>/dev/null | xargs grep -l "<论文标题片段>" 2>/dev/null
```

**提取（仅当没有现成 MD 时）**：
- 用 mineru-document-extractor skill（**默认 `pipeline`**，零幻觉），或
- 命令行 `magic-pdf -p paper.pdf -o out/ -m auto`

提取产物：一个 `.md`（含 ``images/xxx.jpg`` 引用）+ 一个 `images/` 目录（JPG）。

**删 MinerU 数据表**：MinerU 会生成 `<details>` 包裹的表格底层数据（不是真图）。在 Phase 2 统一删除 `<details>` 块，保留真图。图片全部带上，不做精选。

### Phase 2：图片归集 + 转 WebP

**全部图片带上**：都全文翻译了，图片是正文一部分，不做精选。

```bash
# 建目录
mkdir -p content/papers/<slug>/images

# 复制全部图片（MinerU 提取目录的 images/）
cp <提取目录>/images/* content/papers/<slug>/images/

# 删 MinerU 的 <details> 数据表（不是真图，是底层数据）
sed -i '/<details>/,/<\/details>/d' <提取的.md>

# 批量转 WebP + 改 .md 引用（convert_to_webp.sh 把 images/ 下所有 JPG/PNG 转 WebP 并自动改 .md 里的引用）
.claude/skills/add-book-to-library/scripts/convert_to_webp.sh \
  content/papers/<slug>/images/ \
  content/papers/<slug>/
```

图片用 MinerU 原始 hash 文件名，不做语义化重命名。`convert_to_webp.sh` 自动把 `.md` 里的 `.jpg)` → `.webp)`。

🔴 **CHECKPOINT**：确认目录结构（`_index.md` + `images/` + 全部 WebP）。

### Phase 3：清洗 + 翻译 + 结构化分析（workflow 脚本）

`_index.md` = 翻译正文 + 结构化分析栏目。三步 workflow 脚本完成：

```bash
# 步骤1：清洗（删 MinerU 噪声 + 修 LaTeX 碎片）
python3 .claude/skills/add-book-to-library/scripts/clean_markdown.py <提取的.md>
```

```bash
# 步骤2：翻译（英文→中文，输出到 <提取的>.zh.md，不碰源文件）
python3 .claude/skills/add-book-to-library/scripts/translate_chapters.py <提取的.md>
# 翻译后再清洗一次（修翻译引入的公式碎片）
python3 .claude/skills/add-book-to-library/scripts/clean_markdown.py <提取的>.zh.md
```

```bash
# 步骤3：生成结构化分析 + 组装 _index.md
python3 .claude/skills/add-paper-to-library/scripts/generate_paper_note.py \
  <提取的>.zh.md --slug <slug> --meta <meta.json>
```
脚本自动完成：
- **自适应论文访问**：< 20000 字全文塞 context；≥ 20000 字按 `##` 切 section，LLM 用 `read_section` 工具按需读
- **ReAct 结构化分析**：LLM 反复读论文后填充模板——一句话概括 / 核心论证链 / 实验参数详解 / 批判性思考 / 局限性 / 关键公式速查 / 术语对照
- **cross-link**：扫 `static/pageindex/global-index.json` 按 tags 匹配相关论文，找不到不写（不幻想）
- **组装 `_index.md`**：front matter + 译文正文 + `## 阅读笔记`（结构化分析）+ 延伸阅读

`meta.json` 格式：
```json
{
  "title": "<中文译名>",
  "description": "<一句话：作者（年）做了什么、核心结论>",
  "date": "2026-07-04",
  "author": "<作者列表>",
  "year": 2026,
  "category": ["quant-ph"],
  "tags": ["标签1", "标签2"],
  "weight": 25
}
```

**综述路由**：如果论文 MD > 20000 字符（综述级别），脚本自动提示走 book 流程翻译拆章，产物仍放 `content/papers/<slug>/`。

🔴 **CHECKPOINT**：检查生成的 `_index.md`——
- **翻译完整性**：`python3 -c "import re; lines=open('content/papers/<slug>/_index.md').readlines(); blocks=[i for i,l in enumerate(lines) if re.search(r'[a-zA-Z]{20,}',l) and not re.search(r'[一-鿿]',l) and not l.strip().startswith('!') and not l.strip().startswith('{{<')]; print(f'{len(blocks)} English lines')"` —— 超过 5 行说明有漏翻
- **分析栏目齐全**：`grep -c "一句话概括\|核心论证链\|实验参数\|批判性思考\|局限性\|关键公式速查\|术语对照" content/papers/<slug>/_index.md` —— 必须 ≥7
- **公式是否原样**、cross-link 是否指向真实存在的论文
- **🔴 图片引用转换**：`generate_paper_note.py` 从 `.zh.md` 生成 `_index.md`，引用仍是 `.jpg`/`.png`。必须转换：
  ```bash
  sed -i 's/\.jpg)/.webp)/g; s/\.png)/.webp)/g' content/papers/<slug>/_index.md
  ```

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
   🔴 **额外校验（防翻译丢图）**：比对源文和 `_index.md` 的图片引用数是否一致：
   ```bash
   python3 -c "import re; s=len(re.findall(r'!\[\]\(images/', open('pdfs/papers/<id>-out/<file>.md').read())); d=len(re.findall(r'!\[\]\(images/', open('content/papers/<slug>/_index.md').read())); print(f'源文 {s} 张, _index {d} 张'); exit(1 if d<s else 0)"
   ```
   不一致 → 翻译丢图（`translate_chapters.py` 的 `restore_images()` 应自动补回，若仍缺手跑脚本）

5. **数学渲染**：检查 HTML 里有 KaTeX 定界符透传
   ```bash
   grep -oE "\\\\\(" public/papers/<slug>/index.html | wc -l   # 应 > 0
   ```

6. **validator 过**（`validate_book.py` 对 paper 也能跑基本检查：`$$` 配对、裸代码、naked caption 等）：
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

| 症状 | 一线修复 | 仍失败 |
|------|---------|--------|
| `public/papers/<slug>/index.html` 不生成 | **日期陷阱**——date 改成昨天（见上） | 检查 `hugo list all` 是否列出 |
| 图片不显示 / Build REF_NOT_FOUND | 路径写 `images/x.webp`（相对 _index.md），文件在 `content/papers/<slug>/images/` | 重跑 `convert_to_webp.sh` |
| 公式不渲染 / display math 奇数 | 再跑 `clean_markdown.py <file>.zh.md` 修碎片 | 手动检查 math 配对 | <!-- validate-skip -->
| 翻译截断（译文远短于原文） | `translate_chapters.py` 自动分段+检测截断；重跑 `--retry 2` | 检查 `.zh.md` 是否只有部分 section |
| 结构化分析栏目缺失 | 重跑 `generate_paper_note.py`（LLM 输出有随机性） | 检查 section 模式是否读了全部章节 |
| 综述论文（>10 万字）触发路由 | 按提示走 book 流程翻译拆章，产物放 papers/ | 手动用 `translate_chapters.py <dir>/ --seed-chapters 2` |
| 参考文献被翻译成中文 | `translate_chapters.py` 有参考文献隔离（`## References` 后原样保留） | 确认源文件参考文献 section 标题是 `## References` |
| 论文没进 `/papers/` 列表 | 检查 `_index.md`（不是普通 .md）+ front matter `title`/`weight` | 检查 `category` 数组是否合法 |
| 标签没聚合到 `/tags/` | `_index.md` 的 `tags` 数组写对（中文标签 OK） | — |
| 阅读笔记消失 | `strip_preamble` bug——分析不是 `###` 开头则整段丢弃（如 LLM 输出"以下是修正版："）。已修复，但生成后仍需 grep 7 栏目确认 | 重跑 `generate_paper_note.py` |
| 附录/尾部章节漏翻（全英文） | API 输出 token 超限导致尾部 chunk 截断。`CHUNK_THRESHOLD` 已降为 4500，截断检测已收紧。翻译报告中的"可能漏翻"提示需认真对待 | 补译后重跑 clean + generate |
| **译文图片丢失**（源文 8 张图译文只剩 2 张） | `translate_chapters.py` 已内置 `restore_images()`：翻译后自动比对源文/译文图片引用数，缺失的按 caption 图号对齐补回（确定性，不依赖 LLM）。仍丢失→检查源文 caption 是否含"图N"标记 | 手动用 `restore_images(src, dst)` 补 |
| 论文较长被拒绝 | `LONG_PAPER_THRESHOLD` 100K 太激进（含大量图/公式的论文字符数虚高），已改为 200K。不是综述的论文被拒可手动绕过 | — |
| 算法块未用伪代码 JS | `generate_paper_note.py` 不处理算法格式。翻译后检查 ` ```matlab ` / ` ```python ` 围栏中是否有伪代码，手动转为 `{{< algorithm >}}<pre class="pseudocode">` | 手动转换，参照 `content/_reference/elements.md` |
| **阅读笔记是自我审查摘要**（"一句话概括 — 合格 / 核心论证链 — 合格"） | `generate_paper_note.py` 的 reflection prompt 让 LLM 数缺陷而非输出全文。2026-07-07 已 fix：prompt 不再要求"逐一指出缺陷"，直接要求输出完整版 + 安全网检测自审语言回退到 draft。仍出现→重跑脚本 | 检查 `_index.md` 是否含"合格"+"栏目"，是则重生成 |
| **`_index.md` 图片引用是 `.jpg`/`.png` 而非 `.webp`** | Phase 2 的 `convert_to_webp.sh` 在 `_index.md` 生成之前运行，所以引用不会被转换。**Phase 3 后必须 `sed -i 's/\\.jpg)/.webp)/g; s/\\.png)/.webp)/g' content/papers/<slug>/_index.md`** | 检查 images/ 目录是否已有 webp，确认后手动 sed |

---

## 反例黑名单

| # | 禁止 | 正确做法 |
|---|------|---------|
| 1 | 用普通 `.md`（如 `my-paper.md`） | 用 `_index.md`（section 列表页，URL 干净） |
| 2 | `date` 写「今天」导致未来日期 | 写昨天的日期（`2026-06-27` 风格） |
| 3 | 翻译时动 LaTeX 公式 | 公式 100% 原样（`$...$`/`$$...$$`/`\(...\)`/`\[...\]`），`\tag{N}` 保留 |
| 4 | 图片留 JPG/PNG | 全部 WebP（`convert -quality 80`） |
| 5 | 精选图片只留 5-8 张 | 全部带上，图片是正文一部分 |
| 6 | 手动 convert 单张图片 | 用 `convert_to_webp.sh` 批量转 |
| 7 | 数据表 `<details>` 当图保留 | 丢 `<details>`，只留真 figure |
| 8 | 在首页书架加论文卡片 | 书架只放书；论文在 `/papers/` 自动列 |
| 9 | 手写 HTML 目录 / `<div class="caption">` | 用 `{{< caption >}}` / `{{< callout >}}` shortcode |
| 10 | 参考文献条目翻译成中文 | 条目保留英文原文，关键文献加中文短评 |
| 11 | PDF 放进 `content/` | 放 `pdfs/papers/`（整个 `pdfs/` gitignore） |
| 12 | 编辑 `public/` 下文件 | 只改 `content/` 源，重新 `hugo --gc` |
| 13 | SM 全文逐字翻译 | SM 提炼要点（方法表、与正文对照、额外结论） |
| 14 | cross-link 指向不存在的笔记 | 脚本扫 global-index.json 按 tags 匹配，找不到不写 |
| 15 | 翻译/分析走 subagent | 翻译走 translate_chapters.py，分析走 generate_paper_note.py |
| 16 | 翻译后不扫漏翻直接进分析 | 翻译报告里的"可能漏翻"必须认真对待；生成后 grep 英文行数确认 < 5 |
| 17 | 分析生成后不验证栏目齐全 | `grep -c` 7 栏目名必须 ≥7，0 = strip_preamble bug 吞了整篇 |
| 18 | 算法伪代码留在 ` ```matlab ` 围栏里 | 转为 `{{< algorithm >}}<pre class="pseudocode">` + 小写裸命令 |

---

## 参考实现

- **`content/papers/berry-phase-solid-state-qubit/`** — Leek et al. 2007，标杆模板（Science 论文，结构完整）
- **`content/papers/dissipation-driven-rabi-qpt/`** — De Filippis et al. 2023，含 SM 的 PRL 论文（多图、方法对照表、批判性思考）
- **`content/papers/example-paper.md`** — 历史遗留单文件（DQN），结构更简单，**新论文不要学它的单文件形式**

参照前两个 `_index.md` 的章节骨架和 front matter 写，基本不会出错。
