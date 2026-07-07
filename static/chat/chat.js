/**
 * Yuunagi Library — Chat Agent
 * BYOK browser-direct mode. PageIndex tree retrieval + multi-provider LLM.
 * Zero dependencies. Copy static/chat/ to reuse in any Hugo project.
 */
(function () {
  "use strict";

  const BASE = window.YUU_CHAT_BASE || "";
  const PAGEINDEX = `${BASE}pageindex`;

  // ── State ────────────────────────────────────────────────────────────────
  let globalIndex = null,
    nodeIndex = null,
    indexReady = false;
  const docCache = {};
  const mdCache = {}; // source_md URL → 按行 split 的数组（fetch md 原文缓存）
  const CHAT_SESSION_KEY = "yuu_chat_session";
  const SESSIONS_ARCHIVE_KEY = "yuu_chat_sessions_archive";
  const MAX_ARCHIVED = 20;
  let chatHistory = loadSession();

  function loadSession() {
    try {
      const r = sessionStorage.getItem(CHAT_SESSION_KEY);
      return r ? JSON.parse(r) : [];
    } catch (_) {
      return [];
    }
  }
  function saveSession() {
    try {
      sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(chatHistory));
    } catch (_) {
      /* ignore */
    }
  }

  // ── DOM refs ─────────────────────────────────────────────────────────────
  let root, emptyEl, messagesEl, composerInput, sendBtn;

  // ══════════════════════════════════════════════════════════════════════════
  // Mini Provider SDK
  // ══════════════════════════════════════════════════════════════════════════

  // 结构化 SSE 事件：{type:"thinking"|"text"|"tool_calls"|"stop", ...}
  async function* readSSE(response) {
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let msg = `HTTP ${response.status}`;
      try {
        msg = JSON.parse(text).error?.message || msg;
      } catch (_) {
        /* ignore */
      }
      throw new Error(msg);
    }
    const reader = response.body.getReader(),
      decoder = new TextDecoder();
    let buffer = "";
    const toolCallBuffers = {}; // index → {id, name, arguments}
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6);
        if (raw === "[DONE]") return;
        try {
          const json = JSON.parse(raw);
          // ── OpenAI 协议（DeepSeek / OpenAI / 兼容端点）──
          const choice = json.choices?.[0];
          if (choice) {
            const delta = choice.delta || {};
            if (delta.reasoning_content) yield { type: "thinking", text: delta.reasoning_content };
            if (delta.content) yield { type: "text", text: delta.content };
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCallBuffers[idx])
                  toolCallBuffers[idx] = { id: "", name: "", arguments: "" };
                if (tc.id) toolCallBuffers[idx].id = tc.id;
                if (tc.function?.name) toolCallBuffers[idx].name = tc.function.name;
                if (tc.function?.arguments) toolCallBuffers[idx].arguments += tc.function.arguments;
              }
            }
            if (choice.finish_reason) {
              if (choice.finish_reason === "tool_calls") {
                yield { type: "tool_calls", calls: Object.values(toolCallBuffers) };
              }
              yield { type: "stop", reason: choice.finish_reason, usage: json.usage };
              return;
            }
            continue;
          }
          // ── Anthropic 协议（保留兼容）──
          if (json.type === "content_block_delta") {
            if (json.delta?.type === "thinking_delta" && json.delta.thinking) {
              yield { type: "thinking", text: json.delta.thinking };
            } else if (json.delta?.text) {
              yield { type: "text", text: json.delta.text };
            }
          } else if (json.delta?.type === "input_json_delta" && json.delta.partial_json) {
            const idx = json.index ?? 0;
            if (!toolCallBuffers[idx]) toolCallBuffers[idx] = { id: "", name: "", arguments: "" };
            toolCallBuffers[idx].arguments += json.delta.partial_json;
          } else if (json.type === "message_delta" && json.delta?.stop_reason === "tool_use") {
            yield { type: "tool_calls", calls: Object.values(toolCallBuffers) };
          } else if (json.type === "message_delta" && json.delta?.stop_reason) {
            yield { type: "stop", reason: json.delta.stop_reason };
          } else if (json.type === "message_stop") return;
        } catch (_) {
          /* ignore */
        }
      }
    }
  }

  function buildRequest({
    provider,
    model,
    baseUrl,
    apiKey,
    system,
    messages,
    maxTokens,
    tools,
    thinking,
  }) {
    if (provider === "anthropic") {
      return {
        url: `${baseUrl}/v1/messages`,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens || 4096,
          system,
          messages,
          stream: true,
          ...(tools?.length
            ? {
                tools: tools.map((t) => ({
                  name: t.function.name,
                  description: t.function.description,
                  input_schema: t.function.parameters,
                })),
                tool_choice: { type: "auto" },
              }
            : {}),
          ...(thinking
            ? { thinking: { type: "enabled", budget_tokens: Math.min(maxTokens || 4096, 8000) } }
            : {}),
        }),
      };
    }
    // OpenAI 兼容协议（含 DeepSeek / OpenAI / SiliconFlow / GLM / DashScope / Gemini / Ollama）
    const body = {
      model,
      max_tokens: maxTokens || 4096,
      messages: [{ role: "system", content: system }, ...messages],
      stream: true,
    };
    if (tools?.length) {
      body.tools = tools;
      body.tool_choice = "auto";
    }
    // DeepSeek 思考模式：顶层 thinking 参数。"disabled" 关，"enabled" 开（默认开）。
    if (provider === "deepseek") {
      body.thinking = { type: thinking ? "enabled" : "disabled" };
    }
    return {
      url: `${baseUrl}/v1/chat/completions`,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    };
  }

  async function* streamText(opts) {
    const req = buildRequest(opts);
    const resp = await fetch(req.url, { method: "POST", headers: req.headers, body: req.body });
    yield* readSSE(resp);
  }

  // 轻量非流式 LLM 调用（给 rewrite_query / llmRerank 用，不需要流式/thinking/tools）
  async function callLLMSync(systemPrompt, userPrompt) {
    const cfg = Settings.resolve();
    if (!cfg.apiKey) return "";
    const opts = {
      provider: cfg.provider,
      model: cfg.model,
      baseUrl: cfg.baseUrl,
      apiKey: cfg.apiKey,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 1024,
    };
    const req = buildRequest(opts);
    // 非流式：读完整 response body
    const resp = await fetch(req.url, {
      method: "POST",
      headers: { ...req.headers, Accept: "application/json" },
    });
    if (!resp.ok) return "";
    // OpenAI 兼容格式（DeepSeek/OpenAI 等）
    const data = await resp.json().catch(() => null);
    return data?.choices?.[0]?.message?.content || data?.content?.[0]?.text || "";
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Settings
  // ══════════════════════════════════════════════════════════════════════════

  const Settings = {
    _pfx: "yuu_chat_",
    _defaults() {
      return { provider: "anthropic", model: "", base_url: "", api_key: "", remember_key: false };
    },
    get(key) {
      const v = sessionStorage.getItem(this._pfx + key);
      if (v !== null) return v;
      return localStorage.getItem(this._pfx + key) || this._defaults()[key] || "";
    },
    set(key, val) {
      sessionStorage.setItem(this._pfx + key, val);
      if (key === "remember_key") {
        if (val === "true") {
          const k = this.get("api_key");
          if (k) localStorage.setItem(this._pfx + "api_key", k);
        } else localStorage.removeItem(this._pfx + "api_key");
      }
      if (key !== "api_key" && key !== "remember_key") {
        try {
          localStorage.setItem(this._pfx + key, val);
        } catch (_) {
          /* ignore */
        }
      }
      if (key === "api_key" && this.get("remember_key") === "true") {
        localStorage.setItem(this._pfx + key, val);
      }
    },
    resolve() {
      const p = this.get("provider");
      const model =
        this.get("model") ||
        {
          anthropic: "claude-sonnet-4-6",
          deepseek: "deepseek-v4-flash",
          openai: "gpt-4o",
          siliconflow: "deepseek-ai/DeepSeek-V3",
          openrouter: "anthropic/claude-sonnet-4",
          zhipu: "glm-4",
          dashscope: "qwen-plus",
          ollama: "llama3",
          gemini: "gemini-2.5-flash",
          custom: "",
        }[p] ||
        "";
      const baseUrl =
        this.get("base_url") ||
        {
          anthropic: "https://api.anthropic.com",
          deepseek: "https://api.deepseek.com",
          openai: "https://api.openai.com",
          siliconflow: "https://api.siliconflow.cn",
          openrouter: "https://openrouter.ai/api",
          zhipu: "https://open.bigmodel.cn/api/paas/v4",
          dashscope: "https://dashscope.aliyuncs.com/compatible-mode/v1",
          ollama: "http://localhost:11434",
          gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
        }[p] ||
        "";
      return { provider: p, model, baseUrl, apiKey: this.get("api_key") };
    },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Index loading
  // ══════════════════════════════════════════════════════════════════════════

  async function loadIndexes() {
    if (indexReady) return;
    const [gi, ni] = await Promise.all([
      fetch(`${PAGEINDEX}/global-index.json`).then((r) => r.json()),
      fetch(`${PAGEINDEX}/node-index.json`).then((r) => r.json()),
    ]);
    globalIndex = gi;
    nodeIndex = ni;
    indexReady = true;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Search — two-pass: node-index → load full tree → expand hierarchy
  // ══════════════════════════════════════════════════════════════════════════

  // ── Tokenizer：中文 2-gram + 英文单词。不保留中文单字（噪声太大、IDF 失效）。
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

  // ── Query expansion：手写同义词表 + 运行时从 terms/headings 抽取 ──────────
  // 手写表覆盖常见物理/ML 术语的中英互译与缩写。运行时表在索引加载后构建。
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

  // ── BM25：字段加权 + IDF。首次搜索时构建 IDF 与字段长度统计。 ──────────────
  let bm25Stats = null; // { df: Map, N: number, avgLen, fieldAvgLen }

  function buildBM25Stats() {
    if (bm25Stats || !nodeIndex) return;
    const nodes = nodeIndex.nodes || [];
    const df = new Map(); // document frequency per token
    // summary 字段（LLM 摘要）权重高于旧 excerpt；兼容旧索引（fallback 到 excerpt）
    const FIELDS = ["title", "breadcrumb", "terms", "summary"];
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
    bm25Stats = {
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

  // 字段权重：title 最高，breadcrumb 次之，terms/summary 正常
  const FIELD_BOOST = { title: 6, breadcrumb: 3, terms: 2, summary: 2 };
  const BM25_K = 1.5,
    BM25_B = 0.75;

  function bm25Score(queryTokens, node) {
    const stats = bm25Stats;
    let total = 0;
    const FIELDS = ["title", "breadcrumb", "terms", "summary"];
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

  function search(query, topK = 50) {
    if (!nodeIndex) return [];
    buildBM25Stats();
    let tokens = tokenize(query);
    if (!tokens.length) return [];
    tokens = expandQuery(tokens, query);
    const scored = [];
    for (const node of nodeIndex.nodes) {
      const s = bm25Score(tokens, node);
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

  // budget = (MODEL_WINDOW - OUTPUT_RESERVE - history - system) * 0.5
  function packWithContextBudget(contexts, historyTokens, systemTokens) {
    const MODEL_WINDOW = 64000,
      OUTPUT_RESERVE = 4096;
    const retrievalBudget = Math.floor(
      (MODEL_WINDOW - OUTPUT_RESERVE - historyTokens - systemTokens) * 0.5
    );
    if (retrievalBudget <= 0) return contexts.slice(0, 2); // 兜底：至少给 2 块
    let used = 0;
    const packed = [];
    for (const c of contexts) {
      // 单块也限长（避免一篇长文吃光预算）
      const text =
        c.text.length > MAX_SECTION_CHARS * 2 ? c.text.slice(0, MAX_SECTION_CHARS * 2) : c.text;
      const n = estimateTokens(text);
      if (used + n > retrievalBudget) continue;
      packed.push({ ...c, text });
      used += n;
    }
    return packed.length ? packed : contexts.slice(0, 2); // 兜底
  }

  // 从 GitHub raw URL fetch md 原文，剥离 front matter，按行 split 缓存
  async function fetchMdLines(sourceMd) {
    if (!sourceMd) return null;
    // sourceMd 是相对路径（content/notes/xxx.md），用 YUU_CHAT_RAW_BASE 拼完整 URL
    const fullUrl = (window.YUU_CHAT_RAW_BASE || "") + sourceMd;
    if (mdCache[fullUrl]) return mdCache[fullUrl];
    try {
      const resp = await fetch(fullUrl);
      if (!resp.ok) return null;
      const text = await resp.text();
      // 剥离 front matter（--- ... ---），和 build_pageindex 的 line_num 对齐
      const body = text.replace(/^---\n[\s\S]*?\n---\n/, "");
      const lines = body.split("\n");
      mdCache[fullUrl] = lines;
      return lines;
    } catch (_) {
      return null;
    }
  }

  // 按行号区间取正文（line_num 到 line_end）
  async function fetchMdSection(sourceMd, lineNum, lineEnd) {
    const lines = await fetchMdLines(sourceMd);
    if (!lines) return "";
    const start = lineNum || 0;
    const end = lineEnd || lines.length;
    return lines.slice(start, end).join("\n").trim();
  }

  async function loadDocTree(docId) {
    if (docCache[docId] !== undefined) return;
    const doc = globalIndex?.docs?.find((d) => d.id === docId);
    // globalIndex 的 type 是单数（book/paper/note），但 PageIndex 目录是复数（books/papers/notes）
    const typeRaw = doc?.type || "papers";
    const type = typeRaw.endsWith("s") ? typeRaw : typeRaw + "s";
    try {
      const resp = await fetch(`${PAGEINDEX}/${type}/${docId}.json`);
      const data = await resp.json();
      const flat = [];
      (function walk(nodes, crumb) {
        for (const n of nodes) {
          const c = [...crumb, n.title];
          flat.push({ ...n, _crumb: c });
          if (n.nodes) walk(n.nodes, c);
        }
      })(data.structure, []);
      docCache[docId] = { tree: data, flat };
    } catch (_) {
      docCache[docId] = null;
    }
  }

  async function buildContextChunk(doc, nodeId, docMeta) {
    const flat = doc.flat;
    const idx = flat.findIndex((n) => n.node_id === nodeId);
    if (idx < 0) return null;
    const node = flat[idx],
      crumb = node._crumb || [node.title];
    // 正文从 source_md（GitHub raw URL）按 line_num 按需取，不再存 doc tree
    const text = await fetchMdSection(node.source_md, node.line_num, node.line_end);
    const parent =
      crumb.length > 1
        ? flat.find(
            (n) =>
              n._crumb?.length === crumb.length - 1 &&
              crumb.slice(0, -1).every((t, i) => n._crumb[i] === t)
          )
        : null;
    const siblings = flat
      .filter(
        (n) =>
          n._crumb?.length === crumb.length &&
          n.node_id !== node.node_id &&
          n._crumb?.slice(0, -1).every((t, i) => crumb[i] === t)
      )
      .slice(0, 4);
    const children = flat
      .filter(
        (n) =>
          n._crumb?.length === crumb.length + 1 &&
          n._crumb?.slice(0, -1).every((t, i) => crumb[i] === t)
      )
      .slice(0, 4);
    return {
      sourceId: `${docMeta.type || "doc"}:${docMeta.doc_id || docMeta.title || "unknown"}:${nodeId}`,
      docType: docMeta.type || "",
      docTitle: docMeta.title || docMeta.doc_name || "",
      docAuthor: docMeta.author || "",
      nodeId,
      title: node.title,
      breadcrumb: crumb,
      text,
      parentTitle: parent?.title || "",
      siblingTitles: siblings.map((n) => n.title),
      childTitles: children.map((n) => n.title),
    };
  }

  async function retrieveContext(query) {
    let hits = search(query);
    if (!hits.length) return { contexts: [], docCount: 0, thin: true };

    // ── 第 2 步：RM3 伪相关反馈——用 top-10 扩展 query term，重打分 ──
    const origTokens = tokenize(query);
    const expandedTokens = rm3Expand(origTokens, hits);
    if (expandedTokens.length > origTokens.length) {
      // 用扩展 tokens 重新打分（只对已召回的 hits，不重新遍历全库）
      for (const h of hits) {
        h.score = Math.round(bm25Score(expandedTokens, h.node) * 100) / 100;
      }
      hits = hits.filter((h) => h.score > 0).sort((a, b) => b.score - a.score);
    }

    // ── 第 3 步：词法精排（proximity + phrase + coverage）──
    hits = lexicalRerank(origTokens, query, hits);

    // 加载文档树（top-6 文档）
    const uniqueDocs = [...new Set(hits.map((h) => h.node.doc_id))].slice(0, 6);
    await Promise.all(uniqueDocs.map(loadDocTree));

    // 组装 context（用精排后的顺序，取 top-12 候选供 MMR 选）
    const candidates = [],
      seenNodes = new Set();
    for (const hit of hits.slice(0, 12)) {
      const doc = docCache[hit.node.doc_id];
      if (!doc) continue;
      if (seenNodes.has(hit.node.doc_id + ":" + hit.node.node_id)) continue;
      seenNodes.add(hit.node.doc_id + ":" + hit.node.node_id);
      const ctx = await buildContextChunk(doc, hit.node.node_id, doc.tree);
      if (ctx && ctx.text) {
        ctx.url = hit.node.url || "";
        ctx.rerankScore = hit.rerankScore || 0;
        candidates.push(ctx);
      }
    }

    // thin 兜底：候选不足时用单 token 二次召回补
    let thin = candidates.length < 2;
    if (thin && query.length > 4) {
      for (const term of tokenize(query).slice(0, 3)) {
        for (const hit of search(term, 4)) {
          if (!docCache[hit.node.doc_id]) await loadDocTree(hit.node.doc_id);
          const d = docCache[hit.node.doc_id];
          if (!d || seenNodes.has(hit.node.doc_id + ":" + hit.node.node_id)) continue;
          seenNodes.add(hit.node.doc_id + ":" + hit.node.node_id);
          const ctx = await buildContextChunk(d, hit.node.node_id, d.tree);
          if (ctx && ctx.text) {
            ctx.url = hit.node.url || "";
            ctx.rerankScore = hit.rerankScore || 0.1;
            candidates.push(ctx);
          }
          if (candidates.length >= 8) break;
        }
        if (candidates.length >= 8) break;
      }
      thin = candidates.length < 2;
    }

    // ── 第 4 步：MMR 去冗余（4-gram shingle Jaccard，λ=0.6）──
    const contexts = mmrSelect(candidates, 0.6, 8);

    // ── 置信度分级（基于精排后的 rerankScore，尺度已归一化到 [0,1]）──
    const topRerank = hits[0]?.rerankScore || 0;
    const sourceCount = uniqueDocs.length;
    let confidence = "low";
    if (topRerank >= 0.6 && sourceCount >= 2) confidence = "high";
    else if (topRerank >= 0.3 || (topRerank >= 0.15 && sourceCount >= 2)) confidence = "medium";

    // ── LLM 重排：confidence=low 时触发，批量评分重排 top 候选 ──
    let finalContexts = contexts;
    if (confidence === "low" && contexts.length > 2) {
      finalContexts = await llmRerank(query, contexts);
    }

    return {
      contexts: finalContexts,
      docCount: sourceCount,
      thin,
      confidence,
      hits: hits.slice(0, 12),
    };
  }

  // LLM 批量评分重排（confidence=low 时触发，一次调用评所有候选）
  async function llmRerank(query, contexts) {
    const cfg = Settings.resolve();
    if (!cfg.apiKey) return contexts; // BYOK 无 key 跳过
    const top = contexts.slice(0, 6); // 只重排 top6，省 token
    const docs = top
      .map(
        (c, i) =>
          `[${i + 1}] 标题：${c.title || c.breadcrumb?.join(" > ") || ""}\n摘要：${(c.text || "").slice(0, 200)}`
      )
      .join("\n---\n");
    const userPrompt = `查询：${query}\n\n候选文档：\n${docs}\n\n为每个文档打 0-10 分（10 最相关），格式"[编号] 分数"，每行一个。只返回评分。`;
    try {
      const resp = await callLLMSync(
        "你是文档相关性评估专家。根据查询评估文档相关性。",
        userPrompt
      );
      if (!resp) return contexts;
      // 解析 "[1] 8" 或 "1. 8" 格式
      const scores = new Map();
      for (const line of resp.split("\n")) {
        const m = line.match(/\[?(\d+)\]?\s*[:：]?\s*(\d+(?:\.\d+)?)/);
        if (m) scores.set(parseInt(m[1]) - 1, parseFloat(m[2]));
      }
      if (!scores.size) return contexts;
      // 按分数重排
      const scored = top.map((c, i) => ({ c, score: scores.get(i) ?? 0 }));
      scored.sort((a, b) => b.score - a.score);
      return [...scored.map((s) => s.c), ...contexts.slice(6)];
    } catch (_) {
      return contexts; // 失败回退原顺序
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // System prompt
  // ══════════════════════════════════════════════════════════════════════════

  const MAX_SECTION_CHARS = 2500;

  // 语义边界截断：优先保留完整段落，段落仍超长则按句子切，永不硬 slice。
  // 永远保留 breadcrumb/title/source_id（由 block 头部保证）。
  function truncateAtBoundary(text, maxChars) {
    if (text.length <= maxChars) return text;
    // 1) 先按段落（空行或单换行）切，累加到上限
    const paragraphs = text.split(/\n+/).filter((p) => p.trim());
    let out = "";
    for (const p of paragraphs) {
      if ((out + "\n" + p).length > maxChars) break;
      out += (out ? "\n" : "") + p;
    }
    if (!out) {
      // 2) 单段就超长 → 按句子切（中英文句号、问号、分号）
      const sentences = text.split(/(?<=[。！？；!?])/).filter((s) => s.trim());
      for (const s of sentences) {
        if ((out + s).length > maxChars) break;
        out += s;
      }
    }
    if (!out) out = text.slice(0, maxChars); // 极端兜底
    return out + "\n\n…[已按语义边界截断，可追问获取完整内容]…";
  }

  function buildSystemPrompt(contexts, thin, confidence) {
    const docNames = [...new Set(contexts.map((c) => c.docTitle))];
    const docToc = docNames.map((name) => {
      const dc = contexts.filter((c) => c.docTitle === name);
      const meta = [dc[0].docAuthor, dc[0].docType].filter(Boolean).join(" · ");
      return `- **${name}**${meta ? ` (${meta})` : ""} — ${dc.length} 个相关段落`;
    });
    const blocks = [],
      seen = new Set();
    let n = 0;
    for (let i = 0; i < contexts.length; i++) {
      const c = contexts[i],
        hash = c.text.slice(0, 80);
      if (seen.has(hash)) continue;
      seen.add(hash);
      n++;
      const crumb = c.breadcrumb.join(" > ");
      const text = truncateAtBoundary(c.text, MAX_SECTION_CHARS);
      let block = `### [${n}] ${crumb}\n*来源: ${c.docTitle} | source_id: ${c.sourceId}*\n`;
      const nearby = [];
      if (c.parentTitle && c.breadcrumb.length > 1) nearby.push(`上级: ${c.parentTitle}`);
      if (c.siblingTitles.length) nearby.push(`同级: ${c.siblingTitles.join(" / ")}`);
      if (c.childTitles.length) nearby.push(`子节: ${c.childTitles.join(" / ")}`);
      if (nearby.length) block += `*${nearby.join("  |  ")}*\n`;
      block += `\n${text}`;
      blocks.push(block);
    }
    // 置信度提示：confidence 分级驱动模型"边界感"。low 时强烈约束不要扩展。
    let thinNotice = "";
    if (confidence === "low" || thin) {
      thinNotice =
        "\n> **检索置信度较低**：当前检索相关性不足。请优先说明依据不足，只基于最相关来源简短回答，**不要扩展、不要猜测、不要编造**。\n";
    } else if (confidence === "medium") {
      thinNotice =
        "\n> **检索置信度中等**：依据基本充足，但请只基于 Context 回答，对证据不足的部分明确标注。\n";
    } else {
      thinNotice = "\n> **检索置信度高**：可基于 Context 充分回答。\n";
    }
    return `你是 **Yuunagi Library** 的知识助手，基于个人数字图书馆内容的 RAG 问答系统。

## 检索概览
${docToc.join("\n")}
${thinNotice}
## 推理步骤
1. **扫描结构**：先浏览下方各段落标题和层级关系，判断哪些 [N] 与问题最相关
2. **精读内容**：重点阅读匹配度高的段落。被截断的段落可追问
3. **交叉验证**：如果多个来源有不同观点，指出差异
4. **组织回答**：先给直接答案，再展开解释。用 [N] 标注每个论断的来源
5. **诚实评估**：Context 不足时明确说"当前图书馆中没有足够依据"

## Context（按相关度排序）

${blocks.join("\n\n---\n\n")}

## 回答规则
- 只能根据 Context 回答，不要使用外部知识
- 每个关键论断标注来源编号
- 回答末尾列出参考来源：参考来源：\n[1] 《文档名》 > 章节 > 节名
- 回答使用中文，专业术语保留原文。公式用 KaTeX：行内 $...$，行间 $$...$`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Agent: tools + system prompt + tool execution
  // ══════════════════════════════════════════════════════════════════════════

  // search_library 工具：复用现有 BM25 检索，包装成 OpenAI tool schema
  const LIBRARY_TOOLS = [
    {
      type: "function",
      function: {
        name: "search_library",
        description:
          "在个人数字图书馆中检索书籍、论文、笔记内容。当需要查找事实、概念、章节内容、文献时使用。可用不同的关键词多次检索以覆盖不同角度。返回结果含 source_id（格式 doc_type:doc_id:node_id），供 get_section 深挖。",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "检索关键词或问题，用文档中可能出现的原词效果最好",
            },
          },
          required: ["query"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_section",
        description:
          "取指定文档某章节的完整内容（不截断）。先用 search_library 找到 source_id，解析出 doc_id 和 node_id，再用本工具取全文。用于检索结果被截断、需要完整推导/证明/上下文时。",
        parameters: {
          type: "object",
          properties: {
            doc_id: {
              type: "string",
              description: "文档 ID（source_id 第二段，如 linear-response-theory-foundations）",
            },
            node_id: { type: "string", description: "节点 ID（source_id 第三段，如 0003）" },
          },
          required: ["doc_id", "node_id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "rewrite_query",
        description:
          "分析用户问题并生成更好的检索查询建议。当直接搜索结果不佳、查询模糊/口语化/含代词时使用。返回改写后的查询词，你选择合适的去调 search_library。",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "用户原始问题" },
            strategy: {
              type: "string",
              enum: ["rewrite", "decompose", "step_back"],
              description:
                "rewrite=改写更具体；decompose=拆成子问题；step_back=生成更宽泛的背景查询",
            },
          },
          required: ["query"],
        },
      },
    },
  ];

  // retrieveContext 返回结构化 contexts，这里转成给模型的纯文本（agent 模式）
  // budgetCtx: 可选 {historyTokens, systemTokens}，提供时启用 token budget packing
  async function retrieveContextAsText(query, budgetCtx) {
    const result = await retrieveContext(query);
    let { contexts, confidence } = result;
    if (!contexts.length) return { text: "未找到相关内容。", contexts: [], confidence };
    // token budget packing（感知对话历史）
    if (budgetCtx) {
      contexts = packWithContextBudget(
        contexts,
        budgetCtx.historyTokens || 0,
        budgetCtx.systemTokens || 0
      );
    }
    const blocks = contexts.map(
      (c, i) =>
        `### [${i + 1}] ${c.breadcrumb.join(" > ")}\n*来源: ${c.docTitle} | source_id: ${c.sourceId}*\n\n${truncateAtBoundary(
          c.text,
          MAX_SECTION_CHARS
        )}`
    );
    const text = `${blocks.join("\n\n---\n\n")}\n\n检索置信度: ${confidence}`;
    return { text, contexts, confidence };
  }

  // 执行工具调用，返回字符串结果。budgetCtx 透传给 retrieveContextAsText
  async function executeTool(name, args, budgetCtx) {
    if (name === "search_library") {
      const r = await retrieveContextAsText(args.query, budgetCtx);
      // 把 contexts 挂到返回值上，供 agent loop 累积引用
      r.__contexts = r.contexts;
      return r;
    }
    if (name === "get_section") {
      const docId = args.doc_id || "";
      const nodeId = args.node_id || "";
      await loadDocTree(docId);
      const doc = docCache[docId];
      if (!doc) return { text: `文档 ${docId} 未找到或加载失败` };
      const node = doc.flat.find((n) => n.node_id === nodeId);
      if (!node)
        return {
          text: `节点 ${nodeId} 未找到。可用节点：${doc.flat
            .slice(0, 5)
            .map((n) => n.node_id + " " + n.title.slice(0, 20))
            .join("; ")}...`,
        };
      const text = await fetchMdSection(node.source_md, node.line_num, node.line_end);
      const breadcrumb = (node._crumb || [node.title]).join(" > ");
      const docTitle = doc.tree.title || docId;
      return {
        text: `### ${breadcrumb}\n*来源: ${docTitle}*\n\n${text}`,
        __contexts: [
          {
            sourceId: `${docId}:${nodeId}`,
            text,
            docTitle,
            breadcrumb: node._crumb || [node.title],
            url: "",
          },
        ],
      };
    }
    if (name === "rewrite_query") {
      const strategy = args.strategy || "rewrite";
      const promptTemplates = {
        rewrite:
          "把以下查询改写得更具体、更适合文档检索。包含文档中可能出现的专业术语和同义词。只返回改写后的查询，不要解释。\n\n原始查询：",
        decompose:
          "把以下复合问题分解成 2-3 个可独立检索的子问题，每行一个，不要编号。只返回子问题，不要解释。\n\n原始查询：",
        step_back:
          "为以下具体查询生成一个更宽泛的背景查询，用于检索基础概念和上下文。只返回背景查询，不要解释。\n\n原始查询：",
      };
      const userPrompt = (promptTemplates[strategy] || promptTemplates.rewrite) + args.query;
      const rewritten = await callLLMSync(
        "你是检索查询优化专家。根据策略改写用户查询，使其更适合在专业文档库中检索。",
        userPrompt
      );
      if (!rewritten)
        return { text: "改写失败（可能未配置 API Key），请直接换关键词调 search_library。" };
      return {
        text: `改写建议（${strategy}）：\n${rewritten}\n\n请用以上查询词调 search_library 检索。`,
      };
    }
    return { text: `未知工具: ${name}` };
  }

  // 从 globalIndex 渲染精简目录（注入 system prompt，让 LLM 知道图书馆有什么）
  function buildLibraryTOC() {
    if (!globalIndex?.docs?.length) return { text: "(索引未加载)", docCount: 0 };
    const groups = { book: "书籍", paper: "论文", note: "笔记" };
    const counts = { book: 0, paper: 0, note: 0 };
    const lines = { book: [], paper: [], note: [] };
    for (const doc of globalIndex.docs) {
      const t = doc.type || "note";
      if (!(t in counts)) continue; // 只处理 book/paper/note 三类
      counts[t]++;
      const author = doc.author ? ` ${doc.author.split(/[,，]/)[0]}` : "";
      const tags = doc.tags?.length ? ` [${doc.tags.slice(0, 3).join(", ")}]` : "";
      const desc = (doc.description || "").slice(0, 50);
      lines[t].push(`- 《${doc.title}》${author} — ${desc}${tags}`);
    }
    let text = "";
    for (const [t, label] of Object.entries(groups)) {
      if (counts[t]) text += `### ${label}（${counts[t]} 篇）\n${lines[t].join("\n")}\n\n`;
    }
    return { text: text.trim(), docCount: globalIndex.docs.length };
  }

  // agent 模式的 system prompt：注入全局目录 + 查询转换策略引导
  function buildAgentSystemPrompt() {
    const toc = buildLibraryTOC();
    return `你是 **Yuunagi Library** 的知识助手，基于个人数字图书馆的 RAG 问答系统。

## 图书馆目录（${toc.docCount} 篇文档，检索前先浏览相关领域）
${toc.text}

## 工作方式
- 你有三个工具：search_library（检索）、get_section（取完整章节）、rewrite_query（改写查询）
- 回答用户问题前，**必须先调用 search_library 检索**，不要凭记忆回答
- 只能基于检索到的内容回答，不要使用外部知识编造

## 检索策略（重要）
第一次用用户原话检索。如果结果不足，换策略重试：
- **查询重写**：换成文档里可能出现的专业术语重搜（如"那个相变"→"量子相变 Rabi 模型"）
- **子查询分解**：复合问题拆成子问题分别检索（如"Berry phase 和线性响应的关系"→分两搜）
- **步退查询**：太具体搜不到时，先用更宽泛的概念搜背景知识
- 可调 rewrite_query 工具生成改写建议，也可直接换关键词调 search_library
- 找到相关章节但内容被截断时，用 get_section 取完整内容（需 doc_id 和 node_id）

## 回答规则
- 每个关键论断标注来源编号 [N]，对应检索结果中的 [N]
- 回答末尾列出参考来源，格式：\n[1] 文档名 > 章节 > 节名
- 检索结果不足时明确说明"当前图书馆中没有足够依据"，不要硬答
- 回答使用中文，专业术语保留原文。公式用 KaTeX：行内 $...$，行间 $$...$$`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Markdown
  // ══════════════════════════════════════════════════════════════════════════

  function renderMarkdown(text) {
    let html = text;
    html = html.replace(
      /```(\w*)\n([\s\S]*?)```/g,
      (_, lang, code) => `<pre><code>${escHtml(code.trim())}</code></pre>`
    );
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html
      .replace(/^### (.+)$/gm, "<h4>$1</h4>")
      .replace(/^## (.+)$/gm, "<h3>$1</h3>")
      .replace(/^# (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
    return `<p>${html}</p>`;
  }
  function escHtml(s) {
    return s.replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
    );
  }

  function injectReferenceLinks(markdown, refMap) {
    if (!refMap || Object.keys(refMap).length === 0) return markdown;
    const base = BASE.replace(/\/+$/, "");

    // 1) 用占位符保护代码块 / 行内代码，避免把代码里的 [N] 误转成链接。
    //    占位符用 PUA 区字符（不会出现在正常文本/代码里），避开 control 字符。
    const stash = [];
    const PH = (i) => `\uF8FFCODE${i}\uF8FF`;
    let work = markdown.replace(
      /```[\s\S]*?```/g,
      (m) => (stash.push(m) - 1 + "", PH(stash.length - 1))
    );
    work = work.replace(/`[^`\n]*`/g, (m) => (stash.push(m) - 1 + "", PH(stash.length - 1)));

    // 2) 逐行处理。不再要求 [N] 前必须是标点——中文紧贴（如"文献[1]所示"）也要能命中。
    const lines = work.split("\n");
    const result = lines.map((line) => {
      // 参考来源列表行：[N] 在行首后接标题文字
      const refMatch = line.match(/^\[(\d+)\]\s+(.+)$/);
      if (refMatch) {
        const ref = refMap[parseInt(refMatch[1])];
        if (ref && ref.url) return `[${refMatch[1]}] [${refMatch[2]}](${base}${ref.url})`;
        return line;
      }
      // 行内引用：匹配 [N]，但跳过已是 markdown 链接的情况（[文字](url) 形式）。
      return line.replace(/\[(\d+)\](?!\()/g, (m, num) => {
        const ref = refMap[parseInt(num)];
        if (ref && ref.url) return `[${num}](${base}${ref.url})`;
        return m;
      });
    });
    work = result.join("\n");

    // 3) 还原代码块 / 行内代码
    work = work.replace(/\uF8FFCODE(\d+)\uF8FF/g, (_, i) => stash[parseInt(i)]);
    return work;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Session archive (localStorage)
  // ══════════════════════════════════════════════════════════════════════════

  function archiveCurrentSession() {
    if (!chatHistory.length) return;
    const sessions = loadArchivedSessions();
    const title = chatHistory[0]?.content?.slice(0, 50) || "(空会话)";
    sessions.unshift({
      id: Date.now().toString(36),
      title,
      date: new Date().toISOString(),
      messages: [...chatHistory],
    });
    if (sessions.length > MAX_ARCHIVED) sessions.length = MAX_ARCHIVED;
    try {
      localStorage.setItem(SESSIONS_ARCHIVE_KEY, JSON.stringify(sessions));
    } catch (_) {
      /* ignore */
    }
  }
  function loadArchivedSessions() {
    try {
      const r = localStorage.getItem(SESSIONS_ARCHIVE_KEY);
      return r ? JSON.parse(r) : [];
    } catch (_) {
      return [];
    }
  }
  function restoreArchivedSession(id) {
    const sessions = loadArchivedSessions(),
      s = sessions.find((x) => x.id === id);
    if (!s) return;
    if (chatHistory.length) archiveCurrentSession();
    chatHistory = s.messages;
    saveSession();
    messagesEl.innerHTML = "";
    hideEmpty();
    for (const msg of chatHistory) appendMessageBubble(msg.role, msg.content);
  }
  function removeArchivedSession(id) {
    let sessions = loadArchivedSessions();
    sessions = sessions.filter((x) => x.id !== id);
    try {
      localStorage.setItem(SESSIONS_ARCHIVE_KEY, JSON.stringify(sessions));
    } catch (_) {
      /* ignore */
    }
    return sessions;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DOM — single template, drawers inside main, data-action delegation
  // ══════════════════════════════════════════════════════════════════════════

  function createDOM() {
    const el = document.createElement("div");
    el.id = "yuu-chat-root";
    el.innerHTML = `
<div class="yuu-ai" data-state="closed">
  <button class="yuu-ai-fab" data-action="open" aria-label="打开 AI 问答">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  </button>
  <section class="yuu-ai-panel">
    <header class="yuu-ai-header">
      <div class="yuu-ai-brand">
        <span class="yuu-ai-dot"></span>
        <span class="yuu-ai-title">AI 问答</span>
        <span class="yuu-ai-subtitle">Yuunagi Library</span>
      </div>
      <div class="yuu-ai-actions">
        <button data-action="new" title="新对话">＋</button>
        <button data-action="history" title="历史">&#8634;</button>
        <button data-action="settings" title="设置">&#9881;</button>
        <button data-action="close" title="关闭">&times;</button>
      </div>
    </header>
    <main class="yuu-ai-main">
      <div class="yuu-ai-empty">
        <div class="yuu-ai-empty-icon">&#10037;</div>
        <h2>向图书馆提问</h2>
        <p>我会从书籍、论文和笔记中检索相关内容，生成带依据的回答。</p>
        <div class="yuu-ai-prompts">
          <button data-prompt="Rabi 模型的有限温度相变怎么理解？">Rabi 模型的有限温度相变怎么理解？</button>
          <button data-prompt="线性响应理论需要哪些前置知识？">线性响应理论需要哪些前置知识？</button>
          <button data-prompt="找几篇和 Berry phase 有关的论文">找几篇和 Berry phase 有关的论文</button>
        </div>
      </div>
      <div class="yuu-ai-messages" hidden></div>
      <aside class="yuu-ai-drawer" data-drawer="history" hidden>
        <div class="yuu-ai-drawer-head">
          <strong>历史会话</strong><button data-action="close-drawer">&times;</button>
        </div>
        <div class="yuu-ai-history-list"></div>
      </aside>
      <aside class="yuu-ai-drawer yuu-ai-settings" data-drawer="settings" hidden>
        <div class="yuu-ai-drawer-head">
          <strong>设置</strong><button data-action="close-drawer">&times;</button>
        </div>
        <div class="yuu-ai-field">
          <label>API Provider</label>
          <select id="yuu-setting-provider">
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="deepseek">DeepSeek</option>
            <option value="openai">OpenAI</option>
            <option value="siliconflow">硅基流动</option>
            <option value="openrouter">OpenRouter</option>
            <option value="zhipu">智谱 GLM</option>
            <option value="dashscope">通义千问</option>
            <option value="ollama">Ollama</option>
            <option value="gemini">Gemini</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div class="yuu-ai-field">
          <label>Base URL</label>
          <input id="yuu-setting-base-url" type="text" placeholder="自动填充……">
        </div>
        <div class="yuu-ai-field">
          <label>Model</label>
          <input id="yuu-setting-model" type="text" placeholder="自动填充……">
        </div>
        <div class="yuu-ai-field">
          <label>API Key</label>
          <input id="yuu-setting-api-key" type="password" placeholder="sk-……">
        </div>
        <label class="yuu-ai-check-row">
          <input id="yuu-setting-remember" type="checkbox">
          <span class="yuu-ai-check-box" aria-hidden="true"></span>
          <span class="yuu-ai-check-text">
            <strong>记住 API Key</strong>
            <small>默认关闭。开启后才保存到本地浏览器。</small>
          </span>
        </label>
        <label class="yuu-ai-check-row">
          <input id="yuu-setting-debug" type="checkbox">
          <span class="yuu-ai-check-box" aria-hidden="true"></span>
          <span class="yuu-ai-check-text">
            <strong>检索调试模式</strong>
            <small>显示命中节点、匹配分数和发给模型的 context。</small>
          </span>
        </label>
        <label class="yuu-ai-check-row">
          <input id="yuu-setting-thinking" type="checkbox">
          <span class="yuu-ai-check-box" aria-hidden="true"></span>
          <span class="yuu-ai-check-text">
            <strong>思考模式</strong>
            <small>开启后模型先思考再回答（更慢但更准，占用 token 预算）。仅 DeepSeek/Anthropic 有效。</small>
          </span>
        </label>
        <div class="yuu-ai-settings-actions">
          <button id="yuu-settings-save" class="yuu-ai-save-btn">保存设置</button>
          <button id="yuu-settings-test" class="yuu-ai-test-btn">测试连接</button>
          <button id="yuu-settings-clear-key" class="yuu-ai-clear-btn">清除 API Key</button>
        </div>
        <div id="yuu-test-status" class="yuu-ai-test-status" data-status="idle"></div>
      </aside>
    </main>
    <footer class="yuu-ai-composer">
      <textarea rows="1" placeholder="输入问题，从图书馆中检索答案……"></textarea>
      <button class="yuu-ai-send" data-action="send" aria-label="发送">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </footer>
  </section>
</div>`;
    document.body.appendChild(el);

    root = el.querySelector(".yuu-ai");
    emptyEl = root.querySelector(".yuu-ai-empty");
    messagesEl = root.querySelector(".yuu-ai-messages");
    composerInput = root.querySelector(".yuu-ai-composer textarea");
    sendBtn = root.querySelector(".yuu-ai-send");

    // Single delegated event listener — data-action based
    root.addEventListener("click", handleAction);
    // 动态建议问题：根据当前页面上下文生成，无上下文则保留默认
    injectDynamicSuggestions();
    // Prompt suggestion clicks
    root.querySelectorAll("[data-prompt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        composerInput.value = btn.dataset.prompt;
        handleSend();
      });
    });
    // Enter to send
    composerInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
    composerInput.addEventListener("input", () => {
      composerInput.style.height = "auto";
      composerInput.style.height = Math.min(composerInput.scrollHeight, 150) + "px";
    });
    // Provider change → update placeholders
    document.getElementById("yuu-setting-provider").addEventListener("change", onProviderChange);
    document.getElementById("yuu-settings-save").addEventListener("click", saveSettings);
    document.getElementById("yuu-settings-test").addEventListener("click", testConnection);
    document.getElementById("yuu-settings-clear-key").addEventListener("click", clearApiKey);
    loadSettingsForm();

    // Restore messages from session
    if (chatHistory.length) {
      hideEmpty();
      for (const msg of chatHistory) appendMessageBubble(msg.role, msg.content);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // State machine — one function per transition
  // ══════════════════════════════════════════════════════════════════════════

  function openChat() {
    root.dataset.state = "open";
    closeDrawer();
    composerInput.focus();
    loadIndexes().catch(() => {});
  }
  function closeChat() {
    root.dataset.state = "closed";
  }
  function openDrawer(name) {
    closeDrawer();
    const drawer = root.querySelector(`[data-drawer="${name}"]`);
    if (!drawer) return;
    if (name === "history") renderHistoryList(drawer.querySelector(".yuu-ai-history-list"));
    drawer.hidden = false;
  }
  function closeDrawer() {
    root.querySelectorAll(".yuu-ai-drawer").forEach((d) => {
      d.hidden = true;
    });
  }
  function hideEmpty() {
    emptyEl.hidden = true;
    messagesEl.hidden = false;
  }
  function showEmpty() {
    emptyEl.hidden = false;
    messagesEl.hidden = true;
    messagesEl.innerHTML = "";
  }
  function newSession() {
    archiveCurrentSession();
    chatHistory = [];
    saveSession();
    closeDrawer();
    showEmpty();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Action dispatcher
  // ══════════════════════════════════════════════════════════════════════════

  function handleAction(event) {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "open") openChat();
    else if (action === "close") closeChat();
    else if (action === "new") newSession();
    else if (action === "history") openDrawer("history");
    else if (action === "settings") openDrawer("settings");
    else if (action === "close-drawer") closeDrawer();
    else if (action === "send") handleSend();
  }

  function renderHistoryList(list) {
    const sessions = loadArchivedSessions();
    if (!sessions.length) {
      list.innerHTML =
        '<div class="yuu-history-empty">暂无历史会话。<br>开始新对话后，旧会话自动存档。</div>';
      return;
    }
    list.innerHTML = sessions
      .map((s) => {
        const d = new Date(s.date);
        const ds = d.toLocaleString("zh-CN", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        return `<div class="yuu-history-item" data-id="${s.id}">
        <span class="yuu-history-title">${escHtml(s.title)}</span>
        <span class="yuu-history-date">${ds} · ${s.messages.length} 条</span>
        <button class="yuu-history-del" data-id="${s.id}" title="删除">&times;</button>
      </div>`;
      })
      .join("");
    list.querySelectorAll(".yuu-history-item").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.classList.contains("yuu-history-del")) return;
        restoreArchivedSession(el.dataset.id);
        closeDrawer();
      });
    });
    list.querySelectorAll(".yuu-history-del").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        removeArchivedSession(el.dataset.id);
        renderHistoryList(list);
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Settings form
  // ══════════════════════════════════════════════════════════════════════════

  function onProviderChange() {
    const p = document.getElementById("yuu-setting-provider").value;
    const d = {
      anthropic: ["https://api.anthropic.com", "claude-sonnet-4-6"],
      deepseek: ["https://api.deepseek.com", "deepseek-v4-flash"],
      openai: ["https://api.openai.com", "gpt-4o"],
      siliconflow: ["https://api.siliconflow.cn", "deepseek-ai/DeepSeek-V3"],
      openrouter: ["https://openrouter.ai/api", "anthropic/claude-sonnet-4"],
      zhipu: ["https://open.bigmodel.cn/api/paas/v4", "glm-4"],
      dashscope: ["https://dashscope.aliyuncs.com/compatible-mode/v1", "qwen-plus"],
      ollama: ["http://localhost:11434", "llama3"],
      gemini: ["https://generativelanguage.googleapis.com/v1beta/openai", "gemini-2.5-flash"],
      custom: ["", ""],
    }[p];
    document.getElementById("yuu-setting-base-url").placeholder = d[0] || "https://...";
    document.getElementById("yuu-setting-model").placeholder = d[1] || "model-name";
  }
  function loadSettingsForm() {
    document.getElementById("yuu-setting-provider").value = Settings.get("provider");
    document.getElementById("yuu-setting-base-url").value = Settings.get("base_url");
    document.getElementById("yuu-setting-model").value = Settings.get("model");
    document.getElementById("yuu-setting-api-key").value = Settings.get("api_key");
    document.getElementById("yuu-setting-remember").checked =
      Settings.get("remember_key") === "true";
    document.getElementById("yuu-setting-debug").checked =
      localStorage.getItem("yuu_chat_debug") === "1";
    document.getElementById("yuu-setting-thinking").checked =
      localStorage.getItem("yuu_chat_thinking") !== "0"; // 默认开
    onProviderChange();
  }
  function saveSettings() {
    const remember = document.getElementById("yuu-setting-remember").checked;
    Settings.set("provider", document.getElementById("yuu-setting-provider").value);
    Settings.set("base_url", document.getElementById("yuu-setting-base-url").value);
    Settings.set("model", document.getElementById("yuu-setting-model").value);
    Settings.set("api_key", document.getElementById("yuu-setting-api-key").value);
    Settings.set("remember_key", remember ? "true" : "false");
    if (!remember) localStorage.removeItem("yuu_chat_api_key");
    const debug = document.getElementById("yuu-setting-debug").checked;
    if (debug) localStorage.setItem("yuu_chat_debug", "1");
    else localStorage.removeItem("yuu_chat_debug");
    const thinking = document.getElementById("yuu-setting-thinking").checked;
    if (thinking)
      localStorage.removeItem("yuu_chat_thinking"); // 默认开 = key 不存在
    else localStorage.setItem("yuu_chat_thinking", "0");
    closeDrawer();
  }

  function clearApiKey() {
    document.getElementById("yuu-setting-api-key").value = "";
    sessionStorage.removeItem("yuu_chat_api_key");
    localStorage.removeItem("yuu_chat_api_key");
    setTestStatus("idle", "");
  }

  async function testConnection() {
    const provider = document.getElementById("yuu-setting-provider").value;
    const apiKey =
      document.getElementById("yuu-setting-api-key").value.trim() || Settings.get("api_key");
    if (!apiKey) {
      setTestStatus("error", "请先填写 API Key");
      return;
    }

    const model = (
      document.getElementById("yuu-setting-model").value ||
      document.getElementById("yuu-setting-model").placeholder
    ).trim();
    let baseUrl = (
      document.getElementById("yuu-setting-base-url").value ||
      document.getElementById("yuu-setting-base-url").placeholder
    ).trim();
    baseUrl = baseUrl.replace(/\/+$/, "");
    if (!baseUrl) {
      setTestStatus("error", "请先填写 Base URL 或选择 Provider");
      return;
    }

    setTestStatus("loading", "正在测试……");
    const btn = document.getElementById("yuu-settings-test");
    btn.disabled = true;

    try {
      const isAnthropic = provider === "anthropic";
      let url, headers, body;

      if (isAnthropic) {
        url = `${baseUrl}/v1/messages`;
        headers = {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        };
        body = JSON.stringify({
          model,
          max_tokens: 8,
          messages: [{ role: "user", content: "ping" }],
        });
      } else {
        url = `${baseUrl}/v1/chat/completions`;
        headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
        body = JSON.stringify({
          model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 8,
          stream: false,
        });
      }

      const resp = await fetch(url, { method: "POST", headers, body });

      if (resp.ok) {
        setTestStatus("success", "连接成功");
      } else {
        const status = resp.status;
        const text = await resp.text().catch(() => "");
        let msg = "";
        try {
          msg = JSON.parse(text).error?.message || "";
        } catch (_) {
          /* ignore */
        }
        if (status === 401) msg = "API Key 无效";
        else if (status === 403) msg = "无权限或浏览器跨域受限";
        else if (status === 404) msg = "Base URL 或模型不存在";
        else if (status === 429) msg = "请求过多或余额不足";
        else if (!msg) msg = `HTTP ${status}`;
        setTestStatus("error", `连接失败: ${msg}`);
      }
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError"))
        setTestStatus("error", "连接失败: 可能是 CORS、网络或 Base URL 错误");
      else setTestStatus("error", `连接失败: ${msg.slice(0, 80)}`);
    }
    btn.disabled = false;
  }

  function setTestStatus(status, text) {
    const el = document.getElementById("yuu-test-status");
    if (!el) return;
    el.dataset.status = status;
    el.textContent = text || "";
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Messages
  // ══════════════════════════════════════════════════════════════════════════

  function appendMessageBubble(role, text) {
    const el = document.createElement("div");
    el.className = `yuu-ai-message ${role}`;
    if (role === "assistant") {
      el.innerHTML = `<div class="yuu-msg-content">${text}</div>`;
    } else {
      el.textContent = text;
    }
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return role === "assistant" ? el.querySelector(".yuu-msg-content") : el;
  }

  function setBusy(busy) {
    sendBtn.disabled = busy;
    composerInput.disabled = busy;
  }

  function reRenderKatex(el) {
    if (typeof renderMathInElement !== "function") return;
    try {
      renderMathInElement(el, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
    } catch (_) {
      /* ignore */
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Debug card
  // ══════════════════════════════════════════════════════════════════════════

  function renderDebugCard(hits, contexts, systemPrompt, confidence) {
    const hitRows = hits
      .map((h, i) => {
        const used = contexts.some(
          (c) =>
            c.nodeId === h.node.node_id &&
            c.docTitle === (docCache[h.node.doc_id]?.tree?.title || "")
        );
        return `<tr class="${used ? "yuu-debug-used" : ""}">
        <td>${i + 1}</td><td>${h.score}</td><td>${escHtml(h.node.doc_id)}</td>
        <td>${escHtml((h.node.breadcrumb || []).join(" > "))}</td>
        <td>${used ? "✓" : ""}</td>
      </tr>`;
      })
      .join("");
    const ctxBlocks = contexts
      .map((c, i) => {
        const textPreview = escHtml(c.text.slice(0, 120));
        return `<div class="yuu-debug-ctx">
        <strong>[${i + 1}] ${escHtml(c.docTitle)} &gt; ${escHtml(c.breadcrumb.join(" > "))}</strong>
        <span class="yuu-debug-ctx-meta">${c.text.length} chars | ${escHtml(c.sourceId || "")} | ${escHtml(c.url || "")}</span>
        <pre>${textPreview}…</pre>
      </div>`;
      })
      .join("");
    const promptPreview = escHtml(systemPrompt.slice(0, 800));
    const totalChars = contexts.reduce((sum, c) => sum + c.text.length, 0);
    return `<details class="yuu-debug-card">
      <summary>检索调试: ${hits.length} hits → ${contexts.length} contexts (${totalChars} chars) | 置信度: ${confidence || "?"}</summary>
      <div class="yuu-debug-section">
        <h4>Search Hits</h4>
        <table class="yuu-debug-table"><thead><tr><th>#</th><th>分数</th><th>文档</th><th>路径</th><th>命中</th></tr></thead><tbody>${hitRows}</tbody></table>
      </div>
      <div class="yuu-debug-section">
        <h4>Context Chunks</h4>
        ${ctxBlocks}
      </div>
      <div class="yuu-debug-section">
        <h4>System Prompt <span class="yuu-debug-ctx-meta">(${systemPrompt.length} chars)</span></h4>
        <pre class="yuu-debug-prompt">${promptPreview}…</pre>
      </div>
    </details>`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Send — search → retrieve → reason → stream
  // ══════════════════════════════════════════════════════════════════════════

  // 渲染思考块 + 正文：思考折叠在 <details>，正文正常 markdown
  function renderThinkingAndText(thinking, text, toolTrail) {
    const parts = [];
    if (thinking) {
      parts.push(
        `<details class="yuu-thinking"><summary>💭 思考过程</summary><div class="yuu-thinking-body">${renderMarkdown(
          thinking
        )}</div></details>`
      );
    }
    if (toolTrail && toolTrail.length) {
      parts.push(`<div class="yuu-tool-trail">${toolTrail.join("")}</div>`);
    }
    if (text) {
      parts.push(renderMarkdown(text));
    } else if (!parts.length) {
      parts.push("<em>……</em>");
    }
    return parts.join("");
  }

  async function handleSend() {
    const query = composerInput.value.trim();
    if (!query) return;
    const cfg = Settings.resolve();
    if (!cfg.apiKey) {
      openDrawer("settings");
      return;
    }

    composerInput.value = "";
    composerInput.style.height = "auto";
    hideEmpty();
    appendMessageBubble("user", query);
    chatHistory.push({ role: "user", content: query });
    saveSession();

    try {
      await loadIndexes();
    } catch (_) {
      return;
    }

    const contentEl = appendMessageBubble("assistant", "<em>准备中……</em>");
    setBusy(true);

    const thinkingOn = localStorage.getItem("yuu_chat_thinking") !== "0"; // 默认开
    const debugOn = localStorage.getItem("yuu_chat_debug") === "1";
    const systemPrompt = buildAgentSystemPrompt();
    const messages = [...chatHistory.slice(-6)];
    const MAX_LOOPS = 4; // 最多 4 轮工具调用，防死循环

    // 感知历史的 token budget：预先算 history + system 占用，传给检索层
    const budgetCtx = {
      historyTokens: messages.reduce((s, m) => s + estimateTokens(m.content || ""), 0),
      systemTokens: estimateTokens(systemPrompt),
    };

    let finalText = "";
    let finalThinking = "";
    const allContexts = []; // 累积所有轮检索到的 context，供最终引用注入
    const seenSourceIds = new Set(); // 跨轮去重（按 sourceId）
    const toolTrail = []; // UI 工具调用轨迹 HTML 片段

    try {
      for (let loop = 0; loop < MAX_LOOPS; loop++) {
        let roundText = "";
        let roundThinking = "";
        let toolCalls = null;
        let stopReason = null;

        // 流式渲染本轮
        for await (const chunk of streamText({
          provider: cfg.provider,
          model: cfg.model,
          baseUrl: cfg.baseUrl,
          apiKey: cfg.apiKey,
          system: systemPrompt,
          messages,
          tools: LIBRARY_TOOLS,
          thinking: thinkingOn,
          maxTokens: thinkingOn ? 8192 : 4096,
        })) {
          if (chunk.type === "thinking") {
            roundThinking += chunk.text;
            finalThinking += chunk.text;
            contentEl.innerHTML = renderThinkingAndText(finalThinking, roundText, toolTrail);
          } else if (chunk.type === "text") {
            roundText += chunk.text;
            finalText = roundText;
            contentEl.innerHTML = renderThinkingAndText(finalThinking, finalText, toolTrail);
            reRenderKatex(contentEl);
          } else if (chunk.type === "tool_calls") {
            toolCalls = chunk.calls;
          } else if (chunk.type === "stop") {
            stopReason = chunk.reason;
          }
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        // 没有工具调用 → 本轮是最终回答，退出循环
        if (stopReason !== "tool_calls" || !toolCalls?.length) break;

        // 执行工具，回填到 messages
        messages.push({
          role: "assistant",
          content: roundText || null,
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: { name: tc.name, arguments: tc.arguments },
          })),
        });
        for (const tc of toolCalls) {
          let args = {};
          try {
            args = JSON.parse(tc.arguments || "{}");
          } catch (_) {
            /* ignore */
          }
          // UI: 显示工具调用过程
          toolTrail.push(
            `<div class="yuu-tool-step">🔍 检索: <code>${escHtml(args.query || tc.arguments)}</code></div>`
          );
          contentEl.innerHTML = renderThinkingAndText(finalThinking, finalText, toolTrail);

          const toolResult = await executeTool(tc.name, args, budgetCtx);
          // 累积 context 供最终引用注入（跨轮按 sourceId 去重）
          if (toolResult.__contexts) {
            for (const c of toolResult.__contexts) {
              if (!seenSourceIds.has(c.sourceId)) {
                allContexts.push(c);
                seenSourceIds.add(c.sourceId);
              }
            }
          }

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: toolResult.text || JSON.stringify(toolResult),
          });
        }
        // 下一轮提示
        contentEl.innerHTML = renderThinkingAndText(
          finalThinking,
          "<em>已检索，正在综合回答……</em>",
          toolTrail
        );
        finalText = "";
      }

      // 引用注入：用所有轮累积的 allContexts 构建 refMap
      if (allContexts.length) {
        const refMap = {};
        const seen = new Set();
        let n = 0;
        for (const c of allContexts) {
          const hash = c.text.slice(0, 80);
          if (seen.has(hash)) continue;
          seen.add(hash);
          n++;
          if (c.url) refMap[n] = { title: c.docTitle, breadcrumb: c.breadcrumb, url: c.url };
        }
        if (Object.keys(refMap).length > 0) {
          finalText = injectReferenceLinks(finalText, refMap);
        }
      }

      // debug 卡片（如果有 context）
      if (debugOn && allContexts.length) {
        const debugHits = allContexts.slice(0, 12).map((c, i) => ({
          node: { doc_id: c.docTitle, node_id: c.nodeId, breadcrumb: c.breadcrumb },
          score: "?",
        }));
        contentEl.innerHTML =
          renderThinkingAndText(finalThinking, finalText, toolTrail) +
          renderDebugCard(debugHits, allContexts.slice(0, 8), systemPrompt, "agent");
      } else {
        contentEl.innerHTML = renderThinkingAndText(finalThinking, finalText, toolTrail);
      }
      reRenderKatex(contentEl);

      chatHistory.push({ role: "assistant", content: finalText });
      if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
      saveSession();
    } catch (e) {
      contentEl.innerHTML += `<br><span style="color:#dc2626">错误: ${escHtml(e.message)}</span>`;
    }
    setBusy(false);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Dynamic suggestions — 从当前页面上下文生成建议问题
  // ══════════════════════════════════════════════════════════════════════════

  function getPageTitle() {
    // 优先 article h1，其次 document.title 去掉站点后缀
    const h1 = document.querySelector("article h1, main h1, h1");
    if (h1 && h1.textContent.trim()) return h1.textContent.trim();
    const t = document.title || "";
    return t.replace(/\s*[•·-]\s*Yuunagi.*$/i, "").trim();
  }

  function buildDynamicSuggestions() {
    const path = location.pathname;
    const title = getPageTitle();
    if (!title || title.length < 2) return null;
    const isBook = /\/books?\//.test(path);
    const isPaper = /\/papers?\//.test(path);
    const short = title.length > 20 ? title.slice(0, 20) + "…" : title;
    if (isBook) {
      return [
        `总结「${short}」的核心内容`,
        `「${short}」需要哪些前置知识？`,
        `「${short}」有什么实际应用？`,
      ];
    }
    if (isPaper) {
      return [
        `解释「${short}」的核心贡献`,
        `「${short}」用了哪些关键方法？`,
        `「${short}」和哪些理论相关？`,
      ];
    }
    // 首页或其他：用标题做通用建议，但只在标题像"主题"时
    if (title.length <= 16 && !/^(首页|home|index|关于|about)$/i.test(title)) {
      return [
        `介绍一下「${title}」`,
        `「${title}」的核心概念是什么？`,
        `关于「${title}」有哪些参考资料？`,
      ];
    }
    return null;
  }

  function injectDynamicSuggestions() {
    const suggestions = buildDynamicSuggestions();
    if (!suggestions) return;
    const container = root.querySelector(".yuu-ai-prompts");
    if (!container) return;
    container.innerHTML = suggestions
      .map((s) => `<button data-prompt="${escHtml(s)}">${escHtml(s)}</button>`)
      .join("");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Init
  // ══════════════════════════════════════════════════════════════════════════

  function init() {
    if (!document.getElementById("yuu-chat-root")) createDOM();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
