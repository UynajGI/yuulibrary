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
│   │   └── quant-finance-interview/
│   ├── notes/                    # 笔记（带 date/tags）
│   ├── papers/                   # 论文笔记（带 author/year/tags）
│   └── _reference/               # 元素模板速查（_ 前缀，菜单隐藏）
├── layouts/
│   ├── _shortcodes/              # book-toc/callout/definition/theorem/example 等
│   └── _partials/docs/inject/head.html  # KaTeX + pseudocode.js 加载
├── assets/custom.scss            # 全局样式
├── static/katex/ + pseudocode/   # 本地化数学/算法渲染
├── .claude/skills/add-book-to-library/  # 加书 skill
├── .github/workflows/deploy.yml  # push main → 自动部署
└── pdfs/                         # 源文件（本地，gitignore）
    ├── books/                   # 书籍 PDF/EPUB + 状态文件 + 提取输出
    ├── papers/                  # 论文 PDF
    └── archive/                 # 已完成（仅人工移入）
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

## 质量验证

```bash
python3 .claude/skills/add-book-to-library/scripts/validate_book.py content/books/
```

27 项机械验证（8 Error + 19 Warning，lefthook pre-commit + CI 自动运行）。

## 可用 Agent

| Agent | 模型 | 用途 |
|-------|------|------|
| **spot-check** | Haiku | 随机抽查 2 章，18 点清单（先机械 grep → AI 逐章审核），发现问题直接修 |

用法：`Agent(subagent_type: "spot-check", prompt: "Spot-check the book at content/books/<slug>/")`

## 语法约定

- **元素模板**：`{{< callout >}}` / `{{< definition >}}` / `{{< theorem >}}` / `{{< example >}}` / `{{< key-point >}}` / `{{< algorithm >}}`（详见 `content/_reference/elements.md`）
- **解答块**：`{{< solution >}}` ... `{{< /solution >}}`（绿色左边框）
- **图注/表注**：`{{< caption >}}` 图8.1 描述 `{{< /caption >}}`
- **数学公式**：行内 `$...$`，行间 `$$...$$`（Goldmark passthrough 原样透传 KaTeX）
- **算法块**：`{{< algorithm title="名称" >}}<pre class="pseudocode">...</pre>{{< /algorithm >}}`
- **伪代码语法**：小写裸命令 `state`/`for{}`/`if{}`/`repeat`/`until{}`/`endfor`/`return{}`，不是 `\STATE`/`\FOR`
- **跨页面链接**：`[第5章](ch05.md)`，BookPortableLinks 自动转 permalink
- **封面目录**：`{{< book-toc >}}` 自动生成，不要手写 HTML 表格

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
