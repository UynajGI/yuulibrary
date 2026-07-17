# 架构

> 面向想理解项目怎么工作、或要深度定制的 fork 者/贡献者。
>
> 部署相关见 [deployment.md](deployment.md),加内容流程见 [content-workflow.md](content-workflow.md)。

## 站点架构

Hugo 静态站点 + Hugo Book 主题。三个 content section 各司其职:

| Section | 内容 | 单位 | 列表页 |
|---------|------|------|--------|
| `books/` | 书籍 | 每本一个子目录(`_index.md` + `ch01.md` ~ `chNN.md` + `images/`) | `_index.md`(section 列表页) |
| `papers/` | 论文笔记 | 每篇一个子目录(`_index.md` + `images/`) | `_index.md` |
| `notes/` | 蒸馏笔记 | 每篇一个 `.md`(扁平存放) | `_index.md` |

**关键 Hugo 配置**(`hugo.toml`):
- `uglyurls = true` — URL 是 `ch01.html` 而非 `ch01/`(与旧 mkdocs 兼容,旧链接不失效)
- `relativeurls = false` — GitHub Pages project site 子路径需要绝对路径
- `enableGitInfo = true` — 用 git commit 时间做 `lastmod`
- `theme = 'hugo-book'` — 主题是子模块,不是 npm 包

### Shortcode 体系

`layouts/_shortcodes/` 下自定义 shortcode(注意下划线前缀,Hugo 0.146+ 增强目录结构):

| Shortcode | 用途 |
|-----------|------|
| `{{< bookshelf >}}` | 首页书架分类卡片(遍历 books 的 `category` 数组自动归类) |
| `{{< papershelf >}}` | 论文书架(同上,遍历 papers) |
| `{{< stats >}}` | 馆藏统计仪表盘(books/papers/notes 计数 + 最近添加 + 标签云) |
| `{{< recent-notes >}}` | 首页最近笔记列表 |
| `{{< caption >}}` | 图注/表注 |
| `{{< callout >}}` / `{{< definition >}}` / `{{< theorem >}}` ... | 元素模板(详见 `content/_reference/elements.md`) |
| `{{< key-point >}}` | 关键点卡片（橙色） |
| `{{< proof >}}` | 证明块（靛蓝左边框） |
| `{{< book-toc >}}` | 书籍封面自动目录（遍历 `_index.md` 同级 `ch*.md`） |
| `{{< solution >}}` | 解答块(绿色左边框) |
| `{{< algorithm >}}` | pseudocode.js 算法块 |
| `{{< rough-canvas >}}` | rough.js 手绘风格 Canvas |

