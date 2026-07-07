# 部署详解

> 面向要部署自己版本的 fork 者。
>
> 架构见 [architecture.md](architecture.md),加内容流程见 [content-workflow.md](content-workflow.md)。

## 分支模型

本仓库用双分支模型隔离 template 和个人内容：

| 分支 | 角色 | 谁用 |
|------|------|------|
| `main`（默认） | **template** — 框架 + 3 个示例（1 书/1 论文/1 笔记） | fork 者拿到这个 |
| `personal` | 完整个人内容（所有书/论文/笔记） | 仓库 owner 日常开发 |
| `gh-pages` | 部署产物 | CI 自动推，不要手动改 |

**机制**：
- tag 触发 CI 时，GitHub 用**默认分支（main）的 deploy.yml**，但 checkout 的是 tag 指向的 commit
- 在 `personal` 打 tag → CI 构建 personal 的内容 → 推 gh-pages → 线上站是完整内容
- fork 者 fork 后拿到 main（template），他们打 tag 部署自己的 gh-pages，与原仓库互不干扰
- **chat agent** 从 `hugo.toml` 的 `BookContentBranch` 参数决定 fetch 哪个分支的正文（main 默认 `'main'`，personal 设 `'personal'`）

**日常发布流程**（仓库 owner）：
```bash
git checkout personal         # 确保在 personal 分支
bash scripts/release.sh       # 算下一个 tag（在 main 会提醒切换）
git tag <tag> && git push origin <tag>
```

## 环境搭建

### 必需依赖

#### Hugo extended(0.163.3+)

必须用 **extended** 版(SCSS 编译支持)。标准版会构建失败。

```bash
# Ubuntu/Debian(snap)
sudo snap install hugo --channel=extended

# macOS
brew install hugo

# 或从 https://github.com/gohugoio/hugo/releases 下载 extended 二进制
```

验证:`hugo version` 输出含 `+extended`。

#### Python(3.10+)

PageIndex 索引构建、翻译脚本用。

```bash
python3 --version    # 确认 ≥ 3.10
pip install pyyaml   # build_pageindex.py 依赖
```

可选:`pip install litellm`(LLM 摘要用,不装则 summary 退化为原文截断)。

#### Node.js(18+)

lefthook 的 prettier / eslint / markdownlint-cli 通过 `npm exec -y` 临时拉,不需要全局安装这些工具,但 Node.js 运行时必须有。

```bash
node --version    # 确认 ≥ 18
```

### 可选依赖

#### pandoc(加书才需要)

EPUB → Markdown 转换。只在你打算加书时安装。

```bash
sudo apt install pandoc    # Ubuntu/Debian
brew install pandoc         # macOS
```

#### lefthook(2.x,强烈推荐)

Git hooks 自动跑质量校验。

```bash
# macOS
brew install lefthook

# Linux(从 https://github.com/evilmartians/lefthook/releases 下载二进制)

# 安装 hooks(在 repo 根目录)
lefthook install
```

#### MinerU(加书才需要)

