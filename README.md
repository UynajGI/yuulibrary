# Yuunagi Library

个人的数字图书馆，基于 [Hugo](https://gohugo.io) + [Hugo Book](https://github.com/alex-shpak/hugo-book) 主题构建，部署于 GitHub Pages。

## 结构

```
yuulibrary/
├── hugo.toml               # Hugo 配置
├── content/
│   ├── _index.md           # 图书馆首页（书架卡片自动生成）
│   ├── books/<book-slug>/   # 书籍（扁平存放，每本一个子目录）
│   │   ├── _index.md             # 封面 + 目录
│   │   ├── ch01.md ~ ...         # 章节
│   │   └── images/               # 图片（WebP）
│   ├── papers/<paper-slug>/ # 论文笔记（翻译正文 + 结构化分析）
│   │   ├── _index.md             # 单篇论文一个 section
│   │   └── images/               # 图片（WebP）
│   └── notes/<slug>.md      # 蒸馏笔记
├── layouts/                # 短代码 / 模板覆盖
├── assets/custom.scss      # 全局样式
├── static/chat/            # AI 问答 Agent（BYOK 浏览器直连）
└── .github/workflows/      # CI/CD 自动部署
```

## 书籍

书架卡片自动生成——遍历所有 `_index.md` 的 `category` 数组自动归类。新增内容只需填好 front matter 的 `category`（书籍自定义分类如 `quant`/`ml`/`physics`，论文用 arXiv 一级分类如 `quant-ph`），无需手动编辑 shortcode。

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
| 裸K线交易法 | 许佳聪 | 10 章 |
| 市场微观结构理论 | Maureen O'Hara | — |

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
| 人性的弱点 | [美] 戴尔·卡耐基 | 30 章 |

### 物理科学

| 书名 | 作者 | 章节 |
|------|------|------|
| 量子光学与量子涨落导论 | Peter W. Milonni | 7 章 |
| 线性响应理论：现代分析-代数方法 | Giuseppe De Nittis & Max Lein | 7 章 |

## 论文笔记

共 26 篇，按主题分类（几何相位与几何量子计算 / 电路 QED / 线性响应理论 / 量子光学与层析 / 机械振子量子化），详见 `/papers/` 页面。
书架卡片为 `{{< papershelf >}}` 短代码自动生成，与书籍书架共享样式与动画。

## 笔记

4 篇综合笔记（量子光学实验综述 / 线性响应理论基础笔记等），扁平存放于 `content/notes/`，按日期自动排序。

## AI 问答

右下角浮动按钮打开聊天面板，支持从全部书/论文/笔记中检索并回答问题。用户自带 API Key（BYOK），浏览器直连模型 API。详见 `CLAUDE.md`。

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