**书架机制**:`category`(书籍自定义如 `quant`/`ml`/`physics`/`philosophy`,论文用 arXiv 一级分类（如 `quant-ph`、`cond-mat`、`physics`），子类需映射到父类管书架路由;`tags` 管 `/tags/` 浏览。两者完全解耦。新增内容只需填好 front matter,无需手动编辑 shortcode。

### 主题切换(三态)

日 / 夜 / 自动跟随系统,左侧菜单底部按钮切换。架构:

```
data-theme            用户偏好:"light" | "dark" | "auto"(存 localStorage)
data-effective-theme  实际生效:"light" | "dark"(CSS 只看这个)
```

**关键设计**:`hugo.toml` 的 `BookTheme = 'light'`——主题只编译浅色,深色完全由运行时接管。所有 dark 样式用 `:root[data-effective-theme="dark"]` 选择器(不再用 `@media prefers-color-scheme`)。

| 文件 | 职责 |
|------|------|
| `layouts/_partials/docs/inject/head.html` 顶部 | 同步无闪烁脚本:读 localStorage → 解析 auto → 设 `data-effective-theme`,在任何 CSS 渲染前执行 |
| `static/js/theme-toggle.js` | 切换逻辑:按钮点击 + localStorage 持久化 + auto 模式监听系统变化 |
| `assets/_custom.scss` | `@mixin theme-dark` 定义深色变量,由 `[data-effective-theme="dark"]` 触发 |
| `assets/syntax.css` | 代码高亮深色,同选择器机制 |

> ⚠️ 不能把 `BookTheme` 改回 `auto`——主题级 `@media` 会和 `data-effective-theme` 冲突(用户切 light 时主题 body 仍黑)。

### CSS 设计系统

`assets/_custom.scss`(~1160 行)管理全部视觉样式，按功能分 20+ 个区段：

| 区段 | 覆盖内容 |
|------|---------|
| 主题色 + 字体 | Teal 色系(`$`/`$$`)、Inter + Noto Sans SC 字体栈、深色变量 |
| 正文排版 | 列表、两端对齐、H1-H6 层级(H3 蓝色左边框卡片) |
| 表格/图片/图注 | 全宽表格、居中带阴影图片、caption 样式 |
| 元素模板 | `.element` + `.element-label`：5 色编码(紫=definition、蓝=theorem、绿=example、橙=key-point、青=algorithm) |
| 解答/证明块 | `.solution`(绿色左边框)、`.proof`(靛蓝左边框) |
| 书架 + 分类卡片 | 整行式 book-row 列表、category-card 卡片网格、缩放动画 |
| 首页 Hero | 超大标题 + 大量留白 Apple 风格 |
| 标签/标签云 | 纯文字链接(无背景胶囊)、标签云 tag-chip |
| 笔记/论文详情 | post-header、post-meta、paper-links |
| 排序栏/分页 | sort-bar、pagination |
| 主题切换 UI | 三态按钮(日/夜/自动)、无闪烁同步脚本 |
| KaTeX 保护 | 长公式 overflow-x scroll、inline math break-all |
| 算法块 | pseudocode.js 容器 + 等宽字体 |
| 深色覆盖 | `[data-effective-theme="dark"]` 下 `.solution`/`.proof`/`.category-card` 等深色适配 |

**设计原则**：所有 dark 样式用 `:root[data-effective-theme="dark"]` 选择器，**不用 `@media prefers-color-scheme`**。
`assets/syntax.css`(380 行)用同样选择器处理代码高亮深色。

---

## AI 问答架构

站点内置 BYOK(Bring Your Own Key)浏览器直连 AI 问答 Agent。右下角浮动按钮打开聊天面板。

### 检索管线(多路召回 + RRF)

```
用户 query
  → tokenizeUnique(中文 2-gram + 英文单词)
  → 同义词扩展(过统一 tokenizer,加权:原始 1.0 / 同义 0.6)
  → 多路召回:
     A. title phrase 匹配 top20
     B. BM25F 正文 chunk 倒排检索 top50(title 6 / breadcrumb 3 / body 1)
     C. doc title / TOC 路由 top20
  → Reciprocal Rank Fusion(k=60)融合
  → RM3 伪相关反馈重打分(可选)
  → 词法精排(proximity + phrase + coverage)
  → MMR 去冗余(4-gram shingle,保留 token 序列)
  → 多信号 confidence(coverage + rrfScore + titleHit + margin)
  → token budget packing(感知对话历史)
  → LLM 重排(confidence=low 时,命中词附近 ±150 字 400 字窗口)
  → LLM API(BYOK,最多 4 轮工具调用)
```

**正文 chunk 倒排索引**(`chunks.json` + `inverted-index.json`):每个节点正文切成 ~500 字符 chunk(重叠 100),构建 `token → [(chunk_id, tf)]` 倒排表。查询时只遍历含 query token 的 chunk,不再全量扫描。这让正文深处的事实(200 字 summary 截断之外)可被第一阶段命中。

**核心设计决策**:
1. **无 embedding / 无向量库** — 完整的稀疏词法 RAG:正文 chunk 倒排索引 + BM25F + 多路召回 + RRF。非语义搜索,但精确术语/正文细节/跨语言召回均有效
2. **正确的 BM25F** — tokenize 保留重复(真实 TF),字段加权(title 6 / breadcrumb 3 / body 1),DF 按 chunk 合并去重计算
3. **多信号 confidence** — 基于 query token 覆盖率(最强鉴别)+ rrfScore + title 命中,而非归一化相对分。no_answer 检测 7/7 正确
4. **稳定引用 ID** — 跨搜索轮次的全局 source 编号,模型看到的 [N] 与最终 refMap 严格一一对应
5. **无 npm / 无 build-step** — Vanilla JS,retrieval.js 是可测纯函数(UMD:浏览器 global + Node CommonJS)
6. **BYOK 浏览器直连** — 用户 API key 存 sessionStorage(默认)或 localStorage(勾选"记住")。无服务端代理

### 3 个工具(ReAct agent)

| 工具 | 用途 |
|------|------|
| `search_library` | BM25 + 精排 + MMR 检索全部书/论文/笔记 |
| `get_section` | 按 doc_id + node_id 取完整章节(从 GitHub raw fetch md,按行号切) |
| `rewrite_query` | LLM 改写/分解/步退查询 |

system prompt 注入全局目录(所有文档 TOC)+ 查询转换策略引导。模型自主调用工具检索,多轮推理(最多 4 轮工具调用),不靠单次 RAG。

**LLM 重排**:confidence=low 时批量评分重排 top6(一次 API 调用,无 key 跳过)。

### Provider

浏览器直连:Anthropic / DeepSeek / OpenAI / 硅基流动 / OpenRouter / 智谱 / 通义千问 / Ollama / Gemini / 自定义 OpenAI-compatible。

**思考模式**:DeepSeek 思考模式可开关(设置面板 checkbox),思考内容折叠展示。

### 代码结构

| 文件 | 内容 |
|------|------|
| `static/chat/retrieval.js` | 检索核心纯函数(UMD:浏览器 global + Node CommonJS):tokenizer / BM25F / 倒排检索 / 多路召回 + RRF / 词法重排 / MMR / 多信号 confidence。可被 `tests/retrieval/harness.js` 直接加载测试 |
| `static/chat/chat.js` | Chat Agent:加载索引 + 调 retrieval.js + ReAct 工具调用 + 多 provider SSE 流式 + 稳定引用 ID + 会话管理 + UI 渲染。零依赖 vanilla JS |
| `static/chat/chat.css` | 聊天面板样式:浮动按钮、侧边抽屉、消息气泡、思考折叠、代码块、响应式 |
| `layouts/_partials/docs/inject/head.html` | 注入 `window.YUU_CHAT_RAW_BASE` + 加载 retrieval.js/chat.js/css(顺序加载) |
| `tests/retrieval/` | 检索 golden benchmark:148 题 × 12 类,golden.json + harness.js,跑 `node tests/retrieval/harness.js` |

---

## PageIndex 索引

`scripts/build_pageindex.py` 构建 AI 问答用的树索引。

### 架构

```
Build time:  content/**/*.md  →  build_pageindex.py  →  static/pageindex/*.json
Runtime:     global-index.json + node-index.json 首次加载
             → 后台异步加载 chunks.json + inverted-index.json(正文倒排,gzip ~26MB)
             → 就绪后切换到多路召回检索路径
```

**产物**:
- `global-index.json` — 文档目录(book/paper/note 元数据)
- `node-index.json` — 节点级扁平索引(title/breadcrumb/terms/summary),用于结构扩展
- `chunks.json` — 正文 chunk(chunk_id/doc_id/node_id/title/breadcrumb/body/source_md/line_num),~42k chunk
- `inverted-index.json` — 倒排 postings `{token: [[cid_num, tf], ...]}`,停用词截断(DF>35% 丢弃)
- `books|papers|notes/<slug>.json` — 各文档结构树(clean_tree 已剥离 text)

**节点字段**:`title` / `node_id` / `summary` / `line_num` / `line_end` / `source_md`(**不含 text**——正文按需从 GitHub raw fetch md 按行号切;chunk 倒排索引在 build 期已 tokenize)。

**summary** = LLM 摘要(≥200 token 节点,litellm 多 provider 路由)或原文(短节点)。

### 增量构建

靠 `static/pageindex/.fingerprints.json`(进 git,相对路径,本地+CI 路径无关)。本地 lefthook `--incremental` 秒级增量,CI deploy.yml `--incremental` 只处理改动文档(不全量烧 token)。

### Fork 友好

- `source_md` 存相对路径(如 `content/notes/xxx.md`)
- `head.html` 从 `BookRepo` 配置推导 raw URL 前缀注入 `window.YUU_CHAT_RAW_BASE`
- fork 后改 `hugo.toml` 的 `BookRepo` 即自动适配
- ⚠️ raw URL 推导写死 `main` 分支(见 `head.html`),若 fork 的默认分支不是 `main` 需改这里

---

## 质量校验体系

### lefthook hook 链

```
pre-commit (sequential):
  trailing-whitespace → prettier → eslint → css-check → hugo-build-check
  → pageindex-build → markdownlint → image-refs → front-matter
  → book-validate → paper-validate → latex-render → translate-test

pre-push:
  hugo-build → html-check(页面存在=error, broken link=warning)
```

安装:`lefthook install`。手动跑:`lefthook run pre-commit`。

### validate_book.py(38 项机械验证)

| 级别 | 数量 | 内容 |
|------|------|------|
| `[E]` Error | 12 | shortcode 闭合、`$` 配对、裸代码、double `\tag` 等(阻断 commit) |
| `[W]` Warning | 21 | 交叉引用、标题层级、断行、OCR 乱码 tag、重复标题、短标题等(应修复) |
| `[R]` Review | 5 | 元素模板候选(需人工确认) |

误报标记:行末加 `<!-- validate-skip -->` 跳过。

### latex-render(scripts/check_latex_render.py)

抓两种 Markdown/KaTeX 渲染坑:
- 表格 LaTeX 里的裸 `|`(被当列分隔,用 `\lvert`/`\rvert`/`\vert`)
- `$$` 块内行首 `+`/`-`(被当列表项,用 `\;+\;` 或单行)

### KaTeX 定界符配置(`assets/katex.json`)

`katex.json` 注册了 4 种定界符:`$$`(display)、`$`(inline)、`\[...\]`(display)、`\(...\)`(inline)。
其中 `\[...\]` / `\(...\)` 是**兼容性保留**——防止旧内容中遗留的 LaTeX 原生定界符完全无法渲染。
**新内容禁止使用 `\[...\]` / `\(...\)`**，KaTeX 对这两种定界符的渲染不稳定（部分环境不识别），统一用 `$$` / `$`。

### 翻译脚本回归测试

`test_translate.py`(34 用例,零依赖不装 pytest):测 `translate_chapters.py` 纯函数(`isolate_references`/`split_into_chunks`/`restore_images`/`find_untranslated_blocks`)。

CI 步骤 `Translate-chapters regression tests` 自动跑。拦"改函数忘改调用方"类 bug(如返回值元组数量变化但调用处没同步)。

```bash
python3 .claude/skills/add-book-to-library/scripts/test_translate.py    # 全跑
python3 .claude/skills/add-book-to-library/scripts/test_translate.py isolate  # 单模块
```
