/**
 * 流式渲染节流（#3）+ 智能滚动（#15）逻辑测试
 *
 * 验证：
 * 1. createStreamRenderer.schedule() 合并多次调用 → 实际 DOM 写入次数 << 调用次数
 * 2. flush() 立即同步渲染最新 state
 * 3. 无变化时不写 DOM（避免无谓 innerHTML）
 * 4. scrollToBottomAuto：用户上滑时不滚；forceScrollToBottom 重置后滚
 *
 * chat.js 的 renderer 依赖闭包内的 renderThinkingAndText/reRenderKatex/scroll，
 * 无法直接导出。本测试用相同算法独立复现来锁定行为契约。
 *
 * 运行：node tests/chat/stream-render.test.js
 * 零依赖：手写最小 DOM mock。
 */

const STREAM_RENDER_MS = 80;

// 复现 chat.js 的 createStreamRenderer 算法（与生产代码逐行对应）
function createStreamRenderer(contentEl, state, hooks) {
  hooks = hooks || {};
  let timer = null;
  let lastHTML = "\u0000";
  let pendingTail = false;
  const apply = () => {
    timer = null;
    const html = hooks.render(state);
    if (html === lastHTML) {
      pendingTail = false;
      return;
    }
    lastHTML = html;
    contentEl.innerHTML = html;
    hooks.afterRender && hooks.afterRender();
    if (pendingTail) {
      pendingTail = false;
      timer = setTimeout(apply, STREAM_RENDER_MS);
    }
  };
  return {
    schedule() {
      if (timer) {
        pendingTail = true;
        return;
      }
      timer = setTimeout(apply, STREAM_RENDER_MS);
    },
    flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      pendingTail = false;
      apply();
    },
    dispose() {
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}

// 复现智能滚动算法
function createScroller(messagesEl) {
  let userPinned = true;
  let rafId = null;
  messagesEl.addEventListener("scroll", () => {
    const threshold = 80;
    userPinned =
      messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < threshold;
  });
  const raf = (fn) => setTimeout(fn, 0); // 测试用 setTimeout 替代 rAF
  return {
    auto() {
      if (!userPinned) return 0;
      if (rafId) return rafId;
      rafId = raf(() => {
        rafId = null;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });
      return rafId;
    },
    force() {
      userPinned = true;
      if (rafId) clearTimeout(rafId);
      rafId = raf(() => {
        rafId = null;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });
    },
    _isPinned: () => userPinned,
  };
}

// 最小 DOM mock
function mockContentEl() {
  const el = { _writes: 0, innerHTML: "" };
  Object.defineProperty(el, "innerHTML", {
    get() {
      return this._html;
    },
    set(v) {
      this._html = v;
      this._writes++;
    },
    configurable: true,
  });
  el._html = "";
  return el;
}

async function tick(ms = 10) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
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

  // 用例 1：N 次 schedule → 最多 2 次 DOM 写（前沿 + 尾沿）
  {
    const el = mockContentEl();
    const state = { thinking: "", text: "", toolTrail: [] };
    let renderCalls = 0;
    const r = createStreamRenderer(el, state, {
      render: (s) => (renderCalls++, `<p>${s.text}</p>`),
      afterRender: () => {},
    });
    for (let i = 0; i < 50; i++) {
      state.text = "x".repeat(i + 1);
      r.schedule();
      await tick(1); // 模拟 token 间隔
    }
    await tick(STREAM_RENDER_MS + 20);
    ok("1a 50 次 schedule 后 DOM 写入 << 50（节流生效）", el._writes < 10);
    ok("1b 最终 DOM 反映最新 text", el.innerHTML.includes("x".repeat(50)));
  }

  // 用例 2：flush 立即同步渲染
  {
    const el = mockContentEl();
    const state = { text: "hello" };
    const r = createStreamRenderer(el, state, { render: (s) => `<p>${s.text}</p>` });
    r.schedule();
    // 不等节流，直接 flush
    r.flush();
    ok("2 flush 立即渲染（不等节流定时器）", el.innerHTML === "<p>hello</p>" && el._writes === 1);
  }

  // 用例 3：state 无变化时不写 DOM
  {
    const el = mockContentEl();
    const state = { text: "same" };
    const r = createStreamRenderer(el, state, { render: (s) => `<p>${s.text}</p>` });
    r.flush(); // 第一次写入
    const writesBefore = el._writes;
    r.flush(); // 同样 state
    ok("3 无变化时不重复写 DOM", el._writes === writesBefore);
  }

  // 用例 4：尾沿不丢最后一次更新
  {
    const el = mockContentEl();
    const state = { text: "" };
    const r = createStreamRenderer(el, state, { render: (s) => `<p>${s.text}</p>` });
    state.text = "first";
    r.schedule();
    await tick(STREAM_RENDER_MS + 5); // 前沿触发
    state.text = "second";
    r.schedule(); // 此时无 timer，设新 timer
    state.text = "third";
    r.schedule(); // 此时 timer 在 → pendingTail
    await tick(STREAM_RENDER_MS + 20);
    ok("4 尾沿最终渲染最新值（third）", el.innerHTML === "<p>third</p>");
  }

  // 用例 5：智能滚动——用户上滑时不自动滚
  {
    const listeners = {};
    const el = {
      scrollHeight: 1000,
      scrollTop: 920, // 接近底
      clientHeight: 80,
      addEventListener: (e, fn) => (listeners[e] = fn),
    };
    const scroller = createScroller(el);
    ok("5a 初始用户在底部 → pinned", scroller._isPinned() === true);
    // 模拟用户上滑
    el.scrollTop = 100;
    listeners.scroll();
    ok("5b 用户上滑后 → 不再 pinned", scroller._isPinned() === false);
    const scrollBefore = el.scrollTop;
    scroller.auto();
    await tick(15);
    ok("5c 上滑时 auto 不抢滚动", el.scrollTop === scrollBefore);
    // force 重置
    scroller.force();
    await tick(15);
    ok("5d force 重置后滚到底", el.scrollTop === el.scrollHeight);
  }

  // 用例 6：dispose 清理定时器（无泄漏）
  {
    const el = mockContentEl();
    const state = { text: "x" };
    const r = createStreamRenderer(el, state, { render: (s) => `<p>${s.text}</p>` });
    r.schedule();
    r.dispose();
    await tick(STREAM_RENDER_MS + 20);
    ok("6 dispose 后定时器不再触发写入", el._writes === 0);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
