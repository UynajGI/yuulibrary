/**
 * Yuunagi Library — Retrieval core (pure, testable)
 *
 * Extracted from chat.js so the lexical RAG pipeline (tokenizer → BM25 →
 * rerank → MMR) can be unit-tested and benchmarked under Node without a DOM.
 *
 * 无 build-step / 无 npm: UMD-ish — works as a global in the browser
 * (`globalThis.YuuRetrieval`) and as a CommonJS module under Node.
 *
 * 所有函数为纯函数或有显式入参：index/stats 作为参数传入，不持有闭包状态。
 * 行为与原 chat.js 内联实现保持一致（阶段 0 只解耦，不改行为）。
 */
(function (root) {
  "use strict";

  // ══════════════════════════════════════════════════════════════════════════
  // Tokenizer：中文 2-gram + 英文单词。不保留中文单字（噪声太大、IDF 失效）。
  // ══════════════════════════════════════════════════════════════════════════
  // 注意：末尾去重（与原实现一致）——这是阶段 2 要修的 BM25 TF 失真来源，
  // 阶段 0 保持原样以建立可对比基线。
  function tokenize(text) {
    if (!text) return [];
    const tokens = [];
    // 英文单词（长度 ≥2，含术语缩写如 SPT/Rabi）+ 纯数字 ≥2
    for (const w of text.match(/[a-zA-Z][a-zA-Z0-9]{1,}/g) || []) tokens.push(w.toLowerCase());
    for (const w of text.match(/\d{2,}/g) || []) tokens.push(w);
    // 中文：仅 2-gram。"相变""临界""金融"等二字词才是有效检索单元。
    const cjk = text.match(/[一-鿿]+/g) || [];
    for (const seg of cjk) {
      for (let i = 0; i < seg.length - 1; i++) tokens.push(seg.slice(i, i + 2)); // 2-gram
    }
    return [...new Set(tokens)];
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Query expansion：手写同义词表 + 运行时从 terms/headings 抽取 ──────────
  // 手写表覆盖常见物理/ML 术语的中英互译与缩写。运行时表在索引加载后构建。
  // ══════════════════════════════════════════════════════════════════════════
  const SYNONYMS = {
    超辐射相变: ["superradiant phase transition", "SPT", "superradiant"],
    相变: ["phase transition", "critical", "临界"],
    临界: ["critical", "相变", "phase transition"],
    berry: ["berry phase", "贝里相位", "几何相位"],
    贝里: ["berry phase", "geometric phase", "几何相位"],
    rabi: ["拉比", "jaynes-cummings", "JC"],
    拉比: ["rabi", "jaynes-cummings"],
    dicke: ["迪克", "superradiant"],
    线性响应: ["linear response", "kubo", "久保"],
    格林函数: ["green function", "propagator", "传播子"],
    路径积分: ["path integral", "feynman"],
    机器学习: ["machine learning", "ML", "deep learning"],
    神经网络: ["neural network", "NN", "deep learning"],
  };

  // expandQuery 同时接受原始 query（用于多字短语匹配）和 tokens（用于单 token 匹配）
  function expandQuery(tokens, rawQuery) {
    const expanded = new Set(tokens);
    const raw = (rawQuery || "").toLowerCase();
    for (const key of Object.keys(SYNONYMS)) {
      const lk = key.toLowerCase();
      // 匹配方式 1: 原始 query 包含该短语（如"超辐射相变"包含"相变"）
      // 匹配方式 2: tokens 已含该短语作为 token（如英文 "rabi"）
      if (raw.includes(lk) || tokens.includes(lk)) {
        SYNONYMS[key].forEach((s) => expanded.add(s.toLowerCase()));
      }
    }
    return [...expanded];
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BM25：字段加权 + IDF。首次搜索时构建 IDF 与字段长度统计。
  // ══════════════════════════════════════════════════════════════════════════
  // 字段权重：title 最高，breadcrumb 次之，terms/summary 正常
  const FIELD_BOOST = { title: 6, breadcrumb: 3, terms: 2, summary: 2 };
  const BM25_K = 1.5,
    BM25_B = 0.75;
  // summary 字段（LLM 摘要）权重高于旧 excerpt；兼容旧索引（fallback 到 excerpt）
  const FIELDS = ["title", "breadcrumb", "terms", "summary"];

  // 纯函数版：接收 nodeIndex，返回 stats（不写闭包）。
  function buildBM25Stats(nodeIndex) {
    if (!nodeIndex) return null;
    const nodes = nodeIndex.nodes || [];
    const df = new Map(); // document frequency per token
    let totalLen = 0;
    const fieldLen = { title: 0, breadcrumb: 0, terms: 0, summary: 0 };
    for (const node of nodes) {
      const fieldText = {
        title: node.title || "",
        breadcrumb: (node.breadcrumb || []).join(" "),
        terms: (node.terms || []).join(" "),
        summary: node.summary || node.excerpt || "", // fallback 旧索引
      };
      for (const f of FIELDS) {
        const toks = tokenize(fieldText[f]);
        fieldLen[f] += toks.length;
        for (const t of new Set(toks)) df.set(t, (df.get(t) || 0) + 1);
      }
      totalLen += tokenize(
        fieldText.title + fieldText.breadcrumb + fieldText.terms + fieldText.summary
      ).length;
    }
    const N = nodes.length || 1;
    return {
      df,
      N,
      avgLen: totalLen / N,
      fieldAvgLen: {
        title: fieldLen.title / N,
        breadcrumb: fieldLen.breadcrumb / N,
        terms: fieldLen.terms / N,
        summary: fieldLen.summary / N,
      },
    };
  }

  function bm25Score(queryTokens, node, stats) {
    let total = 0;
    const fieldText = {
      title: node.title || "",
      breadcrumb: (node.breadcrumb || []).join(" "),
      terms: (node.terms || []).join(" "),
      summary: node.summary || node.excerpt || "",
    };
    for (const f of FIELDS) {
      const docTokens = tokenize(fieldText[f]);
      const docLen = docTokens.length;
      const avgLen = stats.fieldAvgLen[f] || 1;
      const tfMap = new Map();
      for (const t of docTokens) tfMap.set(t, (tfMap.get(t) || 0) + 1);
      for (const qt of queryTokens) {
        const tf = tfMap.get(qt) || 0;
        if (!tf) continue;
        const df = stats.df.get(qt) || 0;
        const idf = Math.log(1 + (stats.N - df + 0.5) / (df + 0.5));
        const norm = 1 - BM25_B + BM25_B * (docLen / (avgLen || 1));
        const score = idf * ((tf * (BM25_K + 1)) / (tf + BM25_K * norm));
        total += score * FIELD_BOOST[f];
      }
    }
    return total;
  }

  // 纯函数 search：接收 nodeIndex + stats（stats 可省略，内部按需构建）。
  // 返回 [{node, score, tokens, positions}]，已按 score 降序 + per-doc 截断。
  function search(query, nodeIndex, stats, topK = 50) {
    if (!nodeIndex) return [];
    if (!stats) stats = buildBM25Stats(nodeIndex);
    let tokens = tokenize(query);
    if (!tokens.length) return [];
    tokens = expandQuery(tokens, query);
    const scored = [];
    for (const node of nodeIndex.nodes) {
      const s = bm25Score(tokens, node, stats);
      if (s > 0) {
        const score = Math.round(s * 100) / 100;
        // 附加 query token 在各字段的位置（供 lexicalRerank 算 proximity）
        const positions = {};
        const fieldTokens = {
          title: tokenize(node.title || ""),
          breadcrumb: tokenize((node.breadcrumb || []).join(" ")),
          terms: tokenize((node.terms || []).join(" ")),
          summary: tokenize(node.summary || node.excerpt || ""),
        };
        for (const qt of tokens) {
          for (const f in fieldTokens) {
            const idx = fieldTokens[f].indexOf(qt);
            if (idx >= 0) {
              if (!positions[qt]) positions[qt] = {};
              positions[qt][f] = idx;
            }
          }
        }
        scored.push({ node, score, tokens, positions });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    const docCount = new Map(), // per-doc 命中计数（修复：原 Set 去重导致限制失效）
      results = [];
    for (const item of scored) {
      const c = docCount.get(item.node.doc_id) || 0;
      if (c < 3) {
        results.push(item);
        docCount.set(item.node.doc_id, c + 1);
      }
      if (results.length >= topK * 2) break;
    }
    return results.slice(0, topK);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 正文 chunk 倒排检索（阶段 1）
  // query token → postings → 只对含这些 token 的 chunk 打分，不再全量遍历。
  // 让正文深处的事实可被第一阶段命中（修复 summary 截断导致正文不可搜）。
  // ══════════════════════════════════════════════════════════════════════════

  // buildChunkStats：从 chunks 构建统计（avgBodyLen / df / N）。
  // chunks: [{chunk_id, body, title, breadcrumb, ...}]
  function buildChunkStats(chunks) {
    if (!chunks) return null;
    const list = chunks.chunks || chunks;
    const df = new Map();
    let totalLen = 0;
    for (const ch of list) {
      // DF 按 chunk（合并 title+breadcrumb+body 去重后）
      const combined = `${ch.title || ""} ${(ch.breadcrumb || []).join(" ")} ${ch.body || ""}`;
      const toks = tokenize(combined);
      for (const t of new Set(toks)) df.set(t, (df.get(t) || 0) + 1);
      totalLen += toks.length;
    }
    const N = list.length || 1;
    return { df, N, avgLen: totalLen / N, chunks: list };
  }

  // chunk 的 BM25（单字段近似：title+breadcrumb+body 合并，标题权重靠 build 时已并入）
  // 注：阶段 2 会引入真正的多字段 BM25F；此处先让正文可搜，字段加权暂简化。
  function bm25ScoreChunk(queryTokens, chunk, stats) {
    const combined = `${chunk.title || ""} ${(chunk.breadcrumb || []).join(" ")} ${chunk.body || ""}`;
    const docTokens = tokenize(combined);
    const docLen = docTokens.length;
    const tfMap = new Map();
    for (const t of docTokens) tfMap.set(t, (tfMap.get(t) || 0) + 1);
    let total = 0;
    for (const qt of queryTokens) {
      const tf = tfMap.get(qt) || 0;
      if (!tf) continue;
      const df = stats.df.get(qt) || 0;
      const idf = Math.log(1 + (stats.N - df + 0.5) / (df + 0.5));
      const norm = 1 - BM25_B + BM25_B * (docLen / (stats.avgLen || 1));
      total += idf * ((tf * (BM25_K + 1)) / (tf + BM25_K * norm));
    }
    return total;
  }

  // searchInverted：用倒排 postings 检索，只遍历含 query token 的 chunk。
  // postings: {token: [[cid_num, tf], ...]}
  // chunkStats: buildChunkStats() 的返回（含 chunks 数组，按 cid_num 索引）
  // 返回与 search() 兼容的 [{node, score, tokens, positions, chunk}] 结构，
  // node 字段从 chunk 元数据合成（供 lexicalRerank / 上层复用）。
  function searchInverted(query, postings, chunkStats, topK = 50) {
    if (!postings || !chunkStats) return [];
    let tokens = tokenize(query);
    if (!tokens.length) return [];
    tokens = expandQuery(tokens, query);

    // 收集候选 chunk_id → 命中 token 数
    const candIds = new Map(); // cid_num → hitCount
    for (const qt of tokens) {
      const plist = postings[qt];
      if (!plist) continue;
      for (const [cidNum] of plist) {
        candIds.set(cidNum, (candIds.get(cidNum) || 0) + 1);
      }
    }
    if (!candIds.size) return [];

    // cid_num → chunk 索引表（chunk_id 形如 c000001，cid_num = parseInt(slice)）
    // 预建一次：cidMap[num] = chunk
    if (!chunkStats._cidMap) {
      const m = new Map();
      for (const ch of chunkStats.chunks) {
        const cid = ch.chunk_id || "";
        if (cid.startsWith("c")) {
          const num = parseInt(cid.slice(1), 10);
          if (!isNaN(num)) m.set(num, ch);
        }
      }
      chunkStats._cidMap = m;
    }
    const cidMap = chunkStats._cidMap;

    const scored = [];
    for (const cidNum of candIds.keys()) {
      const chunk = cidMap.get(cidNum);
      if (!chunk) continue;
      const s = bm25ScoreChunk(tokens, chunk, chunkStats);
      if (s > 0) {
        const score = Math.round(s * 100) / 100;
        // 合成 node（供上层 lexicalRerank / doc_id 聚合复用）
        const node = {
          doc_id: chunk.doc_id,
          node_id: chunk.node_id,
          title: chunk.title,
          breadcrumb: chunk.breadcrumb,
          url: "",
          terms: [],
          summary: chunk.body.slice(0, 200), // chunk body 首段作 summary 兜底
          line_num: chunk.line_num,
        };
        // positions：token 在 title/breadcrumb/body 中的首次位置
        const positions = {};
        const titleToks = tokenize(chunk.title || "");
        const bcToks = tokenize((chunk.breadcrumb || []).join(" "));
        const bodyToks = tokenize(chunk.body || "");
        for (const qt of tokens) {
          const ti = titleToks.indexOf(qt),
            bi = bcToks.indexOf(qt),
            si = bodyToks.indexOf(qt);
          if (ti >= 0 || bi >= 0 || si >= 0) {
            positions[qt] = {};
            if (ti >= 0) positions[qt].title = ti;
            if (bi >= 0) positions[qt].breadcrumb = bi;
            if (si >= 0) positions[qt].summary = si; // 复用 summary 字段位
          }
        }
        scored.push({ node, score, tokens, positions, chunk });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    // per-doc 截断（与 search() 一致：每 doc 最多 3 个）
    const docCount = new Map(),
      results = [];
    for (const item of scored) {
      const c = docCount.get(item.node.doc_id) || 0;
      if (c < 3) {
        results.push(item);
        docCount.set(item.node.doc_id, c + 1);
      }
      if (results.length >= topK * 2) break;
    }
    return results.slice(0, topK);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RM3 伪相关反馈 + 词法精排 + MMR 去冗余 + token budget
  // ══════════════════════════════════════════════════════════════════════════

  // ── RM3 伪相关反馈：用 BM25 top-M 当反馈集扩展 query term ──────────────────
  // 对短 query / 词面不匹配的场景提升召回质量。返回扩展后的 token 数组。
  function rm3Expand(queryTokens, hits) {
    const M = 10, // 反馈文档数
      topExpansions = 15; // 扩展 term 上限
    const topM = hits.slice(0, M);
    if (!topM.length) return queryTokens;
    // 统计 topM 里每个 term 的加权频次（用 BM25 score 加权）
    const termScores = {};
    for (const h of topM) {
      const n = h.node;
      const text = `${n.title || ""} ${(n.terms || []).join(" ")} ${n.summary || n.excerpt || ""}`;
      const tks = tokenize(text);
      for (const t of tks) termScores[t] = (termScores[t] || 0) + h.score;
    }
    const expanded = Object.entries(termScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topExpansions)
      .map((x) => x[0]);
    // 原始 tokens 优先（RM3 插值，原始权重 α=0.4，但合并时保持原始在前）
    return [...new Set([...queryTokens, ...expanded])];
  }

  // ── 词法精排：proximity + phrase + coverage 三信号 + BM25 归一化加权 ────────
  // 各子分 min-max 归一化到 [0,1]，加权求和。权重：bm25 0.5, prox 0.2, phrase 0.2, cov 0.1
  const RERANK_WEIGHTS = { bm25: 0.5, prox: 0.2, phrase: 0.2, cov: 0.1 };

  function lexicalRerank(queryTokens, rawQuery, hits) {
    if (!hits.length) return hits;
    // 计算各子分
    const sub = hits.map((h) => {
      const posSet = h.positions || {};
      // (a) proximity：按字段分别算 query tokens 的最小跨度，取最优字段。
      //     跨字段位置不可比（title[0] vs excerpt[50] 无意义），必须同字段内算。
      let bestProx = 0;
      for (const f of ["title", "breadcrumb", "terms", "summary"]) {
        const positionsInField = [];
        for (const qt of queryTokens) {
          const p = posSet[qt]?.[f];
          if (p !== undefined) positionsInField.push(p);
        }
        if (positionsInField.length >= 2) {
          const span = Math.max(...positionsInField) - Math.min(...positionsInField);
          const score = 1 / (span + 1);
          if (score > bestProx) bestProx = score;
        }
      }
      if (bestProx === 0) {
        // 只命中单个 token，给基础分
        const anyHit = Object.values(posSet).some((fp) => Object.keys(fp).length > 0);
        bestProx = anyHit ? 0.2 : 0;
      }
      // (b) phrase：检查 query 的连续片段是否在 title/breadcrumb 精确出现。
      //     中文：用 2 字滑窗子串（"线性响应"→"线性/性响/响应/应理/理论"），
      //     因为 2-gram token 拼接 "线性 性响" 无法匹配原文，必须用原文子串。
      //     英文：用 token bigram（"berry phase"）匹配。
      const titleText = (
        (h.node.title || "") +
        " " +
        (h.node.breadcrumb || []).join(" ")
      ).toLowerCase();
      let phraseHits = 0,
        phraseTotal = 0;
      // 中文 2 字滑窗
      const cjkPart = (rawQuery.match(/[一-鿿]+/g) || []).join("");
      for (let i = 0; i <= cjkPart.length - 2; i++) {
        phraseTotal++;
        if (titleText.includes(cjkPart.slice(i, i + 2).toLowerCase())) phraseHits++;
      }
      // 英文 token bigram
      const enTokens = rawQuery.toLowerCase().match(/[a-z][a-z0-9]{1,}/g) || [];
      for (let i = 0; i < enTokens.length - 1; i++) {
        phraseTotal++;
        if (titleText.includes(enTokens[i] + " " + enTokens[i + 1])) phraseHits++;
      }
      const phraseScore = phraseTotal ? Math.min(phraseHits / phraseTotal, 1) : 0;
      // (c) coverage：命中 query token 数 / 总 query token 数
      const hitTk = new Set();
      for (const qt of queryTokens) if (posSet[qt]) hitTk.add(qt);
      const covScore = queryTokens.length ? hitTk.size / queryTokens.length : 0;
      return { h, bm25: h.score, prox: bestProx, phrase: phraseScore, cov: covScore };
    });
    // min-max 归一化各子分
    const norm = (key) => {
      const vals = sub.map((s) => s[key]);
      const mn = Math.min(...vals),
        mx = Math.max(...vals);
      const range = mx - mn || 1;
      for (const s of sub) s["_" + key] = (s[key] - mn) / range;
    };
    norm("bm25");
    norm("prox");
    norm("phrase");
    // coverage 已经是 [0,1]，无需归一化
    // 加权求和 → rerankScore
    for (const s of sub) {
      s.h.rerankScore =
        RERANK_WEIGHTS.bm25 * s._bm25 +
        RERANK_WEIGHTS.prox * s._prox +
        RERANK_WEIGHTS.phrase * s._phrase +
        RERANK_WEIGHTS.cov * s.cov;
    }
    return sub.map((s) => s.h).sort((a, b) => b.rerankScore - a.rerankScore);
  }

  // ── MMR 去冗余：4-gram shingle Jaccard，贪心选 top-N ──────────────────────
  // λ=0.6 偏相关但保留多样性。contexts 须已按 rerankScore 降序，且含 .text
  function shingle(text, k = 4) {
    const tokens = tokenize(text);
    if (tokens.length < k) return new Set(tokens);
    const shingles = new Set();
    for (let i = 0; i <= tokens.length - k; i++) shingles.add(tokens.slice(i, i + k).join(" "));
    return shingles;
  }

  function jaccard(setA, setB) {
    if (!setA.size || !setB.size) return 0;
    let inter = 0;
    for (const s of setA) if (setB.has(s)) inter++;
    return inter / (setA.size + setB.size - inter);
  }

  function mmrSelect(contexts, lambda = 0.6, maxChunks = 8) {
    if (contexts.length <= 1) return contexts;
    // 预计算 shingle
    for (const c of contexts) c._shingle = shingle(c.text || "");
    const selected = [contexts[0]], // 第一个（最高分）直接选
      remaining = contexts.slice(1);
    while (selected.length < maxChunks && remaining.length) {
      let bestIdx = 0,
        bestScore = -Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const cand = remaining[i];
        let maxSim = 0;
        for (const s of selected) {
          const sim = jaccard(cand._shingle, s._shingle);
          if (sim > maxSim) maxSim = sim;
        }
        const mmr = lambda * (cand.rerankScore || 0) - (1 - lambda) * maxSim;
        if (mmr > bestScore) {
          bestScore = mmr;
          bestIdx = i;
        }
      }
      selected.push(remaining.splice(bestIdx, 1)[0]);
    }
    return selected;
  }

  // ── Token 估算 + 感知历史的 budget packing ────────────────────────────────
  // 近似：中文 chars/1.5，英文 chars/4
  function estimateTokens(text) {
    if (!text) return 0;
    const cjk = (text.match(/[一-鿿]/g) || []).length;
    const other = text.length - cjk;
    return Math.ceil(cjk / 1.5 + other / 4);
  }

  // ── Confidence 分级（与原 chat.js retrieveContext 末段一致） ──────────────
  // 输入：rerankScore 已归一化的 top1、uniqueDocs 命中数。
  function classifyConfidence(topRerank, sourceCount) {
    if (topRerank >= 0.6 && sourceCount >= 2) return "high";
    if (topRerank >= 0.3 || (topRerank >= 0.15 && sourceCount >= 2)) return "medium";
    return "low";
  }

  const Retrieval = {
    tokenize,
    SYNONYMS,
    expandQuery,
    buildBM25Stats,
    bm25Score,
    search,
    buildChunkStats,
    bm25ScoreChunk,
    searchInverted,
    rm3Expand,
    lexicalRerank,
    RERANK_WEIGHTS,
    FIELD_BOOST,
    FIELDS,
    shingle,
    jaccard,
    mmrSelect,
    estimateTokens,
    classifyConfidence,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Retrieval;
  else root.YuuRetrieval = Retrieval;
})(typeof globalThis !== "undefined" ? globalThis : this);
