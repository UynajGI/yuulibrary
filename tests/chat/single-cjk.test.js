/**
 * 单 CJK 字符查询回退（#11）测试
 *
 * 验证：单字查询（如"自"）不再返回空结果，而是回退到子串线性匹配。
 * 同时验证：正常多字查询不受影响（仍走 BM25）。
 *
 * 运行：node tests/chat/single-cjk.test.js
 */

const path = require("path");
const R = require(path.join(__dirname, "..", "..", "static", "chat", "retrieval.js"));

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

  // 构造测试 nodeIndex（含 CJK 标题）
  const nodeIndex = {
    nodes: [
      {
        doc_id: "d1",
        node_id: "n1",
        title: "量子自旋",
        breadcrumb: ["物理", "量子"],
        terms: ["自旋"],
        summary: "自旋是粒子的内禀角动量",
      },
      {
        doc_id: "d2",
        node_id: "n2",
        title: "线性代数",
        breadcrumb: ["数学"],
        terms: [],
        summary: "向量空间与线性变换",
      },
      {
        doc_id: "d3",
        node_id: "n3",
        title: "自由能",
        breadcrumb: ["热力学"],
        terms: [],
        summary: "热力学自由能",
      },
    ],
  };

  // 用例 1：单字"自"应命中 d1（自旋）和 d3（自由能），不命中 d2
  {
    const hits = R.search("自", nodeIndex, null, 50);
    const docIds = hits.map((h) => h.node.doc_id);
    ok("1a 单字'自'返回非空", hits.length > 0);
    ok("1b 命中含'自'的 d1", docIds.includes("d1"));
    ok("1c 命中含'自'的 d3", docIds.includes("d3"));
    ok("1d 不命中无'自'的 d2", !docIds.includes("d2"));
    // title 命中权重高于 summary：d1 title 含"自"，d3 title 含"自"
    ok("1e 有分数", hits[0].score > 0);
  }

  // 用例 2：单字"旋"只命中 d1
  {
    const hits = R.search("旋", nodeIndex, null, 50);
    const docIds = hits.map((h) => h.node.doc_id);
    ok("2 单字'旋'只命中 d1", docIds.length === 1 && docIds[0] === "d1");
  }

  // 用例 3：多字查询仍走正常 BM25（不受回退影响）
  {
    const hits = R.search("量子自旋", nodeIndex, null, 50);
    ok("3 多字查询仍返回结果", hits.length > 0);
    const docIds = hits.map((h) => h.node.doc_id);
    ok("3b 多字查询命中 d1", docIds.includes("d1"));
  }

  // 用例 4：英文单字符不触发 CJK 回退（"a" 不是 CJK）
  {
    const hits = R.searchSingleCJK("a", nodeIndex, 50);
    ok("4 英文单字符不触发 CJK 回退", hits.length === 0);
  }

  // 用例 5：chunk 版回退（searchSingleCJKChunk）
  {
    const chunkStats = {
      chunks: [
        {
          chunk_id: "c1",
          doc_id: "d1",
          node_id: "n1",
          title: "自旋",
          breadcrumb: ["物"],
          body: "自旋量子数",
          line_num: 1,
        },
        {
          chunk_id: "c2",
          doc_id: "d2",
          node_id: "n2",
          title: "向量",
          breadcrumb: ["数"],
          body: "向量空间",
          line_num: 1,
        },
      ],
    };
    const hits = R.searchSingleCJKChunk("自", chunkStats, 50);
    ok("5 chunk 版单字回退命中含'自'的 chunk", hits.length === 1 && hits[0].node.doc_id === "d1");
  }

  // 用例 6：searchInverted 单字也走回退
  {
    const chunkStats = {
      chunks: [
        {
          chunk_id: "c1",
          doc_id: "d1",
          node_id: "n1",
          title: "自旋",
          breadcrumb: [],
          body: "自旋",
          line_num: 1,
        },
      ],
    };
    const hits = R.searchInverted("自", {}, chunkStats, 50);
    ok("6 searchInverted 单字走 chunk 回退", hits.length === 1 && hits[0].node.doc_id === "d1");
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main();
