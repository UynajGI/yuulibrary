# 检索基准 — 改造分数追踪

每完成一个阶段重跑 `node tests/retrieval/harness.js`，在此追加一行。
基线详见 [BASELINE.md](BASELINE.md)。

| 阶段 | 改动摘要 | R@10 | MRR@10 | no_answer acc | 备注 |
|------|---------|-----:|-------:|--------------:|------|
| 基线 | 检索核心抽到 retrieval.js，行为零变化 | 0.764 | 0.597 | 0.000 | title_exact=1.0, cross_lang=0.538 |
