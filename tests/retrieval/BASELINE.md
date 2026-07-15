# 检索基准 — 基线分数（重构前）

记录当前实现（rag-overhaul 分支起点，检索核心刚从 chat.js 抽到 retrieval.js，
**行为零变化**）在 golden.json（148 题）上的分数，作为后续每步改造的对比锚点。

运行：`node tests/retrieval/harness.js`

## 基线分数（TOPK=10）

```
总体:        R@10=0.764 MRR=0.597 acc=0.764 (n=148)

按 category:
  title_exact          R@10=1.000 MRR=0.945   ← 精确术语查询完美（印证分析结论）
  fuzzy                R@10=1.000 MRR=0.743
  multi_hop            R@10=1.000 MRR=0.583
  deep_body            R@10=0.857 MRR=0.592   ← 文档级召回尚可，但正确节点常不在 top（见下）
  acronym              R@10=0.800 MRR=0.550
  multi_doc            R@10=0.800 MRR=0.800
  concept              R@10=0.750 MRR=0.552
  cross_language       R@10=0.538 MRR=0.259   ← 同义词 token 不匹配的代价
  synonym_rewrite      R@10=0.500 MRR=0.333
  no_answer            R@10=0.000 MRR=0.000   ← confidence 判定完全失效
  context_followup     R@10=0.000 MRR=0.000   ← 纯指代题（预期差）
  typo                 R@10=0.000 MRR=0.000   ← 无模糊匹配

按 confidence:
  hard                 R@10=0.844 MRR=0.775 (n=45)
  soft                 R@10=0.728 MRR=0.519 (n=103)
```

## 与分析一致的关键失败模式

1. **no_answer 全军覆没（0/7）**：confidence 基于归一化相对分，"火星地质构造"
   命中 tensor-network-methods 仍判 high。→ 阶段 5 confidence 校准的核心验证题。
2. **cross_language 偏低（0.538）**：`久保公式`/`linear response` 等同义词扩展
   把多词短语当单 token，索引里不存在 → 匹配不到。→ 阶段 3 修复。
3. **deep_body 的"假阳性"**：`双精度算术 17 位精度 条件数` 文档级 R@10 算对
   （qmc-lattice-models 挤进 top10），但 top1 是 numerical-computation 的错误节点，
   分析指出的正确节点 0138「矩阵乘积稳定化」不在 top50——正文 200 字后的内容搜不到。
   → 阶段 1 正文 chunk 倒排索引的核心验证题。
4. **typo 完全失败**：无编辑距离/模糊匹配能力。

## 评测口径说明

- Recall@10：期望 doc_id 是否出现在 top-10 命中里（文档级，非节点级）。
  这对 deep_body 偏宽松——正确节点不在 top 也能判对。节点级精度提升靠阶段 1。
- no_answer：期望无命中或 confidence=low。
- MRR：第一个命中的期望 doc 的倒数排名。
- hard/soft：hard = 可机械锚定 ground truth（标题精确/已知节点）；
  soft = 启发式锚定，ground truth 可能在 review 时收紧。
