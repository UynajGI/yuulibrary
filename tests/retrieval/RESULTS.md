# 检索基准 — 改造分数追踪

每完成一个阶段重跑 `node tests/retrieval/harness.js`，在此追加一行。
基线详见 [BASELINE.md](BASELINE.md)。

| 阶段 | 改动摘要 | R@10 | MRR@10 | no_answer acc | 备注 |
|------|---------|-----:|-------:|--------------:|------|
| 基线 | 检索核心抽到 retrieval.js，行为零变化 | 0.764 | 0.597 | 0.000 | title_exact=1.0, cross_lang=0.538 |
| 阶段 1 | 正文 chunk 倒排索引 + 修 clean_tree 正文泄漏 | 0.736 | 0.586 | 0.000 | cross_lang 0.538→0.692, deep_body MRR 0.592→0.714。**核心验证通过**：`双精度算术 17位 条件数` 正确节点 0138 从未召回 → top1/2。title_exact MRR 略降（0.945→0.855）因暂失字段加权，阶段 2 BM25F 修复 |
| 阶段 2 | 正确 BM25F（拆 tokenizeWithFrequency/Unique，真实 TF，chunk 多字段加权）| 0.791 | 0.596 | 0.000 | title_exact MRR 0.855→0.924（恢复字段加权），acronym 0.800→1.000（真实 TF 助缩写词频）。deep_body 的 `双精度` 题：真实 TF 让 numerical-computation（确实大量讨论条件数）重回 top——属合理主题冲突，阶段 3/4 多路召回解消歧 |
| 阶段 3 | 统一同义词 tokenizer（多词短语拆 token）+ 加权 token（原始 1.0/同义 0.6）+ 扩充词表 | 0.797 | 0.582 | 0.000 | synonym_rewrite 0.500→0.750，cross_language MRR 0.282→0.317，`久保公式`→linear-response-theory 召回成功。加权防同义词稀释精确匹配 |
| 阶段 4 | 多路召回 + RRF（title phrase + BM25F body + doc/TOC route，RRF k=60 融合）| 0.811 | 0.598 | 0.000 | **R@10 首次超基线 +0.047**。cross_language 0.615→0.692（TOC 路由助跨语言），deep_body 0.714→0.857（title phrase 路提升深层召回），multi_hop MRR 0.571→0.667。`双精度` 题目标 qmc-lattice-models 经 RRF 稳定进 top10 |
| 阶段 5 | 多信号 confidence（coverage+rrfScore+titleHit+margin）+ LLM rerank 改进（400 字窗口+命中词片段+top8）| 0.858 | 0.598 | **1.000** | **no_answer 0.000→1.000（7/7 全对）**。coverage 是最强鉴别信号（good~1.0 vs no_answer 0.25-0.57）。LLM rerank 上下文从固定前 200 字改为命中词附近 ±150 字 400 字窗口，重排候选 6→8 |
