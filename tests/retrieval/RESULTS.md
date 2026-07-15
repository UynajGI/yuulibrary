# 检索基准 — 改造分数追踪

每完成一个阶段重跑 `node tests/retrieval/harness.js`，在此追加一行。
基线详见 [BASELINE.md](BASELINE.md)。

| 阶段 | 改动摘要 | R@10 | MRR@10 | no_answer acc | 备注 |
|------|---------|-----:|-------:|--------------:|------|
| 基线 | 检索核心抽到 retrieval.js，行为零变化 | 0.764 | 0.597 | 0.000 | title_exact=1.0, cross_lang=0.538 |
| 阶段 1 | 正文 chunk 倒排索引 + 修 clean_tree 正文泄漏 | 0.736 | 0.586 | 0.000 | cross_lang 0.538→0.692, deep_body MRR 0.592→0.714。**核心验证通过**：`双精度算术 17位 条件数` 正确节点 0138 从未召回 → top1/2。title_exact MRR 略降（0.945→0.855）因暂失字段加权，阶段 2 BM25F 修复 |
