# 清洗参考——OCR 模式 + 格式化细节

## MinerU 系统性损坏 13 项检查清单

1. **`$$` 误包正文** — KaTeX 把中文拆单字 → 去掉 `$$`
2. **孤儿 `$$`** — 配对错位，吞噬正文 → 补全配对
3. **标题全平铺** — 全是 `##` 无层级 → 修复规则见 SKILL.md Phase 4
4. **章末混入下一章标题** — 删除孤立标题行
5. **标题+正文粘连** — 拆开
6. **裸代码无围栏** → 包裹 ` ```python ``` `
7. **代码缩进全丢** → 按 Python 语法恢复
8. **转义残留** `\_` `\*` `\#` → 替换
9. **代码注释被格式化为标题** → 降级 `#`/`##`
10. **`def__init__` 粘连** → `def __init__`
11. **` ```txt ` 误标** → ` ```python `
12. **行尾单 `$`** → 删除
13. **`mineru-algorithm` div** → 删除

## 常见 OCR 误识别

| 原文 | 误识别 | 修复 |
|------|--------|------|
| λ | 入 | 上下文替换 |
| S₁ | .s. | Phase 4.5 Haiku |
| `\mathrm{S}` | `\mathrm {~ s ~}` | `\\[a-z]+ {` → `\\\1{` |

## 表格格式化
- 格子世界：`<table class="grid-world">`（CSS 固定格子）
- 数据表格：居中、padding（custom.scss 已配置）
- 表注：`{{< caption >}}表N.N 标题{{< /caption >}}`（紧接在 `<table>` 之前）

## Mermaid 流程图清理
MinerU 双重输出：原图 PNG + `<details><summary>flowchart</summary>`mermaid````</details>`。
处理：删 `<details>` 和 mermaid 块，留 `![](images/xxx.jpg)` 原图。

## 版权信息清理
Phase 2 删除：ISBN、版权声明、客服热线/邮箱、源代码下载链接（保留 GitHub 链接）。
