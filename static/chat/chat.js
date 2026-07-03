/**
 * Yuunagi Library — Chat Agent
 * BYOK browser-direct mode. PageIndex tree retrieval + multi-provider LLM.
 * Zero dependencies. ~30 KB.
 *
 * ## Reuse in other projects
 * 1. Copy static/chat/chat.js + chat.css into your project
 * 2. Include them in your HTML <head>:
 *    <link rel="stylesheet" href="chat/chat.css">
 *    <script>window.YUU_CHAT_BASE = "/your-base-path/";</script>
 *    <script defer src="chat/chat.js"></script>
 * 3. Generate PageIndex JSONs at {BASE}pageindex/ via scripts/build_pageindex.py
 */
(function () {
  "use strict";

  const BASE = window.YUU_CHAT_BASE || "";
  const PAGEINDEX = `${BASE}pageindex`;

  // ── State ────────────────────────────────────────────────────────────────
  let globalIndex = null;
  let nodeIndex = null;
  let docCache = {};
  const CHAT_SESSION_KEY = "yuu_chat_session";
  const SESSIONS_ARCHIVE_KEY = "yuu_chat_sessions_archive";
  const MAX_ARCHIVED = 20;
  let chatHistory = loadSession();
  let indexReady = false;

  function loadSession() {
    try {
      const raw = sessionStorage.getItem(CHAT_SESSION_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }
  function saveSession() {
    try { sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(chatHistory)); } catch (_) {}
  }

  // ── Archived sessions (localStorage) ───────────────────────────────────

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
    try { localStorage.setItem(SESSIONS_ARCHIVE_KEY, JSON.stringify(sessions)); } catch (_) {}
  }

  function loadArchivedSessions() {
    try {
      const raw = localStorage.getItem(SESSIONS_ARCHIVE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function restoreArchivedSession(id) {
    const sessions = loadArchivedSessions();
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    // Archive current session first
    if (chatHistory.length) archiveCurrentSession();
    chatHistory = s.messages;
    saveSession();
    // Rebuild DOM
    messagesEl.innerHTML = "";
    for (const msg of chatHistory) {
      addMessage(msg.role, msg.content);
    }
    addMessage("system", "已恢复历史会话: " + s.title);
  }

  function removeArchivedSession(id) {
    let sessions = loadArchivedSessions();
    sessions = sessions.filter((x) => x.id !== id);
    try { localStorage.setItem(SESSIONS_ARCHIVE_KEY, JSON.stringify(sessions)); } catch (_) {}
    return sessions;
  }

  // ── DOM refs ─────────────────────────────────────────────────────────────
  let fab, panel, messagesEl, inputEl, sendBtn, settingsEl;

  // ══════════════════════════════════════════════════════════════════════════
  // Mini Provider SDK — unified streaming across Anthropic / OpenAI / DeepSeek
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Unified SSE stream reader. Detects format from response body.
   *   Anthropic:  data: {"type":"content_block_delta","delta":{"text":"..."}}
   *   OpenAI:     data: {"choices":[{"delta":{"content":"..."}}]}
   * Yields text chunks.
   */
  async function* readSSE(response) {
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let msg = `HTTP ${response.status}`;
      try { const j = JSON.parse(text); msg = j.error?.message || msg; } catch (_) {}
      throw new Error(msg);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
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
          // Anthropic format
          if (json.type === "content_block_delta" && json.delta?.text) {
            yield json.delta.text;
          } else if (json.type === "message_stop") {
            return;
          }
          // OpenAI format
          const c = json.choices?.[0]?.delta?.content;
          if (c) yield c;
        } catch (_) {}
      }
    }
  }

  function buildRequest({ provider, model, baseUrl, apiKey, system, messages, maxTokens }) {
    // Anthropic-format (also used by DeepSeek /anthropic endpoint)
    if (provider === "anthropic" || provider === "deepseek") {
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
          max_tokens: maxTokens || 2048,
          system,
          messages,
          stream: true,
        }),
      };
    }
    // OpenAI-format (OpenAI, DeepSeek /v1, custom)
    return {
      url: `${baseUrl}/v1/chat/completions`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens || 2048,
        messages: [{ role: "system", content: system }, ...messages],
        stream: true,
      }),
    };
  }

  async function* streamText({ provider, model, baseUrl, apiKey, system, messages, maxTokens }) {
    const req = buildRequest({ provider, model, baseUrl, apiKey, system, messages, maxTokens });
    const resp = await fetch(req.url, {
      method: "POST",
      headers: req.headers,
      body: req.body,
    });
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
      const ls = localStorage.getItem(this._pfx + key);
      return ls || this._defaults()[key] || "";
    },

    set(key, val) {
      sessionStorage.setItem(this._pfx + key, val);
      if (key === "remember_key") {
        if (val === "true") {
          const k = this.get("api_key");
          if (k) localStorage.setItem(this._pfx + "api_key", k);
        } else {
          localStorage.removeItem(this._pfx + "api_key");
        }
      }
      if (key !== "api_key" && key !== "remember_key") {
        try { localStorage.setItem(this._pfx + key, val); } catch (_) {}
      }
      // API key: only persist to localStorage if remember is on
      if (key === "api_key" && this.get("remember_key") === "true") {
        localStorage.setItem(this._pfx + key, val);
      }
    },

    resolve() {
      const p = this.get("provider");
      const model = this.get("model") || {
        anthropic: "claude-sonnet-4-6", deepseek: "deepseek-v4-flash",
        openai: "gpt-4o", siliconflow: "deepseek-ai/DeepSeek-V3",
        openrouter: "anthropic/claude-sonnet-4", zhipu: "glm-4",
        dashscope: "qwen-plus", ollama: "llama3", gemini: "gemini-2.5-flash",
        custom: "",
      }[p] || "";
      const baseUrl = this.get("base_url") || {
        anthropic: "https://api.anthropic.com",
        deepseek: "https://api.deepseek.com/anthropic",
        openai: "https://api.openai.com",
        siliconflow: "https://api.siliconflow.cn",
        openrouter: "https://openrouter.ai/api",
        zhipu: "https://open.bigmodel.cn/api/paas/v4",
        dashscope: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        ollama: "http://localhost:11434",
        gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
      }[p] || "";
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

  function tokenize(text) {
    const tokens = [];
    for (const c of text.match(/[一-鿿]/g) || []) tokens.push(c);
    for (const w of text.match(/[a-zA-Z0-9]{2,}/g) || []) tokens.push(w.toLowerCase());
    return [...new Set(tokens)];
  }

  function scoreNode(queryTokens, node) {
    let s = 0;
    const title = (node.title || "").toLowerCase();
    const excerpt = (node.excerpt || "").toLowerCase();
    const terms = (node.terms || []).join(" ").toLowerCase();
    const crumb = (node.breadcrumb || []).join(" ").toLowerCase();
    for (const qt of queryTokens) {
      const q = qt.toLowerCase();
      if (title.includes(q)) s += 10;
      if (crumb.includes(q)) s += 4;
      if (terms.includes(q)) s += 3;
      if (excerpt.includes(q)) s += 1;
    }
    return s;
  }

  function search(query, topK = 10) {
    if (!nodeIndex) return [];
    const tokens = tokenize(query);
    if (!tokens.length) return [];

    const scored = [];
    for (const node of nodeIndex.nodes) {
      const s = scoreNode(tokens, node);
      if (s > 0) scored.push({ node, score: s });
    }
    scored.sort((a, b) => b.score - a.score);

    // Dedup by doc_id for diversity, but allow top 3 from same doc
    const seen = new Set();
    const results = [];
    for (const item of scored) {
      const seenCount = [...seen].filter((id) => id === item.node.doc_id).length;
      if (seenCount < 3) {
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
    const type = doc?.type || "papers";
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

  /** Build hierarchical context from a hit: matched node + parent + siblings + children */
  function buildContextChunk(doc, nodeId, docMeta) {
    const flat = doc.flat;
    const idx = flat.findIndex((n) => n.node_id === nodeId);
    if (idx < 0) return null;

    const node = flat[idx];
    const crumb = node._crumb || [node.title];
    const text = node.text || "";

    // Parent: one level up
    const parent = crumb.length > 1
      ? flat.find((n) => n._crumb?.length === crumb.length - 1 &&
          crumb.slice(0, -1).every((t, i) => n._crumb[i] === t))
      : null;

    // Siblings at same level
    const siblings = flat.filter((n) =>
      n._crumb?.length === crumb.length &&
      n.node_id !== node.node_id &&
      n._crumb?.slice(0, -1).every((t, i) => crumb[i] === t)
    ).slice(0, 4);

    // Direct children (first layer)
    const children = flat.filter((n) =>
      n._crumb?.length === crumb.length + 1 &&
      n._crumb?.slice(0, -1).every((t, i) => crumb[i] === t)
    ).slice(0, 4);

    return {
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

    // Load full trees for top docs
    const uniqueDocs = [...new Set(hits.map((h) => h.node.doc_id))].slice(0, 6);
    await Promise.all(uniqueDocs.map(loadDocTree));

    const contexts = [];
    const seenNodes = new Set();
    for (const hit of hits.slice(0, 8)) {
      const doc = docCache[hit.node.doc_id];
      if (!doc) continue;
      if (seenNodes.has(hit.node.doc_id + ":" + hit.node.node_id)) continue;
      seenNodes.add(hit.node.doc_id + ":" + hit.node.node_id);

      const ctx = buildContextChunk(doc, hit.node.node_id, doc.tree);
      if (ctx && ctx.text) contexts.push(ctx);
    }

    // If thin results, try broader search (split query into individual terms)
    let thin = contexts.length < 2;
    if (thin && query.length > 4) {
      const broadTerms = tokenize(query).slice(0, 3);
      for (const term of broadTerms) {
        const extra = search(term, 4);
        for (const hit of extra) {
          const doc = docCache[hit.node.doc_id];
          if (!doc) { await loadDocTree(hit.node.doc_id); }
          const d = docCache[hit.node.doc_id];
          if (!d || seenNodes.has(hit.node.doc_id + ":" + hit.node.node_id)) continue;
          seenNodes.add(hit.node.doc_id + ":" + hit.node.node_id);
          const ctx = buildContextChunk(d, hit.node.node_id, d.tree);
          if (ctx && ctx.text) contexts.push(ctx);
          if (contexts.length >= 6) break;
        }
        if (contexts.length >= 6) break;
      }
      thin = contexts.length < 2;
    }

    return { contexts, docCount: uniqueDocs.length, thin };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // System prompt — PageIndex-style: structure-first, then content
  // ══════════════════════════════════════════════════════════════════════════

  const MAX_SECTION_CHARS = 2500;

  function buildSystemPrompt(contexts, thin) {
    // Build a condensed "目录概览" — doc-level TOC like PageIndex's get_document_structure()
    const docToc = [];
    const docNames = [...new Set(contexts.map((c) => c.docTitle))];
    for (const name of docNames) {
      const docContexts = contexts.filter((c) => c.docTitle === name);
      const meta = [docContexts[0].docAuthor, docContexts[0].docType].filter(Boolean).join(" · ");
      let entry = `- **${name}**`;
      if (meta) entry += ` (${meta})`;
      entry += ` — ${docContexts.length} 个相关段落`;
      docToc.push(entry);
    }

    // Build detailed context blocks with smart truncation
    const blocks = [];
    const seenContents = new Set();

    for (let i = 0; i < contexts.length; i++) {
      const c = contexts[i];
      const hash = c.text.slice(0, 80);
      if (seenContents.has(hash)) continue;
      seenContents.add(hash);

      const crumb = c.breadcrumb.join(" > ");
      let text = c.text;
      let truncated = false;
      if (text.length > MAX_SECTION_CHARS) {
        text = text.slice(0, MAX_SECTION_CHARS) + "\n\n…[已截断，可追问获取完整内容]…";
        truncated = true;
      }

      let block = `### [${i + 1}] ${crumb}\n`;
      block += `*来源: ${c.docTitle}*\n`;

      // Nearby structure (like flipping through a book's TOC)
      const nearby = [];
      if (c.parentTitle && c.breadcrumb.length > 1) nearby.push(`上级: ${c.parentTitle}`);
      if (c.siblingTitles.length) nearby.push(`同级: ${c.siblingTitles.join(" / ")}`);
      if (c.childTitles.length) nearby.push(`子节: ${c.childTitles.join(" / ")}`);
      if (nearby.length) block += `*${nearby.join("  |  ")}*\n`;

      block += `\n${text}`;
      blocks.push(block);
    }

    const contextBlock = blocks.join("\n\n---\n\n");
    const thinNotice = thin
      ? "\n> **注意**: 本次检索结果较少，回答可能不完整。建议用户尝试更具体的关键词。\n"
      : "";

    return `你是 **Yuunagi Library** 的知识助手——基于个人数字图书馆内容的 RAG 问答系统。

## 检索概览
本次检索命中以下文档：
${docToc.join("\n")}
${thinNotice}
## 推理步骤（PageIndex 式导航）
1. **扫描结构**：先浏览下方各段落标题和层级关系，判断哪些 [N] 与问题最相关
2. **精读内容**：重点阅读匹配度高的段落，忽略无关内容。被截断的段落可追问
3. **交叉验证**：如果多个来源有不同观点，指出差异
4. **组织回答**：先给直接答案，再展开解释。用 [N] 标注每个论断的来源
5. **诚实评估**：Context 不足时明确说"当前图书馆中没有足够依据"，不要编造

## Context（按相关度排序）

${contextBlock}

## 回答规则
- 只能根据 Context 回答，不要使用外部知识
- 每个关键论断标注来源编号，如 "根据 [1]，..."
- 回答末尾列出参考来源：
  参考来源：
  [1] 《文档名》 > 章节 > 节名
- 回答使用中文，专业术语保留原文。公式用 KaTeX：行内 $...$，行间 $$...$
- 如果 Context 中某段被截断且你需要完整内容，告诉用户追问什么关键词`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Markdown → HTML
  // ══════════════════════════════════════════════════════════════════════════

  function renderMarkdown(text) {
    let html = text;
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g,
      (_, lang, code) => `<pre><code class="language-${lang}">${escHtml(code.trim())}</code></pre>`);
    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Bold / italic
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    // Headings
    html = html.replace(/^### (.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^## (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^# (.+)$/gm, "<h2>$1</h2>");
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    // Paragraphs
    html = html.replace(/\n\n/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");
    return `<p>${html}</p>`;
  }

  function escHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UI
  // ══════════════════════════════════════════════════════════════════════════

  function createDOM() {
    const el = document.createElement("div");
    el.id = "yuu-chat-container";
    el.innerHTML = `
      <button id="yuu-chat-fab" title="AI 问答" aria-label="打开 AI 问答">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
      <div id="yuu-chat-panel" class="yuu-chat-hidden">
        <div id="yuu-chat-header">
          <span>Yuunagi Library · AI 问答</span>
          <div id="yuu-chat-header-actions">
            <button id="yuu-chat-new-session-btn" title="新对话" aria-label="新对话">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button id="yuu-chat-history-btn" title="历史会话" aria-label="历史会话">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </button>
            <button id="yuu-chat-settings-btn" title="设置" aria-label="设置">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
                <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
                <circle cx="4" cy="12" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="20" cy="14" r="2"/>
              </svg>
            </button>
            <button id="yuu-chat-close-btn" title="关闭" aria-label="关闭">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div id="yuu-chat-messages"></div>
        <div id="yuu-chat-input-area">
          <textarea id="yuu-chat-input" rows="1" placeholder="输入问题，从图书馆中检索答案……"></textarea>
          <button id="yuu-chat-send-btn" title="发送" aria-label="发送">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        <div id="yuu-chat-history" class="yuu-chat-hidden">
          <div class="yuu-history-header"><span>历史会话</span><button id="yuu-history-close-btn">&times;</button></div>
          <div id="yuu-history-list"></div>
        </div>
        <div id="yuu-chat-settings" class="yuu-chat-hidden">
          <div class="yuu-settings-group">
            <label>API Provider</label>
            <select id="yuu-setting-provider">
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="openai">OpenAI</option>
              <option value="siliconflow">硅基流动 (SiliconFlow)</option>
              <option value="openrouter">OpenRouter</option>
              <option value="zhipu">智谱 (GLM)</option>
              <option value="dashscope">通义千问 (DashScope)</option>
              <option value="ollama">Ollama (本地)</option>
              <option value="gemini">Google Gemini</option>
              <option value="custom">自定义兼容端点</option>
            </select>
          </div>
          <div class="yuu-settings-group">
            <label>Base URL</label>
            <input id="yuu-setting-base-url" type="text" placeholder="自动填充……">
          </div>
          <div class="yuu-settings-group">
            <label>Model</label>
            <input id="yuu-setting-model" type="text" placeholder="自动填充……">
          </div>
          <div class="yuu-settings-group">
            <label>API Key</label>
            <input id="yuu-setting-api-key" type="password" placeholder="sk-……">
            <div class="yuu-setting-hint">默认关页面即清除，勾选下方"记住"仅存本机</div>
          </div>
          <div class="yuu-settings-group yuu-settings-row">
            <input id="yuu-setting-remember" type="checkbox">
            <label for="yuu-setting-remember">记住 API Key（存 localStorage）</label>
          </div>
          <div class="yuu-settings-actions">
            <button id="yuu-settings-save">保存设置</button>
            <button id="yuu-settings-clear" class="yuu-btn-secondary">清除所有数据</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);

    fab = document.getElementById("yuu-chat-fab");
    panel = document.getElementById("yuu-chat-panel");
    messagesEl = document.getElementById("yuu-chat-messages");
    inputEl = document.getElementById("yuu-chat-input");
    sendBtn = document.getElementById("yuu-chat-send-btn");
    settingsEl = document.getElementById("yuu-chat-settings");

    // Events
    fab.addEventListener("click", openPanel);
    document.getElementById("yuu-chat-close-btn").addEventListener("click", closePanel);
    document.getElementById("yuu-chat-new-session-btn").addEventListener("click", newSession);
    document.getElementById("yuu-chat-history-btn").addEventListener("click", toggleHistory);
    document.getElementById("yuu-history-close-btn").addEventListener("click", () => {
      document.getElementById("yuu-chat-history").classList.add("yuu-chat-hidden");
    });
    document.getElementById("yuu-chat-settings-btn").addEventListener("click", () => {
      settingsEl.classList.toggle("yuu-chat-hidden");
    });
    sendBtn.addEventListener("click", handleSend);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    inputEl.addEventListener("input", () => {
      inputEl.style.height = "auto";
      inputEl.style.height = Math.min(inputEl.scrollHeight, 150) + "px";
    });
    document.getElementById("yuu-setting-provider").addEventListener("change", onProviderChange);
    document.getElementById("yuu-setting-base-url").addEventListener("focus", onProviderChange);
    document.getElementById("yuu-settings-save").addEventListener("click", saveSettings);
    document.getElementById("yuu-settings-clear").addEventListener("click", clearAll);
    loadSettingsForm();
  }

  function openPanel() {
    panel.classList.remove("yuu-chat-hidden");
    fab.classList.add("yuu-chat-hidden");
    inputEl.focus();
    loadIndexes().catch(() => {});
    // Restore messages from session if DOM is empty
    if (!messagesEl.children.length && chatHistory.length) {
      for (const msg of chatHistory) {
        addMessage(msg.role, msg.content);
      }
    }
  }
  function closePanel() {
    panel.classList.add("yuu-chat-hidden");
    fab.classList.remove("yuu-chat-hidden");
  }

  function toggleHistory() {
    const histPanel = document.getElementById("yuu-chat-history");
    const list = document.getElementById("yuu-history-list");
    const sessions = loadArchivedSessions();

    if (histPanel.classList.contains("yuu-chat-hidden")) {
      if (!sessions.length) {
        addMessage("system", "暂无历史会话。开始新对话后，旧会话会自动存档。");
        return;
      }
      list.innerHTML = sessions.map((s) => {
        const d = new Date(s.date);
        const ds = d.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        return `<div class="yuu-history-item" data-id="${s.id}">
          <span class="yuu-history-title">${escHtml(s.title)}</span>
          <span class="yuu-history-date">${ds} · ${s.messages.length} 条</span>
          <button class="yuu-history-del" data-id="${s.id}">&times;</button>
        </div>`;
      }).join("");
      list.querySelectorAll(".yuu-history-item").forEach((el) => {
        el.addEventListener("click", (e) => {
          if (e.target.classList.contains("yuu-history-del")) return;
          restoreArchivedSession(el.dataset.id);
          histPanel.classList.add("yuu-chat-hidden");
        });
      });
      list.querySelectorAll(".yuu-history-del").forEach((el) => {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const remaining = removeArchivedSession(el.dataset.id);
          if (!remaining.length) histPanel.classList.add("yuu-chat-hidden");
          else toggleHistory();
        });
      });
      histPanel.classList.remove("yuu-chat-hidden");
    } else {
      histPanel.classList.add("yuu-chat-hidden");
    }
  }

  function onProviderChange() {
    const p = document.getElementById("yuu-setting-provider").value;
    const d = {
      anthropic: ["https://api.anthropic.com", "claude-sonnet-4-6"],
      deepseek: ["https://api.deepseek.com/anthropic", "deepseek-v4-flash"],
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
    document.getElementById("yuu-setting-remember").checked = Settings.get("remember_key") === "true";
    onProviderChange();
  }

  function saveSettings() {
    Settings.set("provider", document.getElementById("yuu-setting-provider").value);
    Settings.set("base_url", document.getElementById("yuu-setting-base-url").value);
    Settings.set("model", document.getElementById("yuu-setting-model").value);
    Settings.set("api_key", document.getElementById("yuu-setting-api-key").value);
    Settings.set("remember_key", document.getElementById("yuu-setting-remember").checked ? "true" : "false");
    settingsEl.classList.add("yuu-chat-hidden");
    addMessage("system", "设置已保存。可以开始提问了。");
  }

  function newSession() {
    archiveCurrentSession();
    chatHistory = [];
    saveSession();
    messagesEl.innerHTML = "";
    addMessage("system", "新对话已开始。可在「历史」中查看过往会话。");
  }

  function clearAll() {
    sessionStorage.clear();
    try { localStorage.clear(); } catch (_) {}
    chatHistory = [];
    messagesEl.innerHTML = "";
    loadSettingsForm();
    addMessage("system", "所有数据已清除。");
  }

  // ── Messages ───────────────────────────────────────────────────────────

  function addMessage(type, text) {
    const el = document.createElement("div");
    el.className = `yuu-message yuu-message-${type}`;
    if (type === "assistant") {
      el.innerHTML = `<div class="yuu-message-content">${text}</div>`;
    } else {
      el.textContent = text;
    }
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return type === "assistant" ? el.querySelector(".yuu-message-content") : el;
  }

  function setBusy(busy) {
    sendBtn.disabled = busy;
    inputEl.disabled = busy;
    sendBtn.innerHTML = busy
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
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
    } catch (_) {}
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Send handler — orchestrate search → retrieve → reason → stream
  // ══════════════════════════════════════════════════════════════════════════

  async function handleSend() {
    const query = inputEl.value.trim();
    if (!query) return;
    const cfg = Settings.resolve();
    if (!cfg.apiKey) {
      addMessage("system", "请先点击齿轮图标设置 API Key。");
      settingsEl.classList.remove("yuu-chat-hidden");
      return;
    }

    inputEl.value = "";
    inputEl.style.height = "auto";
    addMessage("user", query);
    chatHistory.push({ role: "user", content: query });
    saveSession();

    // Ensure indexes loaded
    try { await loadIndexes(); } catch (_) {
      addMessage("system", "加载索引失败，请刷新页面重试。");
      return;
    }

    // Phase 1: Retrieve
    const contentEl = addMessage("assistant", "<em>检索中……</em>");
    setBusy(true);

    let result;
    try {
      result = await retrieveContext(query);
    } catch (e) {
      contentEl.innerHTML = `<span class="yuu-error">检索失败: ${escHtml(e.message)}</span>`;
      setBusy(false);
      return;
    }

    const { contexts, thin } = result;
    if (!contexts.length) {
      contentEl.innerHTML = "当前图书馆中没有找到相关内容。建议换个关键词试试。";
      setBusy(false);
      return;
    }

    // Phase 2: Reason + Stream
    const systemPrompt = buildSystemPrompt(contexts, thin);
    const messages = [
      ...chatHistory.slice(-6),
      { role: "user", content: query },
    ];

    // Show retrieval stats
    const docNames = [...new Set(contexts.map((c) => c.docTitle))];
    contentEl.innerHTML = `<em>已从 ${docNames.length} 个文档中检索到 ${contexts.length} 个相关段落，正在生成回答……</em>\n\n`;

    try {
      let fullText = "";
      for await (const chunk of streamText({
        provider: cfg.provider,
        model: cfg.model,
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        system: systemPrompt,
        messages,
      })) {
        fullText += chunk;
        contentEl.innerHTML = renderMarkdown(fullText);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        reRenderKatex(contentEl);
      }
      chatHistory.push({ role: "assistant", content: fullText });
      if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
      saveSession();
    } catch (e) {
      contentEl.innerHTML += `<span class="yuu-error">\n\n错误: ${escHtml(e.message)}</span>`;
    }
    setBusy(false);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Init
  // ══════════════════════════════════════════════════════════════════════════

  function init() {
    if (document.getElementById("yuu-chat-container")) return;
    createDOM();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
