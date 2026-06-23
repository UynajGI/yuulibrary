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
│   ├── _index.md                 # 图书馆首页（卡片式书单，手写）
│   └── books/
│       ├── ml/rl-intro/          # 每本书一个目录
│       │   ├── _index.md         # 封面 + 目录（section 列表页）
│       │   ├── ch01.md ~ ...     # 章节（front matter: title/weight）
│       │   ├── index_term.md     # 索引
│       │   └── images/           # 图片（与 .md 同级，相对路径引用）
│       └── finance/...
├── layouts/
│   ├── _shortcodes/
│   │   ├── solution.html         # {{< solution >}} 解答块（替代 md_in_html）
│   │   └── caption.html          # {{< caption >}} 图注/表注
│   ├── _markup/render-image.html # 图片用相对路径原样输出
│   └── _partials/docs/inject/head.html  # KaTeX + pseudocode.js 加载
├── assets/
│   ├── custom.scss               # 全局样式（移植自 mkdocs extra.css）
│   └── katex.json                # KaTeX auto-render 分隔符（含 $...$）
├── static/
│   ├── katex/                    # KaTeX CSS/JS/字体（本地化）
│   ├── pseudocode.min.js/.css    # 算法块渲染器
├── scripts/
│   ├── migrate_mkdocs_to_hugo.py # 一次性迁移脚本（docs/ → content/）
│   └── remap_index_anchors.py    # 重映射 index_term.md 的 MkDocs 锚点
└── .github/workflows/deploy.yml  # 自动部署到 gh-pages
```

## 添加新书

1. 在 `content/books/<category>/` 下创建 `<book-slug>/` 子目录
2. 创建 `_index.md`（封面 + 目录，section 列表页）
3. 章节文件 `ch01.md` 起，**每个文件加 front matter**：
   ```yaml
   ---
   title: "第1章 · 引言"
   weight: 10
   ---
   ```
4. 图片放入 `images/` 子目录，用相对路径 `![](images/xxx.jpg)` 引用
5. 左侧菜单从目录结构 + weight 自动生成，无需手写 nav
6. `hugo server` 验证

## 语法约定

- **解答块**：`{{< solution >}}` ... `{{< /solution >}}`（绿色左边框，内部可写 Markdown）
- **图注/表注**：`{{< caption >}}` 图8.1 描述 `{{< /caption >}}`
- **数学公式**：行内 `$...$`，行间 `$$...$$`（KaTeX 自动渲染，无需包裹）
- **算法块**：`<pre class="pseudocode">\begin{algorithm}...</pre>`（pseudocode.js 渲染）
- **跨页面链接**：Markdown 写 `[第5章](ch05.md)`，主题 BookPortableLinks 自动转为 permalink
- **HTML 链接**（表格内）：用 `{{< relref "/books/<cat>/<slug>/ch01.md" >}}`

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
- 图片与 `.md` 同级，用相对路径 `images/`，无需 page bundle
- Hugo Book 主题用 `layouts/_shortcodes/`（注意下划线前缀，Hugo 0.146+ 增强目录结构）