PDF/EPUB 提取。见 [MinerU 文档](https://github.com/opendatalab/MinerU)。命令行 `magic-pdf -p paper.pdf -o out/ -m auto`。

---

## Fork 部署完整流程

### 1. Fork + clone

```bash
# 在 GitHub 上 fork,然后:
git clone --recurse-submodules https://github.com/<你的用户名>/yuulibrary.git
cd yuulibrary
```

> ⚠️ `--recurse-submodules` 必须有,拉取两个子模块:
> - `themes/hugo-book`(Hugo Book 主题)
> - `lib/PageIndex`(AI 问答索引库)
>
> 漏了任一站点会构建失败。若已 clone 未带子模块,补救:`git submodule update --init --recursive`。

### 2. 改 hugo.toml

必改字段:

```toml
baseURL = 'https://<你的用户名>.github.io/<你的仓库名>/'
# ...
[params]
  BookRepo = 'https://github.com/<你的用户名>/<你的仓库名>'
```

`baseURL` 决定所有内部链接前缀(AI 问答的 raw URL 也从这里推导)。`BookRepo` 决定 chat agent 从哪个 GitHub repo fetch 正文。

### 3. (可选)配置 CI LLM 摘要

不配也能用——PageIndex summary 退化为原文前 200 字截断。配了则有真 LLM 摘要,检索质量更好。

在 GitHub repo **Settings → Secrets and variables → Actions**:

**Secrets**(任选一个 provider 的 key):
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `DEEPSEEK_API_KEY` / `OPENROUTER_API_KEY` / `GEMINI_API_KEY` / `DASHSCOPE_API_KEY` / `ZHIPUAI_API_KEY` / `MIMO_API_KEY`

**Variables**(必配,若配了 key):
- `LLM_MODEL` — litellm 格式,如 `deepseek/deepseek-chat`、`anthropic/claude-sonnet-4-20250514`、`openai/gpt-4o-mini`

### 4. GitHub Pages 设置

repo **Settings → Pages**:
- Source:选 **Deploy from a branch**
- Branch:`gh-pages` / `(root)`
- 首次打 tag 后 `gh-pages` 分支会自动创建

### 5. 打 tag 触发部署

```bash
bash scripts/release.sh
# 输出:下一个发布 tag:2026.07.08.01

git tag 2026.07.08.01 && git push origin 2026.07.08.01
# CI 自动跑,约 1 分钟后部署完成
```

CI 全步骤:Validate books + papers → Translate-chapters regression tests → Build PageIndex (incremental) → Build → Deploy。

---

## CI 工作流

`.github/workflows/deploy.yml`——**只在打 tag 时触发,push 到 main 不跑 CI**。

### 触发条件

```yaml
on:
  push:
    tags:
      - '20[0-9][0-9].[0-9][0-9].[0-9][0-9].[0-9]*'    # YYYY.MM.DD.NN
  workflow_dispatch:    # 保留手动触发
```

> ⚠️ **不能用 `tags: ['20??.??.??.*']` 单行列表写法**——会让 GitHub Actions workflow 评估报 file issue(push 到 main 误触发失败 run,tag push 反而不触发)。必须用多行 block + 字符类。

### 并发控制

```yaml
concurrency:
  group: deploy
  cancel-in-progress: false    # 多 tag 连发时排队,不取消进行中的部署
```

### 打 tag

`scripts/release.sh` 算下一个 tag(格式 `YYYY.MM.DD.NN`,同一天递增最后一位,补零两位,规避八进制陷阱)。**只读**,确认后手动执行输出的 `git tag` 命令。

---

## 环境变量

### 本地(.env,gitignore)

复制 `.env.example` 为 `.env` 并填入 key。**只在加书/论文(翻译脚本)时需要**,纯部署不读。

| 变量 | 默认 | 用途 |
|------|------|------|
| `LLM_PROVIDER` | `deepseek` | provider 选择(deepseek/glm/openai) |
| `DEEPSEEK_API_KEY` | — | DeepSeek API key |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | 模型名 |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | 可选自定义 |

详见 `.env.example`。

### CI(GitHub Secrets)

| Secret | 用途 | 必需? |
|--------|------|--------|
| `*_API_KEY`(任一) | PageIndex LLM 摘要 | ➖(不配则截断降级) |
| `LLM_MODEL`(Variable) | litellm 模型路由 | 配了 key 就必配 |
| `GITHUB_TOKEN` | 自动提供,部署 gh-pages | ✅(自动) |

---

## 子模块

| 子模块 | 路径 | 用途 |
|--------|------|------|
| [hugo-book](https://github.com/alex-shpak/hugo-book) | `themes/hugo-book/` | Hugo Book 主题(SCSS 模板、布局、shortcode 基础) |
| [PageIndex](https://github.com/VectifyAI/PageIndex) | `lib/PageIndex/` | 树索引库(被 `build_pageindex.py` 用) |

更新子模块到最新:

```bash
git submodule update --remote --merge
git add themes/hugo-book lib/PageIndex
git commit -m "chore: update submodules"
```

---

## 故障排查

### 页面没生成(`public/<section>/<slug>/index.html` 不存在)

**95% 是日期陷阱**。Hugo 默认不构建 `date` 在未来的页面,且**不报错、不警告,静默跳过**。

根因:front matter `date: 2026-07-08`(无时间)→ Hugo 解析成 `2026-07-08T00:00:00Z`(UTC 午夜)。若本地时区是 UTC+8,本地 7/8 凌晨对应 UTC 7/7 晚上 → 该 date 还在未来 ~7 小时 → 跳过。

修复(任选):
1. 写昨天的日期(最简单):`date: 2026-07-07`
2. 带时区且是过去:`date: 2026-07-07T23:00:00+08:00`

自检:

```bash
date -u                              # 当前 UTC 时间
grep "^date" content/<section>/<slug>/_index.md
# 确保 date 解析后的 UTC 时刻 ≤ 上面 date -u 的输出
```

### CI 失败:workflow file issue

检查 `on.push.tags` 写法——必须用多行 block + 字符类(见上文「触发条件」),不能用单行 `tags: ['...']`。

### gh-pages 部署半推

`concurrency: cancel-in-progress: false` 已防止此问题(多 tag 连发时排队)。若仍出现,删 `gh-pages` 分支重新打 tag。

### LLM key 未配降级

PageIndex summary 退化为原文前 200 字截断——功能不挂,但检索质量下降。配 CI secrets 即可恢复(见上文)。

### 子模块未拉取(构建失败)

```
Error: theme "hugo-book" not found
```

修复:`git submodule update --init --recursive`。

### chat agent 取不到正文

检查:
1. `hugo.toml` 的 `BookRepo` 改成你的 repo
2. `head.html` 推导 raw URL 写死 `main` 分支——若你的默认分支不是 `main`,改这里
3. repo 必须是 public(chat agent 从 raw.githubusercontent.com fetch)
