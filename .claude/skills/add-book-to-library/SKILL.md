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
- 图片用 ``images/xxx.webp`` 相对路径，与 .md 同级。**🔴 只用 WebP，禁止 JPG/PNG**
- PDF 源放 `pdfs/books/`（gitignore），MinerU 原始 MD 保留到 `pdfs/books/<book>-out/merged/book.md`
- **🔴 英文书籍必须翻译成中文**：正文、标题、图注、表格全部翻译，LaTeX 公式保持原样
- **🔴 目录自动生成**：`_index.md` 用 `{{< book-toc >}}`，正文里不手写目录

---

## 工作流

### 🛑 强制入口：去重 + 状态文件

处理任何书之前，**第一步必须做去重检查**：

```bash
# 计算新 PDF/EPUB 的 SHA256
sha256sum /path/to/book.{pdf,epub}

# 对比所有已有文件（hash 碰撞 = 绝对重复）
sha256sum pdfs/books/*.{pdf,epub} 2>/dev/null | grep <hash 前 8 位>
```

若 hash 匹配 → **🛑 立即终止**，告知「这本书已在图书馆中」。

**自动路由**（统一用 `extract.py`，按扩展名分发）：
- `.pdf` → Phase 1A（MinerU VLM）
- `.docx` → Phase 1A（MinerU VLM，MinerU 原生支持 DOCX）
- `.epub` → Phase 1B（unzip + pandoc）
- `.fb2` → Phase 1C（XML 解析，无需 VLM）
- `.txt` → Phase 1D（编码检测 + 章节启发式切分）

```bash
# 统一提取入口（所有格式）
python3 .claude/skills/add-book-to-library/scripts/extract.py <input> --out pdfs/books/<book-id>-out/
# PDF 大书可分批
python3 .claude/skills/add-book-to-library/scripts/extract.py book.pdf --out pdfs/books/<book-id>-out/ --pages 1-110
```

输出统一到 `pdfs/books/<book-id>-out/merged/book.md` + `images/` + `meta.json`（含 title/author/source_format）。

然后检查 `pdfs/books/<book-id>.state.json`：
- 存在 → 读 `current_phase`，从中断点恢复
- 不存在 → **🛑 STOP，必须先完成 Phase 0**

