/*!
 * 主题切换器（日/夜/自动三态）
 *
 * 状态模型：
 *   data-theme            用户偏好："light" | "dark" | "auto"
 *   data-effective-theme  实际生效："light" | "dark"（CSS 只看这个）
 *
 * 初始化在 head.html 顶部同步脚本完成（避免深色用户白闪）。
 * 本脚本负责：按钮交互、状态持久化、auto 模式下实时响应系统切换。
 */
(function () {
  "use strict";

  const STORAGE_KEY = "book-theme";
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function resolveEffective(pref) {
    if (pref === "light" || pref === "dark") return pref;
    return media.matches ? "dark" : "light";
  }

  function applyTheme(pref) {
    root.setAttribute("data-theme", pref);
    root.setAttribute("data-effective-theme", resolveEffective(pref));
    syncButtons(pref);
    // 通知浏览器 chrome（地址栏等）当前配色
    const eff = resolveEffective(pref);
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach(function (m) {
      const target = m.getAttribute("media");
      // 只更新匹配当前生效主题的 meta
      if (!target || target.indexOf(eff) >= 0) {
        m.setAttribute("content", eff === "dark" ? "#2e3440" : "#ffffff");
      }
    });
  }

  function syncButtons(pref) {
    const btns = document.querySelectorAll(".theme-btn");
    btns.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-theme") === pref);
      btn.setAttribute("aria-pressed", btn.getAttribute("data-theme") === pref ? "true" : "false");
    });
  }

  function setTheme(pref) {
    let p = pref;
    if (p !== "light" && p !== "dark" && p !== "auto") p = "auto";
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch (e) {
      /* localStorage 不可用（隐私模式等），仅当前会话生效 */
    }
    applyTheme(p);
  }

  function init() {
    // 初始 active 状态（无闪烁脚本已设 data-theme，这里只同步按钮 UI）
    const current = root.getAttribute("data-theme") || "auto";
    syncButtons(current);

    // 按钮点击
    const btns = document.querySelectorAll(".theme-btn");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setTheme(btn.getAttribute("data-theme"));
      });
    });

    // auto 模式下，系统主题变化时实时跟随
    if (media.addEventListener) {
      media.addEventListener("change", function () {
        const pref = root.getAttribute("data-theme") || "auto";
        if (pref === "auto") {
          root.setAttribute("data-effective-theme", resolveEffective("auto"));
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
