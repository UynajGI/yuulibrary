/**
 * RM3 重打分路径回归测试（hotfix for "Kubo 公式 证明" 崩溃）
 *
 * Bug：倒排路径就绪时（IndexedDB 缓存让首次查询直接走倒排），
 * retrieveContext 的 RM3 重打分调 bm25Score(expandedTokens, h.node)，
 * 但 bm25Stats(nodeIndex 统计) 从未构建 → null → 读 fieldAvgLen 崩溃。
 * 且倒排路径的 hit 是合成 node(无 _tf),用 node 打分器语义也不对。
 *
 * 修复：rescoreHit 按 hit 来源选打分器——hit.chunk 用 bm25ScoreChunk，
 * 否则用 bm25Score。同时 bm25Score 包装加惰性构建防御。
 *
 * 本测试复现崩溃路径并验证修复：
 *   searchMultiPath → rm3Expand → 对 hit 重打分 不崩 + 返回有限数
 *
 * 运行：node tests/chat/rm3-rescore.test.js
 * 依赖：static/pageindex/*.json（真实索引，确保路径真实）
 */

const path = require("path");
const fs = require("fs");
const R = require(path.join(__dirname, "..", "..", "static", "chat", "retrieval.js"));

const PAGEINDEX = path.join(__dirname, "..", "..", "static", "pageindex");
const inv = JSON.parse(fs.readFileSync(path.join(PAGEINDEX, "inverted-index.json"), "utf8"));
const chunks = JSON.parse(fs.readFileSync(path.join(PAGEINDEX, "chunks.json"), "utf8"));
const gi = JSON.parse(fs.readFileSync(path.join(PAGEINDEX, "global-index.json"), "utf8"));
const ni = JSON.parse(fs.readFileSync(path.join(PAGEINDEX, "node-index.json"), "utf8"));
const postings = inv.postings || {};
const chunkStats = R.buildChunkStats(chunks);
const nodeStats = R.buildBM25Stats(ni);

// 复现 chat.js 修复后的 rescoreHit 决策
function rescoreHit(queryTokens, hit) {
  if (hit.chunk) return R.bm25ScoreChunk(queryTokens, hit.chunk, chunkStats);
  return R.bm25Score(queryTokens, hit.node, nodeStats);
}

function main() {
  let pass = 0,
    fail = 0;
  const ok = (n, c) => {
    if (c) {
      pass++;
      console.log(`  ✓ ${n}`);
    } else {
      fail++;
      console.error(`  ✗ ${n}`);
    }
  };

  // 触发 bug 的原始查询 + 几个类似查询
  const queries = ["Kubo 公式 证明", "Berry phase", "线性响应理论", "Rabi 模型"];

  for (const q of queries) {
    // 倒排路径（触发原 bug 的路径）
    const hits = R.searchMultiPath(q, postings, chunkStats, gi, 50);
    ok(`[${q}] 倒排命中非空`, hits.length > 0);

    // RM3 扩展
    const origTokens = R.tokenize(q);
    const expanded = R.rm3Expand(origTokens, hits);

    // 重打分（原 bug 崩溃点）
    let crashed = false;
    let hasNaN = false;
    try {
      for (const h of hits) {
        const s = rescoreHit(expanded, h);
        if (isNaN(s)) hasNaN = true;
      }
    } catch (e) {
      crashed = true;
      console.error(`    崩溃: ${e.message}`);
    }
    ok(`[${q}] RM3 重打分不崩溃`, !crashed);
    ok(`[${q}] 重打分无 NaN`, !hasNaN);

    // hit 含 .chunk → 用了 chunk 打分（验证决策正确）
    if (hits.length && hits[0].chunk) {
      const chunkScore = R.bm25ScoreChunk(expanded, hits[0].chunk, chunkStats);
      ok(`[${q}] 倒排 hit 走 chunk 打分`, chunkScore > 0);
    }
  }

  // nodeIndex 路径也要不崩（node 打分器）
  {
    const hits = R.search("Berry phase", ni, nodeStats, 50);
    ok("[nodeIndex 路径] 命中非空", hits.length > 0);
    const expanded = R.rm3Expand(R.tokenize("Berry phase"), hits);
    let crashed = false;
    try {
      for (const h of hits) {
        if (!h.chunk) R.bm25Score(expanded, h.node, nodeStats);
      }
    } catch (e) {
      crashed = true;
    }
    ok("[nodeIndex 路径] RM3 重打分不崩溃", !crashed);
  }

  // 防御：bm25Score 传 null stats 不应崩（chat.js 包装的惰性构建契约）
  {
    // 纯函数层：传 null stats 会崩（设计如此），但 chat.js 包装层会惰性构建。
    // 这里验证纯函数行为：null stats 应被 chat.js 包装层拦截（已测 chat.js 源码含防御）
    const chatSrc = fs.readFileSync(
      path.join(__dirname, "..", "..", "static", "chat", "chat.js"),
      "utf8"
    );
    ok(
      "chat.js bm25Score 含惰性构建防御",
      /if \(!bm25Stats && nodeIndex\) bm25Stats = /.test(chatSrc)
    );
    ok("chat.js 含 rescoreHit", /function rescoreHit/.test(chatSrc));
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main();
