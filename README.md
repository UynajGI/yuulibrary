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

共 19 本，按主题分类（与首页书架一致）。

### 量化金融

| 书名 | 作者 | 章节 |
|------|------|------|
| 量化金融面试实用指南 | Xinfeng Zhou | 7 章 |
| 期权、期货及其他衍生产品 | John C. Hull | 36 章 |
| 算法交易与套利交易 | 赵胜民 | 15 章 |
| 漫步华尔街 | Burton G. Malkiel | 15 章 |
| 量化交易 | Ernest P. Chan | 7 章 |
| 通向财务自由之路 | Van K. Tharp | 8 章 |
| 统计套利 | Andrew Pole | 11 章 |
| 量化资产管理 | Michael Robbins | 4 部分 19 章 |
| 金融机器学习的进展 | Marcos M. López de Prado | 5 部分 22 章 |
| Python for Finance | Yves Hilpisch | 5 部分 21 章 |
| 投资决策的关键解答 | Michael Covel | 15 章 |
| Stocks on the Move | Andreas F. Clenow | 15 章 |

### 机器学习与强化学习

| 书名 | 作者 | 章节 |
|------|------|------|
| 强化学习入门 | 叶强 等 | 10 章 |
| 强化学习的数学原理 | 赵世钰 | 10 章 |

### 系统思维与统计

| 书名 | 作者 | 章节 |
|------|------|------|
| 系统之美 | Donella H. Meadows | 6 章 |
| 非统计学家的统计学 | Birger Stjernholm Madsen | 9 章 |

### 思维与人生

| 书名 | 作者 | 章节 |
|------|------|------|
| 纳瓦尔宝典 | Eric Jorgenson | 2 部分 |

### 物理科学

| 书名 | 作者 | 章节 |
|------|------|------|
| 量子光学与量子涨落导论 | Peter W. Milonni | 7 章 |
| 线性响应理论：现代分析-代数方法 | Giuseppe De Nittis & Max Lein | 7 章 |

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
