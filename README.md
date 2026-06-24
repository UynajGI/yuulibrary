# Yuunagi Library

个人的数字图书馆，基于 [Hugo](https://gohugo.io) + [Hugo Book](https://github.com/alex-shpak/hugo-book) 主题构建，部署于 GitHub Pages。

## 结构

```
yuulibrary/
├── hugo.toml               # Hugo 配置
├── content/
│   ├── _index.md           # 图书馆首页
│   └── books/<book-slug>/   # 扁平存放，每本书一个子目录
│           ├── _index.md             # 封面 + 目录（section 列表页）
│           ├── ch01.md ~ ...         # 章节
│           ├── index_term.md         # 索引
│           └── images/               # 图片
├── layouts/                # 短代码 / 模板覆盖
├── assets/custom.scss      # 全局样式
└── .github/workflows/      # CI/CD 自动部署
```

## 书籍

| 书名 | 作者 | 章节 |
|------|------|------|
| 强化学习入门：从原理到实践 | 叶强 等 | 10 章 |
| 强化学习的数学原理 | 赵世钰 | 10 章 + 4 附录 |
| 期权、期货及其他衍生产品 | John C. Hull | 36 章 |
| 量化金融面试实用指南 | Xinfeng Zhou | 7 章 |
| 算法交易与套利交易 | 赵胜民 | 15 章 |

## 本地开发

需安装 [Hugo extended](https://gohugo.io/installation/)（SCSS 支持）。

```bash
# 克隆（含主题子模块）
git clone --recurse-submodules <repo>

# 本地预览
hugo server

# 生产构建（输出到 public/）
hugo --gc --minify
```

## 许可证

MIT
