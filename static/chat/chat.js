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
    const FIELDS = ["title", "breadcrumb", "terms", "excerpt"];
    let totalLen = 0;
    const fieldLen = { title: 0, breadcrumb: 0, terms: 0, excerpt: 0 };
    for (const node of nodes) {
      const fieldText = {
        title: node.title || "",
        breadcrumb: (node.breadcrumb || []).join(" "),
        terms: (node.terms || []).join(" "),
        excerpt: node.excerpt || "",
      };
      for (const f of FIELDS) {
        const toks = tokenize(fieldText[f]);
        fieldLen[f] += toks.length;
        for (const t of new Set(toks)) df.set(t, (df.get(t) || 0) + 1);
      }
      totalLen += tokenize(
        fieldText.title + fieldText.breadcrumb + fieldText.terms + fieldText.excerpt
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
        excerpt: fieldLen.excerpt / N,
      },
    };
  }

  // 字段权重：title 最高，breadcrumb 次之，terms/excerpt 正常
  const FIELD_BOOST = { title: 6, breadcrumb: 3, terms: 2, excerpt: 1 };
  const BM25_K = 1.5,
    BM25_B = 0.75;

  function bm25Score(queryTokens, node) {
    const stats = bm25Stats;
    let total = 0;
    const FIELDS = ["title", "breadcrumb", "terms", "excerpt"];
    const fieldText = {
      title: node.title || "",
      breadcrumb: (node.breadcrumb || []).join(" "),
      terms: (node.terms || []).join(" "),
      excerpt: node.excerpt || "",
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

  function search(query, topK = 10) {
    if (!nodeIndex) return [];
    buildBM25Stats();
    let tokens = tokenize(query);
    if (!tokens.length) return [];
    tokens = expandQuery(tokens, query);
    const scored = [];
    for (const node of nodeIndex.nodes) {
      const s = bm25Score(tokens, node);
      if (s > 0) scored.push({ node, score: Math.round(s * 100) / 100 });
    }
    scored.sort((a, b) => b.score - a.score);
    const seen = new Set(),
      results = [];
    for (const item of scored) {
      if ([...seen].filter((id) => id === item.node.doc_id).length < 3) {
        results.push(item);
        seen.add(item.node.doc_id);
      }
      if (results.length >= topK * 2) break;
    }
    return results.slice(0, topK);
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

  function buildContextChunk(doc, nodeId, docMeta) {
    const flat = doc.flat;
    const idx = flat.findIndex((n) => n.node_id === nodeId);
    if (idx < 0) return null;
    const node = flat[idx],
      crumb = node._crumb || [node.title],
      text = node.text || "";
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
    const hits = search(query);
    if (!hits.length) return { contexts: [], docCount: 0, thin: true };
    const uniqueDocs = [...new Set(hits.map((h) => h.node.doc_id))].slice(0, 6);
    await Promise.all(uniqueDocs.map(loadDocTree));
    const contexts = [],
      seenNodes = new Set();
    for (const hit of hits.slice(0, 8)) {
      const doc = docCache[hit.node.doc_id];
      if (!doc) continue;
      if (seenNodes.has(hit.node.doc_id + ":" + hit.node.node_id)) continue;
      seenNodes.add(hit.node.doc_id + ":" + hit.node.node_id);
      const ctx = buildContextChunk(doc, hit.node.node_id, doc.tree);
      if (ctx && ctx.text) {
        ctx.url = hit.node.url || "";
        contexts.push(ctx);
      }
    }
    let thin = contexts.length < 2;
    if (thin && query.length > 4) {
      for (const term of tokenize(query).slice(0, 3)) {
        for (const hit of search(term, 4)) {
          if (!docCache[hit.node.doc_id]) await loadDocTree(hit.node.doc_id);
          const d = docCache[hit.node.doc_id];
          if (!d || seenNodes.has(hit.node.doc_id + ":" + hit.node.node_id)) continue;
          seenNodes.add(hit.node.doc_id + ":" + hit.node.node_id);
          const ctx = buildContextChunk(d, hit.node.node_id, d.tree);
          if (ctx && ctx.text) {
            ctx.url = hit.node.url || "";
            contexts.push(ctx);
          }
          if (contexts.length >= 6) break;
        }
        if (contexts.length >= 6) break;
      }
      thin = contexts.length < 2;
    }
    // 检索置信度分级：基于 top score 与 source 分布。驱动 system prompt 的"边界感"。
    // 阈值经真实索引(5690节点)校准：强命中>80，中等30-80，弱<30。
    const topScore = hits[0]?.score || 0;
    const secondScore = hits[1]?.score || 0;
    const sourceCount = uniqueDocs.length;
    let confidence = "low";
    if (topScore >= 80 && sourceCount >= 2 && secondScore / topScore > 0.2) confidence = "high";
    else if (topScore >= 30 || (topScore >= 15 && sourceCount >= 2)) confidence = "medium";
    return { contexts, docCount: sourceCount, thin, confidence, hits: hits.slice(0, 12) };
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
          "在个人数字图书馆中检索书籍、论文、笔记内容。当需要查找事实、概念、章节内容、文献时使用。可用不同的关键词多次检索以覆盖不同角度。",
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
  ];

  // retrieveContext 返回结构化 contexts，这里转成给模型的纯文本（agent 模式）
  async function retrieveContextAsText(query) {
    const result = await retrieveContext(query);
    const { contexts, confidence } = result;
    if (!contexts.length) return { text: "未找到相关内容。", contexts: [], confidence };
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

  // 执行工具调用，返回字符串结果
  async function executeTool(name, args) {
    if (name === "search_library") {
      const r = await retrieveContextAsText(args.query);
      // 把 contexts 挂到返回值上，供 agent loop 累积引用
      r.__contexts = r.contexts;
      return r;
    }
    return { text: `未知工具: ${name}` };
  }

  // agent 模式的 system prompt：不预填 context（模型自己用工具查）
  function buildAgentSystemPrompt() {
    return `你是 **Yuunagi Library** 的知识助手，基于个人数字图书馆的 RAG 问答系统。

## 工作方式
- 你有 search_library 工具，可以检索图书馆中的书籍、论文、笔记
- 回答用户问题前，**必须先调用 search_library 检索**，不要凭记忆回答
- 如果第一次检索结果不够，可以换关键词再检索，或从不同角度多检索几次
- 只能基于检索到的内容回答，不要使用外部知识编造

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

    let finalText = "";
    let finalThinking = "";
    const allContexts = []; // 累积所有轮检索到的 context，供最终引用注入
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

          const toolResult = await executeTool(tc.name, args);
          // 累积 context 供最终引用注入
          if (toolResult.__contexts) allContexts.push(...toolResult.__contexts);

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
