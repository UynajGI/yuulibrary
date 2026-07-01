---
name: add-note-to-library
description: |
  将书籍/论文蒸馏为思维框架笔记，加入个人数字图书馆的 content/notes/ 板块。
  LLM 直接通读原文提炼核心框架、决策启发式、表达 DNA，无需外部 skill 依赖。
  触发词：add note, 写笔记, 做笔记, agent笔记, 思维框架笔记, note to library, 写成笔记.
---

# Add Note to Library

直接从书/论文/人物蒸馏思维框架，生成 Hugo 笔记页面。

## 架构约定

```
content/notes/               # 扁平存放（每篇笔记一个 .md 文件）
├── _index.md                # section 定义（title + description）
├── <note-slug>.md           # 笔记正文
└── welcome.md               # 欢迎页
```

**关键规则**：
- 笔记直接放 `content/notes/<note-slug>.md`，**不用子目录**
- markdown 中**不要重复写 H1 标题**（模板已从 front matter `title` 渲染）
- `_index.md` 是 section 定义，不含笔记内容

**front matter**（必须全齐）：
```yaml
---
title: "中文标题"
description: "一句话概括核心内容"
date: YYYY-MM-DD            # 写昨天（Hugo 不构建未来日期，且不报错）
author: "原作者"             # 原书/论文作者
source_type: "book|paper|person"
source_title: "原书/论文标题"
tags: ["标签1", "标签2"]
weight: N
---
```

## 可用 JS 增强

笔记中可使用项目已加载的 JS 库：

| 库 | shortcode | 用途 |
|----|-----------|------|
| **KaTeX** | `$...$` / `$$...$$` | 数学公式 |
| **rough.js** | `{{< rough-canvas >}}` | 手绘风格示意图（思维模型、关系图） |
| **pseudocode.js** | `{{< algorithm >}}` | 算法/决策流程 |
| **mermaid** | ` ```mermaid ` | 流程图、决策树、关系图 |

## 工作流

### Phase 0: 确认输入

1. **来源识别**：
   - 已入库的书（`content/books/<slug>/`）→ 直接读取章节
   - 已入库的论文（`content/papers/<slug>/`）→ 直接读取
   - 外部 PDF/EPUB → 先走 add-book-to-library 或 add-paper-to-library 入库
   - 纯文本/URL → 直接分析

2. **笔记类型**：
   - **思维框架笔记**（默认）→ 提炼此人的思维框架、决策启发式、表达 DNA
   - **读书笔记** → 提炼核心观点、论证链、批判分析
   - **论文笔记** → 摘要/方法/结论/批判（走 add-paper-to-library 更合适）

### Phase 1: 内容分析

通读原文，提取：

| 维度 | 要提取的 |
|------|---------|
| 核心主张 | 一句话说清楚此人/此书的核心观点 |
| 思维框架 | 3-7 个可复用的思维模型，每个包含：描述/来源/应用场景/局限 |
| 决策启发式 | 5-10 条快速判断规则 |
| 表达 DNA | 此人如何思考、如何表达的独特模式 |
| 推荐/延伸 | 相关的书、论文、资源 |
| 批判性思考 | 盲点、争议、反例、适用边界 |

### Phase 2: 生成笔记

按以下模板生成 `content/notes/<slug>.md`：

```markdown
---
title: "中文标题"
description: "一句话概括"
date: YYYY-MM-DD
author: "原作者"
source_type: "book"
source_title: "原书名"
tags: ["标签1", "标签2"]
weight: N
---

>「一句标志性引用」—— 来源

## 一句话概括

<用一句话说清核心主张>

---

## 核心思维框架

### 1. 框架名称

**描述**：一句话说清这个框架是什么。

- **来源**：章节/访谈
- **应用场景**：什么时候用
- **局限**：什么时候不适用

（重复 3-7 个）

---

## 决策启发式

1. **规则名**：一句话说清判断规则
2. ...

（5-10 条）

---

## 表达 DNA

- **特征 1**：描述 + 示例
- **特征 2**：描述 + 示例

---

## 批判性思考

- **盲点**：...
- **争议**：...
- **适用边界**：...

---

## 关键引用

> "引用原文" —— 来源

---
**来源**：原书/论文信息
**调研时间**：YYYY-MM-DD
```

### Phase 3: 构建验证

```bash
hugo --gc --minify
```

### Phase 4: 首页书架注册（可选）

如果是书/论文的新笔记，在 `layouts/_shortcodes/bookshelf.html` 中加入卡片。

## 失败模式

| 症状 | 一线修复 | 仍失败 |
|------|---------|--------|
| 书籍未入库 | 先走 add-book-to-library | 用户提供摘要 |
| 笔记不显示 | 检查 front matter date（写昨天） | 检查 slug 和目录结构 |
| date 写了今天 | 改为昨天 | Hugo 不报错但不构建 |
| 内容空洞 | 回头重读原文更多章节 | 缩小范围，只覆盖核心观点 |

## 反例黑名单

| # | 禁止 | 正确做法 |
|---|------|---------|
| 1 | 笔记放子目录 `notes/foo/_index.md` | 扁平放 `notes/<slug>.md` |
| 2 | date 写今天 | 写昨天 |
| 3 | 不加 tags | 必须 2-3 个 |
| 4 | 笔记里复制全书内容 | 只提炼框架和启发式 |
| 5 | 忽略已有 JS 增强 | 适当使用 rough-canvas / algorithm / mermaid |
| 6 | 重复写 H1 标题 | 模板从 front matter 渲染 |
