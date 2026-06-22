# Yuunagi Library

个人的数字图书馆。MkDocs Material 多书站点，托管于 GitHub Pages。

## 常用命令

```bash
mkdocs serve -a 127.0.0.1:7890    # 本地预览
mkdocs build                        # 构建静态站点到 site/
```

## 目录结构

```
yuulibrary/
├── mkdocs.yml                     # 单一配置，nav 列出所有书籍
├── docs/
│   ├── index.md                   # 图书馆首页（卡片式书单）
│   ├── stylesheets/extra.css      # 全局样式
│   ├── javascripts/mathjax.js     # MathJax 配置
│   ├── books/                    # 书籍
│   │   └── finance/               #   金融经济
│   │       └── quant-finance-interview/
│   │           └── ...
│   ├── papers/                    # 论文
│   └── notes/                     # 笔记
├── pdfs/                          # PDF 源文件（本地，不入库）
└── .github/workflows/deploy.yml   # 自动部署到 gh-pages
```

## 添加新书

1. 在 `docs/books/<category>/` 下创建 `<book-slug>/` 子目录
2. 将章节文件、图片放入其中
3. 在 `mkdocs.yml` 的 `nav` 中添加书籍章节列表
4. 在 `docs/index.md` 首页卡片区添加新书条目
5. `mkdocs build` 验证

## 样式体系

- H3：蓝色左边框卡片（题目标题）
- `.solution`：绿色左边框背景（解答块），需 `<div class="solution" markdown="1">` 包裹
- 表格：全宽，索引页 6 栏
- 图片：居中带阴影
- 暗色模式：自动适配

## 技术要点

- `md_in_html` 扩展已启用，HTML 块内可写 Markdown
- MathJax 3 通过 CDN 加载，处理 `\(...\)` 和 `\[...\]` 分隔符
- 跨页面链接使用 `.md` 扩展名，mkdocs 构建时转为 `.html`
- 索引交叉引用需先 `mkdocs build`，再从 HTML 提取 anchor ID
