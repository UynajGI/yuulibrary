<div align="center">

# 📚 Yuunagi Library

**无向量个人知识图书馆**

Hugo + Hugo Book 主题多书站点 · 部署于 GitHub Pages

[![Hugo](https://img.shields.io/badge/Hugo-0.164.0-FF4088?logo=hugo&logoColor=white)](https://gohugo.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy: GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-181717?logo=github&logoColor=white)](https://uynajgi.github.io/yuulibrary/)
[![Theme: Hugo Book](https://img.shields.io/badge/Theme-Hugo%20Book-40C4FF)](https://github.com/alex-shpak/hugo-book)
[![CI: tag triggered](https://img.shields.io/badge/CI-tag%20triggered-22C55E)](.github/workflows/deploy.yml)

</div>

---

> 把书、论文、笔记统一整理成结构化中文笔记。
> 支持全文 AI 问答、三态主题切换、自动化质量校验。

## ✨ 特性

| | 特性 | 说明 |
|:---:|---|---|
| 📖 | **多书站点** | 书籍（多章拆分）、论文（翻译+结构化分析）、笔记（思维框架蒸馏）三类内容 |
| 🌗 | **三态主题切换** | 日间 / 夜间 / 自动跟随系统，左侧菜单切换，localStorage 持久化，无首屏闪烁 |
| 📊 | **馆藏统计仪表盘** | 首页自动统计 books/papers/notes 数量 + 最近添加 + 标签云 |
| 🤖 | **AI 问答（BYOK）** | 浏览器直连 LLM，PageIndex 树索引 + BM25 精排 + ReAct 多轮推理，用户自带 API Key |
| 🔍 | **自动化质量校验** | lefthook 36 项机械验证 + 翻译脚本回归测试，shortcode 闭合 / `$` 配对 / LaTeX 渲染坑全检查 |
| 🏷️ | **tag 触发 CI** | 打 tag 才部署，平时 push 不跑 CI，不撞车 |

## 🚀 快速开始

### 环境要求

| 依赖 | 版本 | 用途 | 必需? |
|------|------|------|:---:|
| [Hugo extended](https://gohugo.io/installation/) | 0.164.0+ | 站点构建（SCSS 支持） | ✅ |
| Python | 3.10+ | PageIndex 索引构建、翻译脚本 | ✅ |
| Node.js | 18+ | lefthook 的 prettier/eslint/markdownlint | ✅ |
| [pandoc](https://pandoc.org/) | 任意 | EPUB→Markdown（加书才需要） | ➖ |
| [lefthook](https://github.com/evilmartians/lefthook) | 2.x | Git hooks | ➖ |

> 💡 **必须用 Hugo extended**（SCSS 编译），标准版会构建失败。验证：`hugo version` 输出含 `+extended`。

### 本地预览

```bash
# 克隆（含主题子模块）
git clone --recurse-submodules <repo-url>
cd yuulibrary

# 安装 git hooks（可选，但推荐）
lefthook install

# 本地预览（http://localhost:1313/yuulibrary/）
hugo server
```

> ⚠️ 子模块必须拉取：`themes/hugo-book`（主题）+ `lib/PageIndex`（AI 问答索引库）。漏了任一站点会构建失败。若已 clone 未带子模块，跑 `git submodule update --init --recursive`。

## 🍴 Fork 部署

**5 步拥有自己的数字图书馆：**

1. **Fork 并 clone**（带子模块）：
   ```bash
   git clone --recurse-submodules https://github.com/<你的用户名>/yuulibrary.git
   ```

2. **改 `hugo.toml`** 必改字段（见下方「必改配置清单」👇）

3. **（可选）配置 CI secrets** 启用 LLM 摘要：在 GitHub repo Settings → Secrets 添加任一 LLM API key + `LLM_MODEL` variable（litellm 格式，如 `deepseek/deepseek-chat`）。不配也能用，PageIndex summary 退化为原文截断

4. **GitHub Pages 设置**：repo Settings → Pages → Source 选 `gh-pages` 分支（首次打 tag 后自动创建）

5. **打 tag 触发首次部署**：
   ```bash
   bash scripts/release.sh                    # 算下一个 tag（只读）
   git tag <tag> && git push origin <tag>     # 确认后推送，CI 自动部署
   ```

### 🔧 必改配置清单

fork 后必须修改的硬编码字段：

| 文件 | 字段 | 当前值 | 改成 |
|------|------|--------|------|
| `hugo.toml` | `baseURL` | `https://uynajgi.github.io/yuulibrary/` | `https://<你的用户名>.github.io/<你的仓库名>/` |
| `hugo.toml` | `params.BookRepo` | `https://github.com/uynajgi/yuulibrary` | `https://github.com/<你的用户名>/<你的仓库名>` |
| `layouts/_partials/docs/inject/head.html` | `YUU_CHAT_RAW_BASE` 推导里的 `main` | 写死 `main` | 若你的默认分支不是 `main`，改这里 |

> 💡 **user/organization site 提示**：若你部署到 `https://<用户名>.github.io/`（根域名，非子路径），还需重新评估 `relativeurls` 和 `uglyurls`——当前配置针对 GitHub Pages project site（子路径）优化。

## 📁 项目结构

```
yuulibrary/
├── hugo.toml                        # 🎛️  Hugo 配置（baseURL / BookRepo fork 后必改）
├── content/
│   ├── books/<slug>/                # 📚  书籍（多章，_index.md + ch01.md ~ chNN.md + images/）
│   ├── papers/<slug>/               # 📄  论文笔记（_index.md + images/）
│   └── notes/<slug>.md              # ✏️  蒸馏笔记
├── layouts/
│   ├── _shortcodes/                 # 🧩  自定义 shortcode（bookshelf/stats/callout/theorem...）
│   └── _partials/docs/inject/       # 📌  head.html（主题切换+KaTeX）/ menu-after.html（菜单）
├── assets/_custom.scss              # 🎨  全局样式 + 主题切换变量
├── static/
│   ├── js/theme-toggle.js           # 🌗  三态主题切换逻辑
│   ├── chat/                        # 🤖  AI 问答 Agent（BYOK 浏览器直连）
│   └── pageindex/                   # 🔍  PageIndex 索引 JSON（进 git）
├── scripts/                         # ⚙️  构建脚本（build_pageindex / release / check_latex_render）
├── lib/PageIndex/                   # 📦  子模块：树索引库
├── themes/hugo-book/                # 🎨  子模块：Hugo Book 主题
├── .github/workflows/deploy.yml     # 🚀  CI：打 tag → 部署
└── lefthook.yml                     # 🪝  Git hooks 配置
```

详细架构见 [docs/architecture.md](docs/architecture.md)。

## 📚 文档

| 文档 | 内容 | 读者 |
|------|------|------|
| 📐 [docs/architecture.md](docs/architecture.md) | 站点架构 + AI 问答 + PageIndex + 质量校验 | 想理解项目怎么工作的人 |
| 🚢 [docs/deployment.md](docs/deployment.md) | 部署详解 + CI + 环境变量 + 故障排查 | 要部署自己版本的人 |
| 📝 [docs/content-workflow.md](docs/content-workflow.md) | 加书 / 论文 / 笔记的流程 | 想加自己内容的人 |
| 🤖 [CLAUDE.md](CLAUDE.md) | AI 协作约定（SOP 红线 / shortcode 写法） | AI agent / 协作者 |
| 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) | 贡献指南 | 想贡献的人 |

## 🤝 贡献

欢迎 issue 和 PR！详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 📄 许可证

[MIT](LICENSE) © 2026 Yuunagi
