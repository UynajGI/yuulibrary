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
  // tokenizeUnique：去重（DF / coverage / postings 用）——与索引构建期一致。
  // tokenize：保留重复（BM25 TF 用）——阶段 2 修复 TF 恒为 1 的失真。
  function tokenizeRaw(text) {
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
    return tokens;
  }

  // tokenize：保留重复（BM25 真实 TF 用）。别名 tokenizeWithFrequency。
  const tokenize = tokenizeRaw;

  // tokenizeUnique：去重保持序（DF / coverage / postings 候选收集用）。
  function tokenizeUnique(text) {
    const tokens = tokenizeRaw(text);
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
    量子蒙特卡洛: ["quantum monte carlo", "QMC"],
    蒙特卡洛: ["monte carlo", "MC"],
    密度矩阵重整化群: ["density matrix renormalization group", "DMRG"],
    张量网络: ["tensor network", "MPS", "MPO"],
    矩阵乘积态: ["matrix product state", "MPS"],
    贝里相位: ["berry phase", "geometric phase"],
    几何相位: ["geometric phase", "berry phase", "贝里相位"],
    耗散: ["dissipation", "dissipative"],
    相干态: ["coherent state"],
    压缩态: ["squeezed state"],
    自旋: ["spin"],
    玻色: ["boson", "bose"],
    玻色子: ["boson", "bose"],
    费米: ["fermi", "fermion"],
    费米子: ["fermi", "fermion"],
    哈密顿: ["hamiltonian", "hamilton"],
    拉格朗日: ["lagrangian"],
    配分函数: ["partition function"],
    基态: ["ground state"],
    激发态: ["excited state"],
    绝热: ["adiabatic"],
    厄米: ["hermitian"],
    幺正: ["unitary"],
    统计力学: ["statistical mechanics"],
    量子场论: ["quantum field theory", "QFT"],
    规范场: ["gauge field"],
    对称性: ["symmetry"],
    拓扑: ["topological", "topology"],
    纠缠: ["entanglement", "entangled"],
    退相干: ["decoherence"],
    量子比特: ["qubit", "quantum bit"],
    量子门: ["quantum gate"],
    量子算法: ["quantum algorithm"],
    变分: ["variational"],
    微扰: ["perturbation", "perturbative"],
    关联函数: ["correlation function"],
    谱函数: ["spectral function"],
    响应函数: ["response function"],
    极化率: ["polarizability", "susceptibility"],
    磁化率: ["susceptibility", "magnetic susceptibility"],
    期权: ["option"],
    期货: ["future", "futures"],
    对冲: ["hedge", "hedging"],
    波动率: ["volatility"],
    套利: ["arbitrage", "arb"],
    回撤: ["drawdown"],
    动量: ["momentum"],
    均值回复: ["mean reversion"],
    协整: ["cointegration"],
    交叉验证: ["cross validation"],
    过拟合: ["overfitting", "overfit"],
    正则化: ["regularization"],
    梯度: ["gradient"],
    反向传播: ["backpropagation", "backprop"],
    激活函数: ["activation function"],
    损失函数: ["loss function"],
    优化器: ["optimizer"],
  };

  // expandQuery：同义词扩展必须先过统一 tokenizer（修复"linear response"当单 token 的 bug）。
  // 多词同义词（如 "linear response"）会被 tokenize 成 ["linear","response"]，
  // 与索引中的 token 一致，才能真正匹配。
  // 返回 [tokens]。权重版见 expandQueryWeighted（原始 token 1.0，同义词 0.6）。
  function expandQuery(tokens, rawQuery) {
    return expandQueryWeighted(tokens, rawQuery).tokens;
  }

  // 权重配置：原始 token 1.0，同义词扩展 0.6（避免同义词稀释精确匹配）。
  const SYNONYM_WEIGHT = 0.6;

  function expandQueryWeighted(tokens, rawQuery) {
    const weights = new Map(); // token → weight（取最大值，原始优先）
    for (const t of tokens) weights.set(t, 1.0);
    const raw = (rawQuery || "").toLowerCase();
    for (const key of Object.keys(SYNONYMS)) {
      const lk = key.toLowerCase();
      if (raw.includes(lk) || tokens.includes(lk)) {
        for (const s of SYNONYMS[key]) {
          // 关键修复：同义词也走 tokenizer，多词短语拆成可匹配的 token
          for (const t of tokenizeUnique(s)) {
            // 原始 token 权重保留（不被同义词稀释）；新 token 给 SYNONYM_WEIGHT
            if (!weights.has(t)) weights.set(t, SYNONYM_WEIGHT);
          }
        }
      }
    }
    return { tokens: [...weights.keys()], weights };
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

  function bm25Score(queryTokens, node, stats, weights) {
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
        const w = weights ? weights.get(qt) || 0 : 1;
        total += score * FIELD_BOOST[f] * w;
      }
    }
    return total;
  }

  // 纯函数 search：接收 nodeIndex + stats（stats 可省略，内部按需构建）。
  // 返回 [{node, score, tokens, positions}]，已按 score 降序 + per-doc 截断。
  function search(query, nodeIndex, stats, topK = 50) {
    if (!nodeIndex) return [];
    if (!stats) stats = buildBM25Stats(nodeIndex);
    // 候选收集用 unique（成员关系即可）；bm25Score 内部用带频次 tokenize（真实 TF）
    let tokens = tokenizeUnique(query);
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

  // buildChunkStats：从 chunks 构建统计（per-field avgLen / df / N）+ 预计算每 chunk 的
  // 字段 TF map（避免查询时重复 tokenize——这是性能关键，42k chunk × 3 字段）。
  // chunks: [{chunk_id, body, title, breadcrumb, ...}]
  function buildChunkStats(chunks) {
    if (!chunks) return null;
    const list = chunks.chunks || chunks;
    const df = new Map();
    const fieldLen = { title: 0, breadcrumb: 0, body: 0 };
    for (const ch of list) {
      // DF 按 chunk（合并 title+breadcrumb+body 去重后）——正确 DF 语义
      const titleToks = tokenize(ch.title || "");
      const bcToks = tokenize((ch.breadcrumb || []).join(" "));
      const bodyToks = tokenize(ch.body || "");
      fieldLen.title += titleToks.length;
      fieldLen.breadcrumb += bcToks.length;
      fieldLen.body += bodyToks.length;
      // 预计算每字段的 TF map（查询期 bm25ScoreChunk 直接查表，不再 tokenize）
      const tfMap = (map, toks) => {
        for (const t of toks) map.set(t, (map.get(t) || 0) + 1);
        return map;
      };
      ch._tf = {
        title: tfMap(new Map(), titleToks),
        breadcrumb: tfMap(new Map(), bcToks),
        body: tfMap(new Map(), bodyToks),
        _len: { title: titleToks.length, breadcrumb: bcToks.length, body: bodyToks.length },
      };
      // 合并去重后算 DF（一个 chunk 内某 token 只算 1 次，无论在几个字段出现）
      const allToks = new Set([...titleToks, ...bcToks, ...bodyToks]);
      for (const t of allToks) df.set(t, (df.get(t) || 0) + 1);
    }
    const N = list.length || 1;
    return {
      df,
      N,
      avgLen: (fieldLen.title + fieldLen.breadcrumb + fieldLen.body) / N,
      fieldAvgLen: {
        title: fieldLen.title / N,
        breadcrumb: fieldLen.breadcrumb / N,
        body: fieldLen.body / N,
      },
      chunks: list,
    };
  }

  // chunk 多字段 BM25F（阶段 2）：title/breadcrumb/body 分字段打分 + 字段权重。
  // 标题命中权重最高（恢复阶段 1 丢失的字段加权）。
  // CHUNK_FIELD_BOOST：title 6 / breadcrumb 3 / body 1（与 node-index BM25F 对齐）。
  // weights（阶段 3）：可选 Map<token, weight>，同义词 token 权重低，避免稀释精确匹配。
  const CHUNK_FIELD_BOOST = { title: 6, breadcrumb: 3, body: 1 };

  function bm25ScoreChunk(queryTokens, chunk, stats, weights) {
    // 阶段 7：用 buildChunkStats 预计算的 _tf map（避免每次查询重复 tokenize 42k chunk）
    const tf = chunk._tf;
    let total = 0;
    for (const f of ["title", "breadcrumb", "body"]) {
      const tfMap = tf?.[f];
      if (!tfMap) continue; // 无预计算时跳过（不应发生）
      const docLen = tf._len[f];
      const avgLen = stats.fieldAvgLen?.[f] || stats.avgLen || 1;
      for (const qt of queryTokens) {
        const tfreq = tfMap.get(qt) || 0;
        if (!tfreq) continue;
        const df = stats.df.get(qt) || 0;
        const idf = Math.log(1 + (stats.N - df + 0.5) / (df + 0.5));
        const norm = 1 - BM25_B + BM25_B * (docLen / (avgLen || 1));
        const w = weights ? weights.get(qt) || 0 : 1;
        total +=
          idf * ((tfreq * (BM25_K + 1)) / (tfreq + BM25_K * norm)) * CHUNK_FIELD_BOOST[f] * w;
      }
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
    // 候选收集用 unique（成员关系即可）；打分用带频次 tokenize（真实 TF）
    const origTokens = tokenizeUnique(query);
    if (!origTokens.length) return [];
    const { tokens, weights } = expandQueryWeighted(origTokens, query);

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
      const s = bm25ScoreChunk(tokens, chunk, chunkStats, weights);
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
  // 多路召回 + Reciprocal Rank Fusion（阶段 4）
  // 无向量也可做 hybrid sparse：多路独立召回 → RRF 融合 → 重排。
  // 比单路 BM25 + 假 RM3 稳定，解主题消歧（如"双精度条件数"同时命中
  // numerical-computation 与 qmc-lattice-models，title 路给后者加权）。
  // ══════════════════════════════════════════════════════════════════════════

  // 路 A：title exact / phrase 匹配。rawQuery 的连续片段在 title/breadcrumb 出现 → 高 boost。
  // 复用 searchInverted 的候选，但只保留 title/breadcrumb 命中的，按 phrase 覆盖率排序。
  function searchTitlePhrase(query, postings, chunkStats, topK = 20) {
    if (!postings || !chunkStats) return [];
    const all = searchInverted(query, postings, chunkStats, topK * 3);
    const raw = (query || "").toLowerCase();
    const cjkPart = (raw.match(/[一-鿿]+/g) || []).join("");
    const enTokens = raw.match(/[a-z][a-z0-9]{1,}/g) || [];
    const out = [];
    for (const h of all) {
      const titleText = (
        (h.chunk.title || "") +
        " " +
        (h.chunk.breadcrumb || []).join(" ")
      ).toLowerCase();
      let phraseHits = 0,
        phraseTotal = 0;
      for (let i = 0; i <= cjkPart.length - 2; i++) {
        phraseTotal++;
        if (titleText.includes(cjkPart.slice(i, i + 2))) phraseHits++;
      }
      for (let i = 0; i < enTokens.length - 1; i++) {
        phraseTotal++;
        if (titleText.includes(enTokens[i] + " " + enTokens[i + 1])) phraseHits++;
      }
      // 单 token 也算（英文术语）
      for (const t of enTokens) {
        phraseTotal++;
        if (titleText.includes(t)) phraseHits++;
      }
      const phraseScore = phraseTotal ? phraseHits / phraseTotal : 0;
      if (phraseScore > 0.3) {
        // 标题命中分高的优先；保留原 BM25 分作次序参考
        out.push({ ...h, score: Math.round(phraseScore * 100) / 100 });
      }
    }
    return out.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  // 路 E：doc title / TOC 路由。匹配 globalIndex 的文档标题（整书/整篇层面定位）。
  // 返回该文档的所有 chunk（按 BM25 排），供后续融合时整文档加权。
  function searchDocRoute(query, globalIndex, postings, chunkStats, topK = 20) {
    if (!globalIndex?.docs || !chunkStats) return [];
    const raw = (query || "").toLowerCase();
    const qToks = tokenizeUnique(query);
    const docScores = [];
    for (const doc of globalIndex.docs) {
      const titleText = (doc.title || "").toLowerCase();
      const descText = (doc.description || "").toLowerCase();
      const titleToks = tokenizeUnique(doc.title || "");
      // 整标题子串命中 或 token 重叠
      let overlap = 0;
      for (const t of qToks) if (titleToks.includes(t)) overlap++;
      const cjkHit = (raw.match(/[一-鿿]+/g) || []).some((seg) => titleText.includes(seg));
      const enHit = (raw.match(/[a-z][a-z0-9]{1,}/g) || []).some((t) => titleText.includes(t));
      const score = overlap + (cjkHit ? 2 : 0) + (enHit ? 2 : 0) + (descText.includes(raw) ? 1 : 0);
      if (score > 0) docScores.push({ doc, score });
    }
    docScores.sort((a, b) => b.score - a.score);
    // 取 top 文档的 chunk（从 chunkStats 里筛）
    const topDocs = new Set(docScores.slice(0, 5).map((d) => d.doc.id));
    if (!topDocs.size) return [];
    const out = [];
    for (const ch of chunkStats.chunks) {
      if (topDocs.has(ch.doc_id)) {
        out.push({
          node: {
            doc_id: ch.doc_id,
            node_id: ch.node_id,
            title: ch.title,
            breadcrumb: ch.breadcrumb,
            url: "",
            terms: [],
            summary: (ch.body || "").slice(0, 200),
            line_num: ch.line_num,
          },
          score: 0.1,
          tokens: qToks,
          positions: {},
          chunk: ch,
        });
      }
      if (out.length >= topK * 3) break;
    }
    return out.slice(0, topK);
  }

  // RRF 融合：多路结果按 Reciprocal Rank Fusion 合并。
  // score(d) = Σ 1/(k + rank_i(d))，k=60（标准 RRF 常数）。
  // hits 识别键：doc_id + node_id（同节点不同 chunk 视为同一证据）。
  function rrfFuse(paths, k = 60) {
    const scores = new Map(); // key → {item, rrf}
    for (const hits of paths) {
      if (!hits) continue;
      hits.forEach((h, i) => {
        const key = `${h.node.doc_id}:${h.node.node_id}`;
        const rrf = 1 / (k + i + 1);
        const entry = scores.get(key);
        if (entry) {
          entry.rrf += rrf;
          // 保留最高 BM25 分 + chunk 信息（来自任意一路）
          if ((h.score || 0) > (entry.item.score || 0)) entry.item = h;
        } else {
          scores.set(key, { item: h, rrf });
        }
      });
    }
    return [...scores.values()]
      .map((e) => ({ ...e.item, score: Math.round(e.rrf * 1000) / 1000, rrfScore: e.rrf }))
      .sort((a, b) => b.rrfScore - a.rrfScore);
  }

  // searchMultiPath：协调多路召回 + RRF。
  // 返回 RRF 融合后的 hits（含 rrfScore），与 search/searchInverted 兼容结构。
  function searchMultiPath(query, postings, chunkStats, globalIndex, topK = 50) {
    if (!postings || !chunkStats) return [];
    // 路 B：BM25F body（主路，含同义词扩展 + 加权）
    const pathB = searchInverted(query, postings, chunkStats, Math.max(topK, 50));
    // 路 A：title phrase
    const pathA = searchTitlePhrase(query, postings, chunkStats, 20);
    // 路 E：doc title / TOC 路由
    const pathE = searchDocRoute(query, globalIndex, postings, chunkStats, 20);
    // RRF 融合（B 权重最高，A/E 补充）
    const fused = rrfFuse([pathA, pathB, pathE]);
    // per-doc 截断
    const docCount = new Map(),
      results = [];
    for (const item of fused) {
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

  // ── Confidence 分级（阶段 5：多信号绝对分，修 min-max 归一化虚高） ──────────
  // 旧 classifyConfidence 基于 min-max 归一化 rerankScore（相对分），导致弱匹配也显 high。
  // 新版用绝对信号：query token 覆盖率（最强鉴别）+ rrfScore + title 命中。
  function classifyConfidence(topRerank, sourceCount) {
    // 兼容旧签名（已废弃，保留以防外部调用）。建议用 classifyConfidenceMulti。
    if (topRerank >= 0.6 && sourceCount >= 2) return "high";
    if (topRerank >= 0.3 || (topRerank >= 0.15 && sourceCount >= 2)) return "medium";
    return "low";
  }

  // 多信号 confidence（阶段 5 核心）。
  // 信号（实测鉴别力排序）：
  //   coverage  最强：good 查询 ~1.0，no_answer 0.25-0.57
  //   rrfScore  次强：good ≥0.06，no_answer ≤0.047
  //   titleHit   补充：top1 标题命中 query 核心词
  //   margin     补充：top1-top2 rrfScore 差（明显领先更可信）
  function classifyConfidenceMulti(signals) {
    const { coverage = 0, rrfScore = 0, titleHit = false, margin = 0, sourceCount = 1 } = signals;
    // 低覆盖直接 low（大量 query 词未命中 → 很可能无答案）
    if (coverage < 0.5) return "low";
    // 高覆盖 + 强 rrf + (标题命中或多源) → high
    if (coverage >= 0.7 && rrfScore >= 0.05 && (titleHit || sourceCount >= 2 || margin >= 0.01)) {
      return "high";
    }
    // 中等覆盖 或 中等 rrf → medium
    if (coverage >= 0.5 || rrfScore >= 0.04) return "medium";
    return "low";
  }

  // 计算 confidence 信号（从 rerank 后的 hits + query 提取）。
  function computeConfidenceSignals(query, hits) {
    if (!hits || !hits.length) {
      return { coverage: 0, rrfScore: 0, titleHit: false, margin: 0, sourceCount: 0 };
    }
    const qToks = tokenizeUnique(query);
    const top5 = hits.slice(0, 5);
    // coverage：top5 里命中了多少 query token
    const hitTk = new Set();
    for (const h of top5) {
      for (const qt of qToks) {
        if (h.positions?.[qt]) hitTk.add(qt);
      }
    }
    const coverage = qToks.length ? hitTk.size / qToks.length : 0;
    const rrfScore = hits[0].rrfScore || 0;
    const margin = (hits[0].rrfScore || 0) - (hits[1]?.rrfScore || 0);
    // titleHit：top1 标题/breadcrumb 含 query 的任一核心词
    const top1 = hits[0];
    const titleText = (
      (top1.node.title || "") +
      " " +
      (top1.node.breadcrumb || []).join(" ")
    ).toLowerCase();
    const titleHit = qToks.some((t) => titleText.includes(t));
    const sourceCount = new Set(hits.slice(0, 10).map((h) => h.node.doc_id)).size;
    return { coverage, rrfScore, titleHit, margin, sourceCount };
  }

  const Retrieval = {
    tokenize,
    tokenizeRaw,
    tokenizeUnique,
    SYNONYMS,
    expandQuery,
    expandQueryWeighted,
    SYNONYM_WEIGHT,
    buildBM25Stats,
    bm25Score,
    search,
    buildChunkStats,
    bm25ScoreChunk,
    searchInverted,
    searchTitlePhrase,
    searchDocRoute,
    rrfFuse,
    searchMultiPath,
    CHUNK_FIELD_BOOST,
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
    classifyConfidenceMulti,
    computeConfidenceSignals,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Retrieval;
  else root.YuuRetrieval = Retrieval;
})(typeof globalThis !== "undefined" ? globalThis : this);
