---
name: add-note-to-library
description: |
  将书籍/论文转化为 agent 思维框架笔记，加入个人数字图书馆的 content/notes/ 板块。
  内部调用 huashu-nuwa skill 生成人物/主题 perspective skill，同时在 notes/ 下创建结构化笔记页面。
  触发词：add note, 写笔记, 做笔记, agent笔记, 思维框架笔记, note to library, 写成笔记.
---

# Add Note to Library

将书籍或论文转化为 agent 思维框架笔记，加入 Hugo 数字图书馆。

## 架构约定

```
content/notes/<note-slug>/     # 目录式，与 papers/ 结构对齐
├── _index.md                  # 笔记主页（section 列表页）
└── images/                    # 可选图片
```

**_index.md front matter**（必须全齐）：
```yaml
---
title: "中文标题"
description: "一句话概括核心内容"
date: YYYY-MM-DD            # 🔴 写昨天，不写今天
author: "原作者"             # 原书/论文作者
source_type: "book|paper"    # 来源类型
source_title: "原书/论文标题" # 原始标题
tags: ["标签1", "标签2"]
weight: N                    # 笔记区排序
---
```

**🔴 关键规则**：
- 每个笔记一个目录 `content/notes/<slug>/`，不扁平存放
- `_index.md` 是唯一的 markdown 文件（单篇笔记不拆章）
- `date` 写昨天（Hugo 不构建未来日期，且不报错）
- Tags 必须加 2-3 个
- **按时间自动分类**：笔记按 `date` 字段自动归入「本周 / 上周 / 上月 / 更早」，无需手动打主题分类标签。Tags 仍需加（用于标签页检索），但侧边栏菜单按时间分组显示
- 与 papers/ 结构完全对齐，菜单自动生成

## 工作流

### Phase 0: 确认输入

1. **来源识别**：用户给的是什么？
   - 已入库的书（`content/books/<slug>/`）→ 直接读取内容
   - 已入库的论文（`content/papers/<slug>/`）→ 直接读取内容
   - 外部 PDF/EPUB → 先走 add-book-to-library 或 add-paper-to-library 入库，再做笔记
   - 纯文本/URL → 直接分析

2. **笔记类型**：用户要什么？
   - **思维框架笔记**（默认）→ 调用 nuwa 生成 perspective skill + 笔记摘要
   - **读书笔记** → 不调用 nuwa，手动提炼核心观点
   - **论文笔记** → 不调用 nuwa，按论文笔记模板（摘要/方法/结论/批判）

3. **确认后** → Phase 1

### Phase 1: 内容分析

根据输入来源，读取原始内容：

| 来源 | 读取方式 |
|------|---------|
| 已入库书籍 | 逐章读取 `content/books/<slug>/ch*.md` |
| 已入库论文 | 读取 `content/papers/<slug>/_index.md` |
| 外部 PDF | MinerU 提取 → 读取 merged markdown |
| URL | WebFetch 获取内容 |

### Phase 2: 调用 nuwa（仅思维框架笔记）

当笔记类型为「思维框架笔记」时：

1. **创建 skill 目录**：`.claude/skills/<person>-perspective/`
2. **启动 nuwa Phase 1**：6 个并行 Agent 调研（本地语料优先模式）
3. **等待完成** → nuwa Phase 2：框架提炼
4. **生成 SKILL.md**：写入 `.claude/skills/<person>-perspective/SKILL.md`

nuwa 生成的 skill 是独立产物，笔记页面是另一个产物。两者互补：
- skill → 可被 Claude Code 调用的 agent 思维框架
- note → 图书馆中可浏览的结构化摘要

### Phase 3: 生成笔记页面

在 nuwa 调研结果的基础上，生成笔记 `_index.md`：

**笔记内容结构**（思维框架笔记模板）：

```markdown
# 书名/论文标题

## 一句话概括
<用一句话说清楚这本书/论文的核心主张>

## 核心思维框架

### 框架1: <名称>
<一句话描述>
- **来源**：<章节/访谈/推文>
- **应用场景**：<什么时候用>
- **局限**：<什么时候不适用>

### 框架2: ...
（3-7个框架）

## 决策启发式
<此人做判断时的快速规则，5-10条>

## 表达 DNA
<此人如何思考和表达的关键特征>

## 推荐书单 / 延伸阅读
<此人推荐的书或相关资源>

## 批判性思考
<这个框架的盲点、争议、反例>

## 关键引用
> "引用原文" —— 人名, 来源

---
**来源**：原书/论文信息
**Perspective Skill**：[<person>-perspective](/.claude/skills/<person>-perspective/)
**调研时间**：YYYY-MM-DD
```

### Phase 4: 构建验证

```bash
hugo --gc --minify
```

检查：笔记页面在菜单中正确显示、内容完整、无构建错误。

🔴 **CHECKPOINT**：展示笔记页面预览，用户确认后完成。

## 失败模式

| 症状 | 一线修复 | 仍失败 |
|------|---------|--------|
| nuwa Agent 超时 | 降低期望，只用本地语料生成 | 跳过 nuwa，手动写笔记 |
| 书籍未入库 | 先走 add-book-to-library | 用户提供摘要 |
| 笔记不显示 | 检查 `_index.md` front matter | 检查 weight 和目录结构 |
| date 写了今天 | 改为昨天 | Hugo 不报错但不构建 |

## 反例黑名单

| # | 禁止 | 正确做法 |
|---|------|---------|
| 1 | 笔记放扁平文件 `notes/foo.md` | 放目录 `notes/foo/_index.md` |
| 2 | date 写今天 | 写昨天 |
| 3 | 不加 tags | 必须 2-3 个 |
| 4 | 跳过 nuwa 直接写 | 思维框架笔记必须调用 nuwa |
| 5 | 笔记里复制全书内容 | 只提炼框架和启发式 |
| 6 | `_index.md` 加 weight 但不加 description | 两个都加 |
