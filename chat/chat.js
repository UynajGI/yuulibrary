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
  let globalIndex = null, nodeIndex = null, docCache = {}, indexReady = false;
  const CHAT_SESSION_KEY = "yuu_chat_session";
  const SESSIONS_ARCHIVE_KEY = "yuu_chat_sessions_archive";
  const MAX_ARCHIVED = 20;
  let chatHistory = loadSession();

  function loadSession() {
    try { const r = sessionStorage.getItem(CHAT_SESSION_KEY); return r ? JSON.parse(r) : []; } catch (_) { return []; }
  }
  function saveSession() {
    try { sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(chatHistory)); } catch (_) {}
  }

  // ── DOM refs ─────────────────────────────────────────────────────────────
  let root, emptyEl, messagesEl, composerInput, sendBtn;

  // ══════════════════════════════════════════════════════════════════════════
  // Mini Provider SDK
  // ══════════════════════════════════════════════════════════════════════════

  async function* readSSE(response) {
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let msg = `HTTP ${response.status}`;
      try { msg = JSON.parse(text).error?.message || msg; } catch (_) {}
      throw new Error(msg);
    }
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n"); buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6); if (raw === "[DONE]") return;
        try {
          const json = JSON.parse(raw);
          if (json.type === "content_block_delta" && json.delta?.text) { yield json.delta.text; }
          else if (json.type === "message_stop") return;
          const c = json.choices?.[0]?.delta?.content;
          if (c) yield c;
        } catch (_) {}
      }
    }
  }

  function buildRequest({ provider, model, baseUrl, apiKey, system, messages, maxTokens }) {
    if (provider === "anthropic" || provider === "deepseek") {
      return {
        url: `${baseUrl}/v1/messages`,
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model, max_tokens: maxTokens || 2048, system, messages, stream: true }),
      };
    }
    return {
      url: `${baseUrl}/v1/chat/completions`,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model, max_tokens: maxTokens || 2048, messages: [{ role: "system", content: system }, ...messages], stream: true }),
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
    _defaults() { return { provider: "anthropic", model: "", base_url: "", api_key: "", remember_key: false }; },
    get(key) {
      const v = sessionStorage.getItem(this._pfx + key); if (v !== null) return v;
      return localStorage.getItem(this._pfx + key) || this._defaults()[key] || "";
    },
    set(key, val) {
      sessionStorage.setItem(this._pfx + key, val);
      if (key === "remember_key") {
        if (val === "true") { const k = this.get("api_key"); if (k) localStorage.setItem(this._pfx + "api_key", k); }
        else localStorage.removeItem(this._pfx + "api_key");
      }
      if (key !== "api_key" && key !== "remember_key") { try { localStorage.setItem(this._pfx + key, val); } catch (_) {} }
      if (key === "api_key" && this.get("remember_key") === "true") { localStorage.setItem(this._pfx + key, val); }
    },
    resolve() {
      const p = this.get("provider");
      const model = this.get("model") || {
        anthropic: "claude-sonnet-4-6", deepseek: "deepseek-v4-flash", openai: "gpt-4o",
        siliconflow: "deepseek-ai/DeepSeek-V3", openrouter: "anthropic/claude-sonnet-4",
        zhipu: "glm-4", dashscope: "qwen-plus", ollama: "llama3", gemini: "gemini-2.5-flash", custom: "",
      }[p] || "";
      const baseUrl = this.get("base_url") || {
        anthropic: "https://api.anthropic.com", deepseek: "https://api.deepseek.com/anthropic", openai: "https://api.openai.com",
        siliconflow: "https://api.siliconflow.cn", openrouter: "https://openrouter.ai/api",
        zhipu: "https://open.bigmodel.cn/api/paas/v4", dashscope: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        ollama: "http://localhost:11434", gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
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
      fetch(`${PAGEINDEX}/global-index.json`).then(r => r.json()),
      fetch(`${PAGEINDEX}/node-index.json`).then(r => r.json()),
    ]);
    globalIndex = gi; nodeIndex = ni; indexReady = true;
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
    const title = (node.title || "").toLowerCase(), excerpt = (node.excerpt || "").toLowerCase();
    const terms = (node.terms || []).join(" ").toLowerCase(), crumb = (node.breadcrumb || []).join(" ").toLowerCase();
    for (const qt of queryTokens) {
      const q = qt.toLowerCase();
      if (title.includes(q)) s += 10; else if (crumb.includes(q)) s += 4;
      else if (terms.includes(q)) s += 3; else if (excerpt.includes(q)) s += 1;
    }
    return s;
  }

  function search(query, topK = 10) {
    if (!nodeIndex) return [];
    const tokens = tokenize(query); if (!tokens.length) return [];
    const scored = [];
    for (const node of nodeIndex.nodes) { const s = scoreNode(tokens, node); if (s > 0) scored.push({ node, score: s }); }
    scored.sort((a, b) => b.score - a.score);
    const seen = new Set(), results = [];
    for (const item of scored) {
      if ([...seen].filter(id => id === item.node.doc_id).length < 3) { results.push(item); seen.add(item.node.doc_id); }
      if (results.length >= topK * 2) break;
    }
    return results.slice(0, topK);
  }

  async function loadDocTree(docId) {
    if (docCache[docId] !== undefined) return;
    const doc = globalIndex?.docs?.find(d => d.id === docId);
    const type = doc?.type || "papers";
    try {
      const resp = await fetch(`${PAGEINDEX}/${type}/${docId}.json`);
      const data = await resp.json();
      const flat = [];
      (function walk(nodes, crumb) { for (const n of nodes) { const c = [...crumb, n.title]; flat.push({ ...n, _crumb: c }); if (n.nodes) walk(n.nodes, c); } })(data.structure, []);
      docCache[docId] = { tree: data, flat };
    } catch (_) { docCache[docId] = null; }
  }

  function buildContextChunk(doc, nodeId, docMeta) {
    const flat = doc.flat; const idx = flat.findIndex(n => n.node_id === nodeId);
    if (idx < 0) return null;
    const node = flat[idx], crumb = node._crumb || [node.title], text = node.text || "";
    const parent = crumb.length > 1 ? flat.find(n => n._crumb?.length === crumb.length - 1 && crumb.slice(0, -1).every((t, i) => n._crumb[i] === t)) : null;
    const siblings = flat.filter(n => n._crumb?.length === crumb.length && n.node_id !== node.node_id && n._crumb?.slice(0, -1).every((t, i) => crumb[i] === t)).slice(0, 4);
    const children = flat.filter(n => n._crumb?.length === crumb.length + 1 && n._crumb?.slice(0, -1).every((t, i) => crumb[i] === t)).slice(0, 4);
    return { docType: docMeta.type || "", docTitle: docMeta.title || docMeta.doc_name || "", docAuthor: docMeta.author || "", nodeId, title: node.title, breadcrumb: crumb, text, parentTitle: parent?.title || "", siblingTitles: siblings.map(n => n.title), childTitles: children.map(n => n.title) };
  }

  async function retrieveContext(query) {
    const hits = search(query); if (!hits.length) return { contexts: [], docCount: 0, thin: true };
    const uniqueDocs = [...new Set(hits.map(h => h.node.doc_id))].slice(0, 6);
    await Promise.all(uniqueDocs.map(loadDocTree));
    const contexts = [], seenNodes = new Set();
    for (const hit of hits.slice(0, 8)) {
      const doc = docCache[hit.node.doc_id]; if (!doc) continue;
      if (seenNodes.has(hit.node.doc_id + ":" + hit.node.node_id)) continue;
      seenNodes.add(hit.node.doc_id + ":" + hit.node.node_id);
      const ctx = buildContextChunk(doc, hit.node.node_id, doc.tree);
      if (ctx && ctx.text) contexts.push(ctx);
    }
    let thin = contexts.length < 2;
    if (thin && query.length > 4) {
      for (const term of tokenize(query).slice(0, 3)) {
        for (const hit of search(term, 4)) {
          if (!docCache[hit.node.doc_id]) await loadDocTree(hit.node.doc_id);
          const d = docCache[hit.node.doc_id]; if (!d || seenNodes.has(hit.node.doc_id + ":" + hit.node.node_id)) continue;
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
  // System prompt
  // ══════════════════════════════════════════════════════════════════════════

  const MAX_SECTION_CHARS = 2500;

  function buildSystemPrompt(contexts, thin) {
    const docNames = [...new Set(contexts.map(c => c.docTitle))];
    const docToc = docNames.map(name => { const dc = contexts.filter(c => c.docTitle === name); const meta = [dc[0].docAuthor, dc[0].docType].filter(Boolean).join(" · "); return `- **${name}**${meta ? ` (${meta})` : ""} — ${dc.length} 个相关段落`; });
    const blocks = [], seen = new Set();
    for (let i = 0; i < contexts.length; i++) {
      const c = contexts[i], hash = c.text.slice(0, 80); if (seen.has(hash)) continue; seen.add(hash);
      const crumb = c.breadcrumb.join(" > "); let text = c.text; let truncated = false;
      if (text.length > MAX_SECTION_CHARS) { text = text.slice(0, MAX_SECTION_CHARS) + "\n\n…[已截断，可追问获取完整内容]…"; truncated = true; }
      let block = `### [${i + 1}] ${crumb}\n*来源: ${c.docTitle}*\n`;
      const nearby = [];
      if (c.parentTitle && c.breadcrumb.length > 1) nearby.push(`上级: ${c.parentTitle}`);
      if (c.siblingTitles.length) nearby.push(`同级: ${c.siblingTitles.join(" / ")}`);
      if (c.childTitles.length) nearby.push(`子节: ${c.childTitles.join(" / ")}`);
      if (nearby.length) block += `*${nearby.join("  |  ")}*\n`;
      block += `\n${text}`; blocks.push(block);
    }
    const thinNotice = thin ? "\n> **注意**: 本次检索结果较少，回答可能不完整。\n" : "";
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
  // Markdown
  // ══════════════════════════════════════════════════════════════════════════

  function renderMarkdown(text) {
    let html = text;
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => `<pre><code>${escHtml(code.trim())}</code></pre>`);
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(/^### (.+)$/gm, "<h4>$1</h4>").replace(/^## (.+)$/gm, "<h3>$1</h3>").replace(/^# (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
    return `<p>${html}</p>`;
  }
  function escHtml(s) { return s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }

  // ══════════════════════════════════════════════════════════════════════════
  // Session archive (localStorage)
  // ══════════════════════════════════════════════════════════════════════════

  function archiveCurrentSession() {
    if (!chatHistory.length) return;
    const sessions = loadArchivedSessions();
    const title = chatHistory[0]?.content?.slice(0, 50) || "(空会话)";
    sessions.unshift({ id: Date.now().toString(36), title, date: new Date().toISOString(), messages: [...chatHistory] });
    if (sessions.length > MAX_ARCHIVED) sessions.length = MAX_ARCHIVED;
    try { localStorage.setItem(SESSIONS_ARCHIVE_KEY, JSON.stringify(sessions)); } catch (_) {}
  }
  function loadArchivedSessions() {
    try { const r = localStorage.getItem(SESSIONS_ARCHIVE_KEY); return r ? JSON.parse(r) : []; } catch (_) { return []; }
  }
  function restoreArchivedSession(id) {
    const sessions = loadArchivedSessions(), s = sessions.find(x => x.id === id); if (!s) return;
    if (chatHistory.length) archiveCurrentSession();
    chatHistory = s.messages; saveSession();
    messagesEl.innerHTML = ""; hideEmpty();
    for (const msg of chatHistory) appendMessageBubble(msg.role, msg.content);
  }
  function removeArchivedSession(id) {
    let sessions = loadArchivedSessions(); sessions = sessions.filter(x => x.id !== id);
    try { localStorage.setItem(SESSIONS_ARCHIVE_KEY, JSON.stringify(sessions)); } catch (_) {}
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
    // Prompt suggestion clicks
    root.querySelectorAll("[data-prompt]").forEach(btn => {
      btn.addEventListener("click", () => {
        composerInput.value = btn.dataset.prompt;
        handleSend();
      });
    });
    // Enter to send
    composerInput.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
    root.querySelectorAll(".yuu-ai-drawer").forEach(d => { d.hidden = true; });
  }
  function showMessages() { emptyEl.hidden = true; messagesEl.hidden = false; }
  function hideEmpty() { emptyEl.hidden = true; messagesEl.hidden = false; }
  function showEmpty() {
    emptyEl.hidden = false; messagesEl.hidden = true; messagesEl.innerHTML = "";
  }
  function newSession() {
    archiveCurrentSession();
    chatHistory = []; saveSession();
    closeDrawer(); showEmpty();
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
      list.innerHTML = '<div class="yuu-history-empty">暂无历史会话。<br>开始新对话后，旧会话自动存档。</div>';
      return;
    }
    list.innerHTML = sessions.map(s => {
      const d = new Date(s.date);
      const ds = d.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      return `<div class="yuu-history-item" data-id="${s.id}">
        <span class="yuu-history-title">${escHtml(s.title)}</span>
        <span class="yuu-history-date">${ds} · ${s.messages.length} 条</span>
        <button class="yuu-history-del" data-id="${s.id}" title="删除">&times;</button>
      </div>`;
    }).join("");
    list.querySelectorAll(".yuu-history-item").forEach(el => {
      el.addEventListener("click", e => {
        if (e.target.classList.contains("yuu-history-del")) return;
        restoreArchivedSession(el.dataset.id); closeDrawer();
      });
    });
    list.querySelectorAll(".yuu-history-del").forEach(el => {
      el.addEventListener("click", e => {
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
    const remember = document.getElementById("yuu-setting-remember").checked;
    Settings.set("provider", document.getElementById("yuu-setting-provider").value);
    Settings.set("base_url", document.getElementById("yuu-setting-base-url").value);
    Settings.set("model", document.getElementById("yuu-setting-model").value);
    Settings.set("api_key", document.getElementById("yuu-setting-api-key").value);
    Settings.set("remember_key", remember ? "true" : "false");
    if (!remember) localStorage.removeItem("yuu_chat_api_key");
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
    const apiKey = document.getElementById("yuu-setting-api-key").value.trim() || Settings.get("api_key");
    if (!apiKey) { setTestStatus("error", "请先填写 API Key"); return; }

    const model = (document.getElementById("yuu-setting-model").value || document.getElementById("yuu-setting-model").placeholder).trim();
    let baseUrl = (document.getElementById("yuu-setting-base-url").value || document.getElementById("yuu-setting-base-url").placeholder).trim();
    baseUrl = baseUrl.replace(/\/+$/, "");
    if (!baseUrl) { setTestStatus("error", "请先填写 Base URL 或选择 Provider"); return; }

    setTestStatus("loading", "正在测试……");
    const btn = document.getElementById("yuu-settings-test");
    btn.disabled = true;

    try {
      const isAnthropic = provider === "anthropic" || provider === "deepseek";
      let url, headers, body;

      if (isAnthropic) {
        url = `${baseUrl}/v1/messages`;
        headers = { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" };
        body = JSON.stringify({ model, max_tokens: 8, messages: [{ role: "user", content: "ping" }] });
      } else {
        url = `${baseUrl}/v1/chat/completions`;
        headers = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
        body = JSON.stringify({ model, messages: [{ role: "user", content: "ping" }], max_tokens: 8, stream: false });
      }

      const resp = await fetch(url, { method: "POST", headers, body });

      if (resp.ok) {
        setTestStatus("success", "连接成功");
      } else {
        const status = resp.status;
        const text = await resp.text().catch(() => "");
        let msg = "";
        try { msg = JSON.parse(text).error?.message || ""; } catch (_) {}
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
      else
        setTestStatus("error", `连接失败: ${msg.slice(0, 80)}`);
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
    try { renderMathInElement(el, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }], throwOnError: false }); } catch (_) {}
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Send — search → retrieve → reason → stream
  // ══════════════════════════════════════════════════════════════════════════

  async function handleSend() {
    const query = composerInput.value.trim(); if (!query) return;
    const cfg = Settings.resolve();
    if (!cfg.apiKey) { openDrawer("settings"); return; }

    composerInput.value = ""; composerInput.style.height = "auto";
    hideEmpty();
    appendMessageBubble("user", query);
    chatHistory.push({ role: "user", content: query }); saveSession();

    try { await loadIndexes(); } catch (_) { return; }

    const contentEl = appendMessageBubble("assistant", "<em>检索中……</em>");
    setBusy(true);

    let result;
    try { result = await retrieveContext(query); } catch (e) {
      contentEl.innerHTML = `<span style="color:#dc2626">检索失败: ${escHtml(e.message)}</span>`;
      setBusy(false); return;
    }

    const { contexts, thin } = result;
    if (!contexts.length) {
      contentEl.innerHTML = "当前图书馆中没有找到相关内容。建议换个关键词试试。";
      setBusy(false); return;
    }

    const docNames = [...new Set(contexts.map(c => c.docTitle))];
    contentEl.innerHTML = `<em>已从 ${docNames.length} 个文档中检索到 ${contexts.length} 个相关段落……</em>`;

    const systemPrompt = buildSystemPrompt(contexts, thin);
    const messages = [...chatHistory.slice(-6)];

    try {
      let fullText = "";
      for await (const chunk of streamText({ provider: cfg.provider, model: cfg.model, baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, system: systemPrompt, messages })) {
        fullText += chunk;
        contentEl.innerHTML = renderMarkdown(fullText);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        reRenderKatex(contentEl);
      }
      chatHistory.push({ role: "assistant", content: fullText });
      if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
      saveSession();
    } catch (e) {
      contentEl.innerHTML += `<br><span style="color:#dc2626">错误: ${escHtml(e.message)}</span>`;
    }
    setBusy(false);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Init
  // ══════════════════════════════════════════════════════════════════════════

  function init() { if (!document.getElementById("yuu-chat-root")) createDOM(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
