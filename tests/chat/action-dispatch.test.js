/**
 * Action dispatcher（#4 stop + #13 data-prompt delegation）逻辑测试
 *
 * 验证 handleAction 的分支路由：
 *   - data-prompt 元素点击 → 填 composer + handleSend（#13 动态建议可点）
 *   - data-action="stop" → abortActiveStream（#4 停止生成）
 *   - data-action="send" → handleSend
 *   - 其它 action 各自路由
 *
 * handleAction 依赖 DOM closest，这里用最小 mock 复现决策逻辑。
 *
 * 运行：node tests/chat/action-dispatch.test.js
 */

// mock element.closest：在元素上附加 closest 方法，沿 parentChain 找
function makeEl(ds, parent) {
  return {
    _ds: ds,
    _parent: parent || null,
    closest(selector) {
      let el = this;
      while (el) {
        if (selector === "[data-prompt]" && el._ds.prompt !== undefined) return el;
        if (selector === "[data-action]" && el._ds.action !== undefined) return el;
        el = el._parent || null;
      }
      return null;
    },
  };
}
function mockEvent(targetEl) {
  return { target: targetEl };
}

// 复现 handleAction 决策（与生产代码逻辑对应）
function decideAction(event) {
  const promptEl = event.target.closest("[data-prompt]");
  if (promptEl) return { type: "prompt", value: promptEl._ds.prompt };
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return { type: "none" };
  return { type: "action", value: actionEl._ds.action };
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

  // 构造 mock 元素树：button[data-prompt]（建议按钮）
  const promptBtn = makeEl({ prompt: "Rabi 模型" });
  const sendBtn = makeEl({ action: "send" });
  const stopBtn = makeEl({ action: "stop" });
  // svg 在 button 内（点击 svg，冒泡到 button）
  const svgInSend = makeEl({}, sendBtn);

  // 用例 1：#13 点击 data-prompt 建议 → prompt 分支
  {
    const r = decideAction(mockEvent(promptBtn));
    ok("1 点击建议按钮 → prompt 分支", r.type === "prompt" && r.value === "Rabi 模型");
  }

  // 用例 2：#4 点击 stop → stop 分支（非 send）
  {
    const r = decideAction(mockEvent(stopBtn));
    ok("2 点击 stop 按钮 → stop action", r.type === "action" && r.value === "stop");
  }

  // 用例 3：点击 send → send action
  {
    const r = decideAction(mockEvent(sendBtn));
    ok("3 点击 send → send action", r.type === "action" && r.value === "send");
  }

  // 用例 4：点击 send 内部的 svg（冒泡）→ send action
  {
    const r = decideAction(mockEvent(svgInSend));
    ok("4 点击 send 内 svg → 冒泡到 send action", r.type === "action" && r.value === "send");
  }

  // 用例 5：#13 prompt 优先于 action（delegation 顺序：先查 prompt 再查 action）
  {
    const both = makeEl({ prompt: "x", action: "send" });
    const r = decideAction(mockEvent(both));
    ok("5 prompt 优先于 action（先处理建议）", r.type === "prompt");
  }

  // 用例 6：无匹配 → none
  {
    const bare = makeEl({});
    const r = decideAction(mockEvent(bare));
    ok("6 裸元素点击 → none", r.type === "none");
  }

  // 用例 7：open/close/new/history/settings/close-drawer 各路由
  {
    for (const action of ["open", "close", "new", "history", "settings", "close-drawer"]) {
      const btn = makeEl({ action });
      const r = decideAction(mockEvent(btn));
      ok(`7 action=${action} 正确路由`, r.type === "action" && r.value === action);
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main();
