# 检索 Golden Benchmark

RAG 检索核心(`static/chat/retrieval.js` + `scripts/build_pageindex.py`)的量化评测集。
改检索逻辑后必须重跑,对比 [`RESULTS.md`](RESULTS.md) 的分数趋势——不能只凭"模块名齐了"判断成熟。

## 用法

```bash
node tests/retrieval/harness.js                              # 全量,打印汇总
node tests/retrieval/harness.js --verbose                     # 逐题打印命中详情
node tests/retrieval/harness.js --filter cross_language       # 只跑某类
node tests/retrieval/harness.js --topk 20                     # 改 Recall 截断(默认 10)
NO_INVERTED=1 node tests/retrieval/harness.js                 # 回退线性 BM25(对比)
```

零依赖,纯 Node(与项目"无 build-step"风格一致)。

## 指标

- **Recall@10**:期望 doc_id 是否出现在 top-10 命中里(文档级)
- **MRR@10**:第一个命中的期望 doc 的倒数排名
- **no_answer 准确率**:无答案题(图书馆无此主题)是否被判为 low confidence 或无命中
- 按 **category**(12 类)和 **confidence**(hard/soft ground truth)分桶

## 题目集(`golden.json`)

148 题,覆盖 12 类检索场景:

| 类别 | 示例 | 说明 |
|------|------|------|
| title_exact | `Kubo 公式的证明` | 标题精确含查询词 |
| cross_language | `久保公式` ↔ Kubo | 中英术语转换 |
| acronym | `SPT` ↔ superradiant phase transition | 缩写↔全称 |
| synonym_rewrite | `怎样实验测出几何相位` | 口语化改写 |
| deep_body | `双精度算术 17 位精度 条件数` | 正文 200 字后的事实(核心验证题) |
| multi_doc | `两种 wormhole QMC 方法` | 跨文档比较 |
| multi_hop | `为什么 Suzuki-Trotter 适用于路径积分` | 组合推理 |
| context_followup | `它和前面的方法区别` | 纯指代(预期差) |
| no_answer | `火星地质构造` | 图书馆无此主题 |
| fuzzy | `那篇讲自旋映射到玻色子的文章` | 模糊描述 |
| concept | `Black-Scholes 期权定价` | 概念查询 |
| typo | `Kubu 公式` | 拼写错误 |

### 加题

编辑 `golden.json`,每题字段:
```json
{
  "id": "unique_id",
  "category": "title_exact",
  "query": "查询文本",
  "expect_doc_ids": ["doc-slug"],   // 空 [] = no_answer 题
  "confidence": "hard",             // hard=可机械锚定, soft=启发式
  "note": "可选说明"
}
```

- **hard**:ground truth 确定(标题精确/已知节点 ID),指标可信
- **soft**:ground truth 启发式锚定,review 时可收紧

## 文件

- `harness.js` — 评测脚手架(加载 retrieval.js + 索引,跑管线,算指标)
- `golden.json` — 题目集
- `BASELINE.md` — 重构前基线分数(R@10=0.764)
- `RESULTS.md` — 每阶段改造的分数追踪表
