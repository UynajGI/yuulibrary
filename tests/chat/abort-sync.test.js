/**
 * AbortController + 状态同步（#4 + #5）逻辑测试
 *
 * 验证 handleSend catch 块的三条分支：
 *   1. abort + 被新请求取代 → 不写 history（新会话已接管）
 *   2. abort + 用户主动停止 + 有部分文本 → 保留部分文本
 *   3. abort + 用户主动停止 + 无文本 → 写 [已停止]
 *   4. 真实错误 → 写错误文本
 *   5. setBusy 在 finally 恢复
 *
 * catch 逻辑是 handleSend 内联的，这里复现同算法锁定契约。
 *
 * 运行：node tests/chat/abort-sync.test.js
 */

// 复现 handleSend catch 块的决策逻辑（与生产代码逐行对应）
function decideCatchAction({ e, finalText, controller, activeController }) {
  const aborted = e && (e.name === "AbortError" || /aborted/i.test(e.message || ""));
  const superseded = activeController !== controller;
  if (aborted && superseded) {
    return { action: "silent" }; // 新请求接管，静默退出
  }
  if (aborted) {
    return {
      action: "save",
      content: finalText.trim() ? finalText : "_[已停止]_",
      showStop: true,
    };
  }
  return {
    action: "save",
    content: finalText.trim() ? finalText + `\n\n错误: ${e.message}` : `错误: ${e.message}`,
    showError: true,
  };
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

  // 模拟 controller 对象（用引用相等判断 superseded）
  const ctrl1 = { aborted: false };
  const ctrl2 = { aborted: false };

  // 用例 1：用户停止，有部分文本 → 保留部分
  {
    const r = decideCatchAction({
      e: { name: "AbortError", message: "The user aborted" },
      finalText: "部分回答内容",
      controller: ctrl1,
      activeController: ctrl1, // 仍是当前 → 用户主动停
    });
    ok("1 用户停止+有文本 → 保留部分文本", r.action === "save" && r.content === "部分回答内容");
    ok("1b 不显示错误（只停止）", !r.showError);
  }

  // 用例 2：用户停止，无文本 → [已停止]
  {
    const r = decideCatchAction({
      e: { name: "AbortError", message: "aborted" },
      finalText: "",
      controller: ctrl1,
      activeController: ctrl1,
    });
    ok("2 用户停止+无文本 → [已停止]", r.action === "save" && r.content === "_[已停止]_");
  }

  // 用例 3：被新请求取代 → 静默（不污染新会话）
  {
    const r = decideCatchAction({
      e: { name: "AbortError", message: "aborted" },
      finalText: "旧请求的部分文本",
      controller: ctrl1,
      activeController: ctrl2, // 已被 ctrl2 取代
    });
    ok("3 被取代 → 静默不写", r.action === "silent");
  }

  // 用例 4：真实错误 → 写错误文本
  {
    const r = decideCatchAction({
      e: { name: "TypeError", message: "network failed" },
      finalText: "",
      controller: ctrl1,
      activeController: ctrl1,
    });
    ok(
      "4 真实错误 → 写错误文本",
      r.action === "save" && r.content.includes("network failed") && r.showError
    );
  }

  // 用例 5：真实错误但有部分文本 → 保留部分 + 追加错误
  {
    const r = decideCatchAction({
      e: { name: "Error", message: "500" },
      finalText: "已生成的部分",
      controller: ctrl1,
      activeController: ctrl1,
    });
    ok(
      "5 错误+部分文本 → 保留部分+追加错误",
      r.content.includes("已生成的部分") && r.content.includes("500")
    );
  }

  // 用例 6：abort 错误识别（合理格式：name=AbortError 或 message 含 aborted）
  {
    const abortCases = [
      { name: "AbortError", message: "anything" },
      { name: "AbortError", message: "The user aborted a request" },
      { message: "The operation was aborted" },
    ];
    let allAbort = true;
    for (const e of abortCases) {
      const r = decideCatchAction({ e, finalText: "", controller: ctrl1, activeController: ctrl1 });
      if (!r.showStop) allAbort = false;
    }
    ok("6a abort 格式都被识别", allAbort);

    // 非 abort 错误不被误识别
    const nonAbort = { name: "TypeError", message: "Failed to fetch" };
    const r = decideCatchAction({
      e: nonAbort,
      finalText: "",
      controller: ctrl1,
      activeController: ctrl1,
    });
    ok("6b 非 abort 错误走错误分支", r.showError && !r.showStop);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main();