每 phase 完成强制写状态文件。格式见 [Phase 0](#phase-0)。

---

### Phase 0：归集 PDF + 状态文件

**🛑 第一步：去重检查（强制，不可跳过）**

```bash
# 用 SHA256 对比所有已有 PDF
sha256sum /path/to/book.pdf
sha256sum pdfs/books/*.pdf | grep <hash>
```

```bash
# 同时检查 state 文件里是否有同书名/同作者
grep -il "强化学习入门\|叶强" pdfs/books/*.state.json
```

如果在状态文件或 `content/books/` 中发现匹配 → **立即终止，告知用户「这本书已在图书馆中：content/books/<slug>/」**，不创建新状态文件。

```bash
cp /path/to/book.pdf pdfs/books/
```

创建 `pdfs/books/<book-id>.state.json`：

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

调用 `/mineru-document-extractor`。**书籍用 `pipeline` 模型**（零幻觉，公式/表格保真度高），大书（>200页）分批：

```bash
mineru-open-api extract book.pdf --pages 1-110 -o out/part1/ --model pipeline --language ch --timeout 2400
mineru-open-api extract book.pdf --pages 111-220 -o out/part2/ --model pipeline --language ch --timeout 2400
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
mkdir -p pdfs/books/<book-id>-out/epub/
unzip -o pdfs/books/<book>.epub -d pdfs/books/<book-id>-out/epub/

# 找到 XHTML 内容目录（通常是 OEBPS/ 或 OPS/）
find pdfs/books/<book-id>-out/epub/ -name "*.xhtml" -o -name "*.html" | head -5

# 批量 XHTML → Markdown（用 pandoc）
mkdir -p pdfs/books/<book-id>-out/epub-md/
for f in pdfs/books/<book-id>-out/epub/OEBPS/*.xhtml; do
  name=$(basename "$f" .xhtml)
  pandoc -f html -t markdown "$f" -o "pdfs/books/<book-id>-out/epub-md/${name}.md"
done

# 按文件名排序合并（EPUB 的 spine 顺序通常与文件名一致）
cat pdfs/books/<book-id>-out/epub-md/*.md | sed '/^::: {#.*}$/d' > pdfs/books/<book-id>-out/merged/book.md

# 提取图片（EPUB 的 images/ 通常在 OEBPS/ 或 OPS/ 下）
find pdfs/books/<book-id>-out/epub/ -type d -iname "images" -o -iname "image" -o -iname "img"
# 找到后复制到 Phase 3 创建的 content/books/<slug>/images/
# 路径通常在 epub/OEBPS/images/ 或 epub/OPS/images/
```

**图片路径修复**：pandoc 转换后图片引用仍指向 EPUB 内部路径（如 `OEBPS/images/foo.jpg`）。Phase 3 统一归集 + 转 WebP：

```bash
# 复制图片到最终目录
cp pdfs/books/<book-id>-out/epub/OEBPS/images/* content/books/<slug>/images/

# 修正 markdown 中的图片路径（EPUB 内部路径 → 扁平 images/）
sed -i 's|OEBPS/images/|images/|g; s|OPS/images/|images/|g' pdfs/books/<book-id>-out/merged/book.md
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

1. 跑 `scripts/clean_markdown.py`（统一清洗，自动完成）：
   - **噪声删除**：出版元数据（cc/Copyright/Received/DOI）、平面目录、脚注标记、email、引用碎片（`<sub>[</sub>`→`[`）、页眉
   - **LaTeX 碎片修复**（scoped 到 `$...$` 内）：数字间距（`0 . 1`→`0.1`）、命令空格（`\mathrm {`→`\mathrm{`）、花括号字母空格（`{m a x}`→`{max}`）、下标空格
   - **`$$` 定界符修复**：检测 `$$` 块内是否有中文正文（误包），有则降级为行内 `$`；修复孤立 `$$`（奇数计数）
   - **pandoc 残留清理**：`::: fn1` / `[]{#page}` / `{.class}` / `-----` 表格分隔符 → 自动删除/转换
   - **标题层级**：`## N.M`→`### N.M`（MinerU 平铺修复）
   - **图注配对**：`Figure N:`→`{{< caption >}}`
   - **Book 专属**：■ bullet→`-`、脚注上标删除、页眉删除
   - **MinerU div 清理**：`<div class="mineru-algorithm">` → ```matlab 代码块（自动反转义 HTML 实体）
2. 逐条检查 MinerU 损坏（13 项清单详见 `references/cleanup-reference.md`）：
   - `$$` 误包正文、孤儿 `$$`、标题平铺、裸代码、缩进丢失、转义残留、
     `def__init__` 粘连、代码注释被标为标题
3. **EPUB pandoc 残留清理**（Phase 1B 生成的文件必查）：
   - `[]{#page_xxx}` / `[]{#pages-xxx}` → 删除
   - `{.small}` / `{.dropcap}` / `{.col}` → 删除
   - `[text](file.xhtml)` → 保留 text，删除链接
   - `::: fn1` / `::: blk1` / `:::` → 删除整行
   - `{height="100%"}` 等 inline attributes → 删除
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
cp pdfs/books/<book-id>-out/part*/*.jpg content/books/<slug>/images/   # MinerU
# 或
cp pdfs/books/<book-id>-out/epub/OEBPS/images/* content/books/<slug>/images/  # EPUB

# 2. 全部 JPG/PNG → WebP + 替换引用（一键脚本）
.claude/skills/add-book-to-library/scripts/convert_to_webp.sh \
  content/books/<slug>/images/ \
  pdfs/books/<book-id>-out/merged/
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
| 图片引用断裂（拆分后路径不对） | ``images/xxx.webp`` 相对路径，确认 images/ 与 .md 同级 | Phase 6 用 validate_book.py 扫描 |

🔴 **CHECKPOINT**：展示拆分结果（章数、每章行数、H1 标题清单），用户确认后再进 Phase 4.5。

**🔴 Part 分隔页**：如果书有「第X部分」的篇章结构，Part 页码作为独立页面，不嵌入章节内。**必须用 book-part 模板**（参照 `content/books/systems-beauty/part-1.md`）：

```markdown
---
title: "第一部分 · 系统的结构和行为"
weight: 9
description: "系统动力学基础：要素、连接、目标，存量和流量，反馈回路。"
---

<section class="book-part">
  <p class="book-part-label">Part 1</p>
  <h2 class="book-part-title">系统的结构和行为</h2>
  <p class="book-part-desc">系统动力学基础概念——从「什么是系统」到「系统如何运作」。</p>
</section>

## 本部分章节

<a class="part-chapter" href="ch01.html">
  <span class="part-chapter-num">第 1 章</span>
  <span class="part-chapter-title">系统之基础</span>
  <span class="part-chapter-desc">要素、连接、目标；存量和流量；反馈回路。</span>
</a>
```

- **🔴 Part weight 必须比所属第一章小 1**：ch01=10 → part1=9，ch05=15 → part2=14
- 链接用 `.html` 后缀（`uglyurls = true`），不用 `.md` 或 `{{< relref >}}`
- 🔴 Goldmark 不处理 `<div>` 内的 Markdown/短代码，链接必须用纯 HTML `<a href="xxx.html">`
- **🔴 章节标题必须用 markdown 格式**：小标题不能是纯文本段落，必须用 `##`/`###`。EPUB 转换后的小标题经常是纯文本，需要批量修复
- **🔴 pandoc 表格修复**：pandoc 转换的表格可能是 `-----` 分隔符格式，需转换为 `|---|---|` 正确格式

---

### Phase 4.25：英文→中文翻译（workflow 脚本）

**🔴 英文书籍必须翻译成中文**。翻译用确定性 workflow 脚本，**不召唤 subagent**。

脚本自动完成：种子章串行建术语表 → 其余章并行翻译 → chunk 级 checkpoint → validate 检查 + 失败重试 → 跨章一致性 QA → 术语冲突报告。

翻译模型/pipeline 开关在 `config.yaml`（见 `docs/deployment.md`）。默认 strong 档翻译 + cheap 档 QA。

#### CLI 参数

```bash
# 标准翻译（自动续跑：跳过已完成章节）
python3 .claude/skills/add-book-to-library/scripts/translate_chapters.py content/books/<slug>/

# 常用参数
  --seed-chapters 2    # 种子章数（串行建术语表）。大书用 0 全并行
  --concurrency 4      # 并发章数
  --retry 2            # 每章最大重试次数
  --fresh              # 忽略 state，全量重翻
  --status             # 只看进度，不翻译
  --no-qa              # 跳过跨章一致性 QA
```

#### 断点续跑（自动）

翻译状态存在 `content/books/<slug>/.translate_state/progress.json`，每章翻完立即写入。重跑时自动跳过 `status=ok` 且源文件未变的章节。

**chunk 级 checkpoint**：大章节每翻完一个 chunk 就写盘（`<!-- translate-partial: N/M chunks -->` 标记）。中断后重跑会：
1. 检测到 partial 标记（N < M）→ 跳过已完成的 N 个 chunk，只翻译剩余 M-N 个
2. `is_chinese_text` 不会误跳过 partial 翻译（检测到标记后绕过中文检查）

**大书策略**（>50 chunks 的章节，如 300+ 页教材）：
- 用 `--seed-chapters 0` 全并行，避免种子串行阻塞（种子章 83 chunks × 10s/chunk = 14 分钟串行）
- 大章节翻译可能超过 10 分钟，靠 chunk 级 checkpoint 保证中断不丢工作

#### 翻译规则（已固化进脚本）

- 正文、标题、图注翻译为中文；LaTeX 公式 `$...$`/`$$...$$`/`\(...\)`/`\[...\]` 原样不动
- **🔴 种子章（前2章）首次出现的术语故意附英文**（如 `操作概率理论（Operational Probabilistic Theories, OPT）`）→ 收集进 glossary.json。**这是正确行为，不是翻译失败**——Phase 4.5 审核时不要标记为遗漏英文
- 其余章用 glossary 里的指定译名（不重复附英文），新术语才附英文
- 元素模板转换（callout/caption）在翻译时同步完成
- 交叉引用转换由 `convert_xrefs.py` 完成（纯 regex，不靠 LLM）

#### 翻译完成后

```bash
# 交叉引用转换
python3 .claude/skills/add-book-to-library/scripts/convert_xrefs.py content/books/<slug>/

# 查看术语表
cat content/books/<slug>/glossary.json

# 查看翻译进度
python3 .claude/skills/add-book-to-library/scripts/translate_chapters.py content/books/<slug>/ --status
```

检查报告：
- `✓` 通过 / `⚠` 需人工 / `✗` 错误
- 术语冲突（同一英文术语在不同章有不同中文译法）→ 需手动裁决
- **跨章一致性报告**：`.translate_state/consistency_report.md`（自动生成）— 检查术语漂移（如"原理 vs 公设"）、人称混用、节编号不一致。**agent 必须读取并处理**

对标记"⚠ 需人工"的章节，用 Read 检查问题，手动修复后重跑 validate：
```bash
python3 .claude/skills/add-book-to-library/scripts/validate_book.py content/books/<slug>/
```

🔴 **CHECKPOINT**：确认翻译报告（通过率、术语表、需人工章节、consistency 报告），用户确认后进 Phase 4.5。

---

### Phase 4.5：逐章审核

**🔴 处理 partial 翻译**（翻译中断后可能有未完成章节）：
```bash
# 检查是否有 partial 标记
grep -l 'translate-partial' content/books/<slug>/*.md
```
- 有标记且 N < M：重跑翻译（`translate_chapters.py`，续跑会跳过已完成 chunks 只翻译剩余部分），**不要手动编辑 partial 文件**
- 有标记且 N = M：翻译已完成但标记未清除，删除标记行即可
- 无标记：翻译完整，正常审核

**🔴 处理顺序（机械化优先，AI 兜底）**：
1. `format_theorems.py` 批量加粗段落级定理/定义（数学教材必备，MinerU 不标标题）
2. 机械 grep 扫描（非标准列表、弯引号、callout 内 heading）
3. 派审核 agent 并行做语义判断（定理块边界、例题范围、OCR 修正）
4. `validate_book.py` 兜底

#### 步骤 1：机械化加粗定理/定义块（数学教材必跑）

MinerU 把 `定理 2.2.1 ...`、`定义 3.1.1 ...` 作为**普通段落**输出（行首直接写，不标标题），后续 agent 难以批量识别。先跑脚本加粗：

```bash
python3 .claude/skills/add-book-to-library/scripts/format_theorems.py content/books/<slug>/
# 输出：ch01.md: 3 处 ... 共 N 处定理/定义/引理/推论/性质块加粗
```

加粗后形如 `**定理 2.2.1**　如果矩阵 A ...`，agent 据此识别块边界转 shortcode。**幂等**（已加粗的不会再处理）。

#### 步骤 2：机械 grep 扫描

```bash
grep -rn '^●\|^◆\|^①\|^（[0-9]）' content/books/<slug>/
grep -rn 'type="[^"]*"' content/books/<slug>/
grep -rn '^### .*学家\|^### .*作者' content/books/<slug>/
# 命中 → sed 机械化修复，不依赖 AI 逐一判断
```

#### 步骤 3：派审核 agent（每 3-4 章一个，并行）

```
Agent(prompt: "审核 content/books/<slug>/ch01.md ~ ch03.md，按以下清单逐章检查并修复：
1. **定理/定义块转 shortcode**：**定理 X.Y.Z**　... → {{< theorem title="定理 X.Y.Z" >}}...{{< /theorem >}}
   - 定义 → {{< definition >}}，引理/推论 → {{< theorem type="引理"/"推论" >}}
   - 块边界：从 **定理 X.Y.Z** 行到下一个空行后的非缩进段落（"证："或下一定理/小节标题）
   - 块内 $$...$$ 公式一并包进 shortcode
   - 超过 3 段或含复杂列表的块**保持原样**（避免破坏结构）
2. **例题转 shortcode**：#### 例 X.Y.Z → {{< example title="例 X.Y.Z" >}}...{{< /example >}}
3. **图注配对**：`images/x.webp` + 图N-N 描述 → {{< caption >}}...{{< /caption >}}
4. OCR 数学符号错误  5. 交叉引用查漏  6. 代码块补围栏
不要动 LaTeX 公式、代码块、标题层级、图片引用。修复后用 Write 写回文件。")
```

> **Phase 4.25 已完成的，本阶段不重复**：翻译（translate_chapters.py）、引用/图注/来源的 callout/caption 转换（翻译脚本内置）、交叉引用链接（convert_xrefs.py）。本阶段聚焦脚本无法覆盖的语义检查。

🔴 **元素模板转换（脚本未覆盖的，必须在此阶段完成）**：
- 例X-X / 例 X-X → `{{< example title="例X-X" >}}...{{< /example >}}`（Read 文件确定例题范围，从标题到下一个例题或标题）
- 业界事例（独立段落开头）→ `{{< callout type="note" >}}...{{< /callout >}}`
- 定义/定理/引理（独立块）→ `{{< definition >}}` / `{{< theorem >}}`（步骤 1 已加粗，agent 据此识别）
- 漏网的来源/出处行、`—Author, *Book*` 引用 → `{{< caption >}}` / `{{< callout type="quote" >}}`

**其他检查：**
1. **OCR 错误** — 数学符号误识别
2. **表格图注漏网** — `表N.N`/`图N.N` 未被翻译脚本转的 → `{{< caption >}}`
3. **Mermaid** — 删 `<details>` + mermaid，留原图
4. **标题层级** — 代码注释 `#` 误为 H1、子节降级
5. **交叉引用查漏** — convert_xrefs.py 漏的语义引用（如"见前文讨论"）
6. **代码块** — 补 ` ```python ` 围栏、numpy/torch 代码
7. **伪代码** — 用**小写裸命令**（`state`/`for{}`/`if{}`/`repeat`/`until{}`/`endfor`/`return{}`），不是 `\STATE`/`\FOR`

🔴 **CHECKPOINT**：展示审核统计（修复数、剩余 warning 数、validate_book.py 输出），用户确认后进 Phase 5。

---

### Phase 5：格式化

#### 封面 + 目录（`_index.md`）

**🔴 必须用 `book-cover` section + `{{< book-toc >}}`，不手写 HTML：**

```markdown
---
title: "<书名>"
description: "<一句话简介>"
author: "<作者>"          # 🔴 必填！bookshelf.html 用 .Params.author 过滤，缺了书架不显示
date: 2026-07-07           # 🔴 必填！入库日期，驱动书架"入库"排序。写添加当天的日期
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

书架全自动生成——`bookshelf.html` 读取 `.Site.Data.book_categories`，根据每本书的 `category` 数组自动归类。
**新增书籍无需手动编辑 bookshelf.html**，只需在 `_index.md` 填好 `category` 数组。

分类定义见 `.claude/skills/add-book-to-library/data/book_categories.json`（symlink → `data/book_categories.json`，Hugo 读取用）。
当前分类：`quant`（量化金融）、`ml`（机器学习）、`systems`（系统思维）、`growth`（个人成长）、`physics`（物理科学）。新增分类只需编辑该 JSON 并在 bookshelf.html 的 `$catDisplay` 加对应 icon/desc。

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

**🔴 误报处理**：validator 输出 `[R]`（Review）和 `[W]`（Warning）中可能有误报。确认是误报后，在该行末尾加 `<!-- validate-skip -->` 注释标记跳过：

```markdown
见业界事例1-1的讨论。<!-- validate-skip -->
定义 $\beta_{i}$ 为系数。<!-- validate-skip -->
```

- `<!-- validate-skip -->` 标记的行会被 validator 自动跳过，不计入 issue 数
- 适用于所有级别：`[E]`、`[W]`、`[R]`
- **不要滥用**：只标记确认过的误报，不要为了消除 warning 而盲目标记

**🔴 质量抽查必须用 spot-check agent**（不用普通 agent）：

```
Agent(subagent_type: "spot-check", prompt: "Spot-check the book at content/books/<slug>/")
```

spot-check 随机抽查 2 章，18 点清单，发现问题直接修。

🔴 **CHECKPOINT**：展示章节数、图片数、spot-check 结果。用户决定何时 push。

---

## 失败模式速查（关键 12 条）

| 症状 | 一线修复 | 仍失败 |
|------|---------|--------|
| 公式不渲染 / `\boldsymbol` 失败 | 检查 KaTeX passthrough + full extension | 核对 `hugo.toml` 和 `static/katex/` |
| 正文拆字 / display math 吞正文 | `$$` 误包 → `clean_markdown.py` 的 `fix_math_delimiters` 自动修复 | Phase 2 重扫 |
| `$$` 块内有中文正文（validate `[E]`） | LLM 输出 `$_{1}$$(...)` 相邻 `$` 误判为 `$$` → `fix_math_delimiters` 自动降级为 `$` | 手动把误包的 `$$` 改为 `$` |
| 标题全同级（无层次）| `## N.M.K` → `###` | Phase 4 检查 H2/H3 比例 |
| 图片不显示 / Build REF_NOT_FOUND | 路径 ``images/x.webp`` + `.md` 链接 | 检查相对路径和 relref |
| 书不在菜单 | 检查 `_index.md` 的 `title`/`weight` | 菜单从 content/books/ 自动生成 |
| 代码无高亮 / 裸露 | ` ```python ` 围栏 | Phase 4.5 补 fence |
| 图注/解答块样式丢失 | 用 shortcode 不是 `<div>` | `{{< caption >}}` / `{{< solution >}}` |
| shortcode 内 markdown 不解析 | 模板用 `.Inner \| .Page.RenderString` | 检查 shortcode 定义 |
| 书架不显示新书 | `_index.md` 缺 `author` 字段（bookshelf.html 隐式依赖） | 加 `author: "<作者>"` |
| 末章末尾混入索引（`## A ## B` 字母分组）| 拆章时截断，索引提取成 `index_term.md` | 手动清理 `## 字母` 残留标题 |
| **大章节翻译超时，重跑跳过不翻** | 检测 `<!-- translate-partial: N/M -->` 标记，重跑会续译剩余 chunks（自动） | `--fresh` 全量重翻 |
| **种子章 validate 报"遗漏英文长词"** | 🔴 **正常行为**——种子章故意保留英文术语建术语表，不要重试 | 无需修复 |
| **consistency_qa 报术语漂移** | 读 `.translate_state/consistency_report.md`，全局 sed 替换统一译法 | 人工裁决冲突译法 |

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
| 8 | PDF 放入 content/ | 放 `pdfs/books/`（已 gitignore） |
| 9 | 交叉引用用 `.html` 后缀 | 统一 `.md` |
| 10 | 书放分类子目录 `books/<cat>/<book>/` | 扁平 `books/<book>/` |
| 11 | `.md` 不加 front matter | 每文件 `title`/`weight`/`description` |
| 12 | 删图片引用 | 只删 `<details>`/mermaid，不碰 `![]()` |
| 13 | 手写 nav / 封面 HTML 目录 | `{{< book-toc >}}` 自动生成 |
| 14 | `_index.md` 不打 tags | 打 2-3 个领域标签 |
| 15 | 例题/业界事例保持标题 | 转 `{{< example >}}` / `{{< callout >}}` |
| 16 | 代码块不标语言 | ` ```python ` |
| 17 | 跳过机械 grep 直接 AI 审核 | 机械 grep 扫描（AI 会漏）→ 审核 agent 逐章检查 → 机械清洗（空块/compound）→ 验证 |
| 18 | 不复制 MinerU images 到 book | 合并到 `content/books/<slug>/images/` |
| 19 | 不留 MinerU 原始 MD | 保留到 `pdfs/books/<book>-out/merged/book.md` |
| 20 | 拆分只靠 heading 自动匹配 | 手动确认章节边界，合并多余拆分 |
| 21 | 首页书架手动加卡片 | 书架全自动（`_index.md` 的 `category` 数组驱动），只需填好 category |
| 22 | 封面手写 `<div style="">` | `<section class="book-cover">` 模板 |
| 23 | 图片用 JPG/PNG 格式 | WebP only（Phase 3 统一转换），质量 80 有损模式 |
| 24 | 翻译走 subagent 而非脚本 | 翻译必须用 `translate_chapters.py`（术语表驱动 + 自动验证重试），不召唤 subagent |
| 25 | 质量检查用普通 agent | 必须用 `Agent(subagent_type: "spot-check")` |
| 26 | EPUB 转换后不清 pandoc 残留 | `[]{#page}` / `{.class}` / `::: fn1` / `::: blk1` 必须在 Phase 2 清理 |
| 27 | Part 页面不用 book-part 模板 | 必须用 `<section class="book-part">` + 章节链接卡片（参照 systems-beauty） |
| 28 | Part weight 排到章节后面 | Part weight 必须比所属第一章小 1（ch01=10 → part1=9） |
| 29 | 章节小标题用纯文本 | 必须用 `##`/`###` markdown 标题格式 |
| 30 | pandoc 表格用 `-----` 分隔符 | 必须转为 `|---|---|` 正确格式 |
| 31 | `_index.md` 不写 `author` | **必填**——bookshelf.html 用 `.Params.author` 过滤，缺了书架不显示这本书 |
| 32 | 手动逐个加粗定理/定义 | 用 `format_theorems.py` 批量加粗，再派 agent 转 shortcode（幂等） |
| 33 | 用 `grep -E '^#'` 匹配标题 | zsh 下 `#` 触发 `conflicting matchers`，改用 `python -c` 或 `grep -n '^#'` 不加 `-E` |
| 34 | 删除 `.translate_state/` 目录 | 会丢失断点续跑状态，大书重翻代价巨大 |
| 35 | 手动编辑带 `<!-- translate-partial -->` 标记的文件 | 续跑会覆盖——先让脚本完成翻译再编辑 |
| 36 | 对种子章英文术语做"翻译补全" | 种子章故意保留英文建术语表，是正确行为 |
