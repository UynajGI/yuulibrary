# Yuunagi Library

个人的数字图书馆，基于 MkDocs Material 构建，部署于 GitHub Pages。

## 结构

```
yuulibrary/
├── mkdocs.yml              # MkDocs 配置
├── docs/
│   ├── index.md            # 图书馆首页
│   ├── <book-slug>/        # 每本书一个子目录
│   │   ├── index.md        # 封面 + 目录
│   │   ├── ch01.md ~ ...   # 章节
│   │   ├── index_term.md   # 索引
│   │   └── images/         # 图片
│   ├── stylesheets/        # 共享样式
│   └── javascripts/        # 共享脚本
└── .github/workflows/      # CI/CD 自动部署
```

## 书籍

| 书名 | 语言 | 状态 |
|------|------|------|
| 量化金融面试实用指南 | 中文 | 已上线 |

## 本地开发

```bash
pip install mkdocs-material pymdown-extensions
mkdocs serve -a 127.0.0.1:8000
```

## 许可证

MIT
