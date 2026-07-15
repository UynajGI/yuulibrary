#!/usr/bin/env node
/**
 * Yuunagi Library — Retrieval benchmark harness
 *
 * 加载 retrieval.js + node-index.json，对 golden.json 题目集跑检索管线
 * （search → RM3 → lexicalRerank，与 chat.js retrieveContext 前段一致），
 * 输出 Recall@10 / MRR@10 / 无答案准确率，按 category 与 confidence 分桶。
 *
 * 用法：
 *   node tests/retrieval/harness.js                # 跑全量，打印汇总
 *   node tests/retrieval/harness.js --verbose       # 逐题打印命中详情
 *   node tests/retrieval/harness.js --filter title_exact   # 只跑某类
 *   node tests/retrieval/harness.js --topk 20       # 改 Recall 截断（默认 10）
 *
 * 零依赖，纯 Node。与项目"无 build-step"风格一致。
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const R = require(path.join(ROOT, "static", "chat", "retrieval.js"));

// ── 加载索引 ──────────────────────────────────────────────────────────────
const nodeIndex = JSON.parse(
  fs.readFileSync(path.join(ROOT, "static", "pageindex", "node-index.json"), "utf8")
);
const golden = JSON.parse(fs.readFileSync(path.join(__dirname, "golden.json"), "utf8"));
const stats = R.buildBM25Stats(nodeIndex);

// ── 参数 ──────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const VERBOSE = argv.includes("--verbose");
const filterArg = argv[argv.indexOf("--filter") + 1];
const topkIdx = argv.indexOf("--topk");
const TOPK = topkIdx >= 0 ? parseInt(argv[topkIdx + 1], 10) : 10;

// ── 检索管线：复刻 chat.js retrieveContext 的前段（无 fetch / 无 MMR） ─────
// 返回重排后的 hits（含 rerankScore），与浏览器端一致的排序结果。
function runPipeline(query) {
  let hits = R.search(query, nodeIndex, stats, 50);
  if (!hits.length) return [];
  const origTokens = R.tokenize(query);
  const expandedTokens = R.rm3Expand(origTokens, hits);
  if (expandedTokens.length > origTokens.length) {
    for (const h of hits)
      h.score = Math.round(R.bm25Score(expandedTokens, h.node, stats) * 100) / 100;
    hits = hits.filter((h) => h.score > 0).sort((a, b) => b.score - a.score);
  }
  hits = R.lexicalRerank(origTokens, query, hits);
  return hits;
}

// ── 评测单题 ──────────────────────────────────────────────────────────────
// Recall@K：期望 doc_id 是否出现在 top-K 命中里。
// no_answer 题（expect_doc_ids 空）：期望检索结果为空或 confidence=low。
function evaluate(q) {
  const hits = runPipeline(q.query);
  const top = hits.slice(0, TOPK);
  const hitDocIds = new Set(top.map((h) => h.node.doc_id));

  if (q.expect_doc_ids.length === 0) {
    // 无答案题：无命中（或仅 confidence=low）算正确
    const topRerank = hits[0]?.rerankScore || 0;
    const sourceCount = new Set(hits.map((h) => h.node.doc_id)).size;
    const conf = R.classifyConfidence(topRerank, sourceCount);
    const correct = hits.length === 0 || conf === "low";
    return {
      correct,
      recall: correct ? 1 : 0,
      mrr: 0,
      hits: top,
      confidence: conf,
      kind: "no_answer",
    };
  }

  // 期望至少一个期望 doc 出现在 top-K
  const matched = q.expect_doc_ids.filter((id) => hitDocIds.has(id));
  const recall = matched.length > 0 ? 1 : 0;

  // MRR：第一个命中的期望 doc 的倒数排名
  let mrr = 0;
  for (let i = 0; i < top.length; i++) {
    if (q.expect_doc_ids.includes(top[i].node.doc_id)) {
      mrr = 1 / (i + 1);
      break;
    }
  }

  const topRerank = hits[0]?.rerankScore || 0;
  const sourceCount = new Set(hits.map((h) => h.node.doc_id)).size;
  const confidence = R.classifyConfidence(topRerank, sourceCount);

  return { correct: recall === 1, recall, mrr, hits: top, confidence, kind: "answerable" };
}

// ── 主流程 ────────────────────────────────────────────────────────────────
const questions = filterArg ? golden.filter((q) => q.category === filterArg) : golden;

const byBucket = {}; // key: "all" | "cat:xxx" | "conf:hard/soft"
// record：每题只调一次，避免 n 被多次累加。
function record(key, recall, mrr, correct) {
  byBucket[key] = byBucket[key] || { n: 0, recall: 0, mrr: 0, correct: 0 };
  byBucket[key].n++;
  byBucket[key].recall += recall;
  byBucket[key].mrr += mrr;
  byBucket[key].correct += correct ? 1 : 0;
}

const failures = [];
for (const q of questions) {
  const res = evaluate(q);
  const correct = res.correct ? 1 : 0;
  record("all", res.recall, res.mrr, correct);
  record("cat:" + q.category, res.recall, res.mrr, correct);
  record("conf:" + q.confidence, res.recall, res.mrr, correct);

  if (!res.correct) failures.push({ q, res });
  if (VERBOSE) {
    const top3 = res.hits
      .slice(0, 3)
      .map((h) => `${h.node.doc_id}:${h.node.node_id}(${h.rerankScore?.toFixed(2)})`)
      .join(" | ");
    const mark = res.correct ? "✓" : "✗";
    console.log(`${mark} [${q.category}:${q.confidence}] "${q.query}"`);
    console.log(`     expect: ${q.expect_doc_ids.join(",") || "(none)"} | conf=${res.confidence}`);
    console.log(`     top3: ${top3}`);
  }
}

// ── 汇总打印 ──────────────────────────────────────────────────────────────
function fmt(b) {
  if (!b) return "n/a";
  return `R@${TOPK}=${(b.recall / b.n).toFixed(3)} MRR=${(b.mrr / b.n).toFixed(3)} acc=${(b.correct / b.n).toFixed(3)} (n=${b.n})`;
}

console.log("\n═══════════════════════════════════════════════════════");
console.log(`  检索基准 (n=${questions.length}, TOPK=${TOPK})`);
console.log("═══════════════════════════════════════════════════════");
console.log(`  总体:        ${fmt(byBucket.all)}`);
console.log("\n  按 category:");
for (const k of Object.keys(byBucket)) {
  if (k.startsWith("cat:")) console.log(`    ${k.slice(4).padEnd(20)} ${fmt(byBucket[k])}`);
}
console.log("\n  按 confidence:");
for (const k of Object.keys(byBucket)) {
  if (k.startsWith("conf:")) console.log(`    ${k.slice(5).padEnd(20)} ${fmt(byBucket[k])}`);
}

// 失败汇总（非 verbose 时只列前 20 个 hard 失败）
const hardFails = failures.filter((f) => f.q.confidence === "hard");
if (hardFails.length) {
  console.log(
    `\n  ⚠ hard 题失败 (${hardFails.length}/${questions.filter((q) => q.confidence === "hard").length}):`
  );
  for (const f of hardFails.slice(0, 20)) {
    const top1 = f.res.hits[0];
    console.log(
      `    ✗ [${f.q.category}] "${f.q.query}" expect=${f.q.expect_doc_ids.join(",")} ` +
        `got=${top1 ? top1.node.doc_id : "(empty)"} conf=${f.res.confidence}`
    );
  }
}
console.log("");
