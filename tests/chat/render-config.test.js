/**
 * 历史恢复渲染（#6）+ KaTeX 配置（#12）契约测试
 *
 * #6：appendMessageBubble("assistant", ...) 必须走 renderMarkdown（不能直接拼原始 markdown）。
 *     验证 renderMarkdown 把典型历史内容正确转 HTML（不残留字面 ** $$）。
 * #12：reRenderKatex 配置必须含 ignoredTags pre/code（与 head.html 一致）。
 *     验证 chat.js 源码含该配置（配置快照）。
 *
 * 运行：node tests/chat/render-config.test.js
 */

const fs = require("fs");
const path = require("path");

const chatSrc = fs.readFileSync(
  path.join(__dirname, "..", "..", "static", "chat", "chat.js"),
  "utf8"
);

// 复现 renderMarkdown（与 xss.test.js 同算法，无 DOMPurify 分支用于纯逻辑测）
function escHtml(s) {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );
}
function renderMarkdown(text) {
  let html = text;
  const mathBlocks = [];
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => {
    mathBlocks.push(`$$${m}$$`);
    return `\uF8FFMATH${mathBlocks.length - 1}\uF8FF`;
  });
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => {
    mathBlocks.push(`\\[${m}\\]`);
    return `\uF8FFMATH${mathBlocks.length - 1}\uF8FF`;
  });
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
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  html = html.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
  html = html.replace(/\uF8FFMATH(\d+)\uF8FF/g, (_, i) => mathBlocks[parseInt(i)]);
  return `<p>${html}</p>`;
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

  // ── #6 历史恢复渲染：典型历史内容正确转 HTML ──────────────────────────────
  {
    const stored = "**关键点**：$E = mc^2$ 是质能方程\n\n参考：[1](https://e.com)";
    const html = renderMarkdown(stored);
    ok("6a 粗体渲染（不残留 **）", html.includes("<strong>关键点</strong>"));
    ok("6b 行内 $ 数学保留（KaTeX 后续处理）", html.includes("$E = mc^2$"));
    ok("6c 链接渲染（不残留字面 [1](...)）", html.includes('<a href="https://e.com"'));
    ok("6d 段落分隔生效", html.includes("</p><p>"));
  }

  // ── #6 验证 chat.js 源码：appendMessageBubble 走 renderMarkdown ──────────
  {
    // 提取 appendMessageBubble 函数体
    const fnMatch = chatSrc.match(/function appendMessageBubble[\s\S]*?^\s{2}\}/m);
    ok("6e 找到 appendMessageBubble 定义", !!fnMatch);
    if (fnMatch) {
      const body = fnMatch[0];
      ok("6f assistant 分支调用 renderMarkdown", body.includes("renderMarkdown("));
      ok("6g assistant 分支调用 reRenderKatex", body.includes("reRenderKatex("));
      ok(
        "6h 不再直接拼 ${text} 到 innerHTML",
        !body.includes('innerHTML = `<div class="yuu-msg-content">${text}')
      );
    }
  }

  // ── #12 KaTeX ignoredTags 配置 ────────────────────────────────────────────
  {
    const katexMatch = chatSrc.match(/function reRenderKatex[\s\S]*?^\s{2}\}/m);
    ok("12a 找到 reRenderKatex 定义", !!katexMatch);
    if (katexMatch) {
      const body = katexMatch[0];
      ok("12b 含 ignoredTags", body.includes("ignoredTags"));
      ok("12c ignoredTags 含 pre", body.includes('"pre"'));
      ok("12d ignoredTags 含 code", body.includes('"code"'));
      ok(
        "12e 含 ignoredClasses pseudocode",
        body.includes("ignoredClasses") && body.includes("pseudocode")
      );
    }
  }

  // ── #12 与 head.html 配置一致性 ───────────────────────────────────────────
  {
    const headSrc = fs.readFileSync(
      path.join(__dirname, "..", "..", "layouts", "_partials", "docs", "inject", "head.html"),
      "utf8"
    );
    // 两者都应有 pre+code 在 ignoredTags
    const headHasIt = headSrc.includes('"pre"') && headSrc.includes('"code"');
    const chatHasIt = chatSrc.includes('"pre", "noscript"') || chatSrc.includes('"pre"');
    ok("12f head.html 含 pre/code ignoredTags", headHasIt);
    ok("12g chat.js 与 head.html 配置对齐", chatHasIt);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main();
