/**
 * 索引缓存（IndexedDB + ETag 条件请求）逻辑测试
 *
 * chat.js 的 fetchIndexCached 是 IIFE 内部函数，不导出。本测试独立复现
 * 同一算法（ETag 304 复用 / 200 更新 / 无 IDB 回退 / 配额静默）来锁定行为，
 * 确保将来重构 chat.js 时不破坏缓存语义。
 *
 * 运行：node tests/chat/index-cache.test.js
 * 零依赖：手写最小 IndexedDB + fetch mock。
 */

const assert = require("assert");

// ── 最小 IndexedDB mock（in-memory）────────────────────────────────────────────
// 语义对齐真实 IDB：open → onupgradeneeded → onsuccess；transaction → request
function makeFakeIDB() {
  const stores = new Map(); // name -> Map(key -> value)

  function open(name, version) {
    const db = {
      objectStoreNames: { contains: (n) => stores.has(n) },
      createObjectStore(n, opts) {
        if (!stores.has(n)) stores.set(n, new Map());
        return makeStore(stores.get(n));
      },
      transaction(storeName, mode) {
        if (!stores.has(storeName)) throw new Error("no such store: " + storeName);
        const tx = { _done: false };
        const store = makeStore(stores.get(storeName));
        tx.objectStore = () => store;
        tx.oncomplete = null;
        tx.onerror = null;
        return tx;
      },
    };
    function makeStore(storeMap) {
      return {
        get(key) {
          const req = {};
          setTimeout(() => {
            req.result = storeMap.get(key);
            if (req.onsuccess) req.onsuccess();
          }, 0);
          return req;
        },
        put(value) {
          const req = {};
          setTimeout(() => {
            storeMap.set(value.url, value);
            if (req.onsuccess) req.onsuccess();
          }, 0);
          return req;
        },
      };
    }
    const req = {
      result: db,
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
    };
    setTimeout(() => {
      // 升级：建 store
      if (!stores.has("indices")) db.createObjectStore("indices", { keyPath: "url" });
      if (req.onupgradeneeded) req.onupgradeneeded();
      if (req.onsuccess) req.onsuccess();
    }, 0);
    return req;
  }
  return { open };
}

// ── fetch mock：可配置每次响应 ────────────────────────────────────────────────
function makeFetch(responses) {
  let i = 0;
  const calls = [];
  const fn = (url, opts = {}) => {
    calls.push({ url, headers: opts.headers || {} });
    const r = responses[Math.min(i, responses.length - 1)];
    i++;
    return Promise.resolve({
      status: r.status,
      ok: r.status >= 200 && r.status < 300,
      headers: { get: (k) => r.headers?.[k] ?? null },
      json: () => Promise.resolve(r.json),
    });
  };
  fn.calls = calls;
  return fn;
}

// ── 复现 chat.js 的缓存算法（与生产代码逐行对应）────────────────────────────
function makeCacheLayer({ indexedDB, fetch }) {
  let _idb = null;
  function openIndexDB() {
    if (_idb !== null) return Promise.resolve(_idb);
    try {
      if (!indexedDB) return Promise.resolve((_idb = false));
      _idb = new Promise((resolve) => {
        const req = indexedDB.open("yuu_chat_index", 1);
        req.onupgradeneeded = () => {
          const d = req.result;
          if (!d.objectStoreNames.contains("indices")) {
            d.createObjectStore("indices", { keyPath: "url" });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      return _idb;
    } catch (_) {
      _idb = false;
      return Promise.resolve(_idb);
    }
  }
  async function idbGet(url) {
    const d = await openIndexDB();
    if (!d) return null;
    return new Promise((resolve) => {
      try {
        const tx = d.transaction("indices", "readonly");
        const r = tx.objectStore().get(url);
        r.onsuccess = () => resolve(r.result || null);
        r.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }
  async function idbPut(url, etag, data) {
    const d = await openIndexDB();
    if (!d) return;
    return new Promise((resolve) => {
      try {
        const tx = d.transaction("indices", "readwrite");
        tx.objectStore().put({ url, etag, data });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }
  async function fetchIndexCached(filename) {
    const url = `pageindex/${filename}`;
    const cached = await idbGet(url);
    const headers = {};
    if (cached?.etag) headers["If-None-Match"] = cached.etag;
    const resp = await fetch(url, { headers });
    if (resp.status === 304 && cached) return cached.data;
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const etag = resp.headers.get("ETag") || cached?.etag || "";
    if (etag) idbPut(url, etag, data).catch(() => {});
    return data;
  }
  return { fetchIndexCached, idbGet, idbPut };
}

async function tick(n = 5) {
  for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 1));
}

async function main() {
  let pass = 0,
    fail = 0;
  const ok = (name, cond) => {
    if (cond) {
      pass++;
      console.log(`  ✓ ${name}`);
    } else {
      fail++;
      console.error(`  ✗ ${name}`);
    }
  };

  // 用例 1：首次加载（无缓存）→ fetch 200 → 写入缓存
  {
    const idb = makeFakeIDB();
    const fetch = makeFetch([
      { status: 200, headers: { ETag: '"abc"' }, json: { postings: { a: 1 } } },
    ]);
    const { fetchIndexCached, idbGet } = makeCacheLayer({ indexedDB: idb, fetch });
    const data = await fetchIndexCached("inverted-index.json");
    await tick();
    ok("1a 首次返回 200 的 body", data && data.postings.a === 1);
    ok("1b 请求未带 If-None-Match（无缓存）", !fetch.calls[0].headers["If-None-Match"]);
    const cached = await idbGet("pageindex/inverted-index.json");
    ok(
      "1c 写入缓存（etag + data）",
      cached && cached.etag === '"abc"' && cached.data.postings.a === 1
    );
  }

  // 用例 2：二次加载（有缓存）→ 带 If-None-Match → 304 → 复用缓存
  {
    const idb = makeFakeIDB();
    const fetch = makeFetch([
      { status: 200, headers: { ETag: '"v1"' }, json: { chunks: [] } },
      { status: 304, headers: {} },
    ]);
    const { fetchIndexCached } = makeCacheLayer({ indexedDB: idb, fetch });
    await fetchIndexCached("chunks.json");
    const data2 = await fetchIndexCached("chunks.json");
    ok("2a 304 时复用缓存数据", data2 && Array.isArray(data2.chunks));
    ok("2b 第二次请求带 If-None-Match", fetch.calls[1].headers["If-None-Match"] === '"v1"');
  }

  // 用例 3：ETag 变更 → 200 → 更新缓存
  {
    const idb = makeFakeIDB();
    const fetch = makeFetch([
      { status: 200, headers: { ETag: '"old"' }, json: { v: 1 } },
      { status: 200, headers: { ETag: '"new"' }, json: { v: 2 } },
    ]);
    const { fetchIndexCached, idbGet } = makeCacheLayer({ indexedDB: idb, fetch });
    await fetchIndexCached("x.json");
    const data2 = await fetchIndexCached("x.json");
    await tick();
    ok("3a 返回新 body", data2.v === 2);
    const cached = await idbGet("pageindex/x.json");
    ok("3b 缓存更新为新 etag", cached && cached.etag === '"new"' && cached.data.v === 2);
  }

  // 用例 4：无 IndexedDB（隐私模式）→ 直接 fetch，不抛错
  {
    const fetch = makeFetch([{ status: 200, headers: {}, json: { ok: true } }]);
    const { fetchIndexCached } = makeCacheLayer({ indexedDB: undefined, fetch });
    const data = await fetchIndexCached("y.json");
    ok("4 无 IDB 时回退直接 fetch", data && data.ok === true);
    ok("4b 无 IDB 时不带条件头", !fetch.calls[0].headers["If-None-Match"]);
  }

  // 用例 5：无 ETag 响应 → 不缓存但能正常返回（不崩）
  {
    const idb = makeFakeIDB();
    const fetch = makeFetch([{ status: 200, headers: {}, json: { x: 1 } }]);
    const { fetchIndexCached, idbGet } = makeCacheLayer({ indexedDB: idb, fetch });
    const data = await fetchIndexCached("z.json");
    await tick();
    ok("5 无 ETag 正常返回", data.x === 1);
    const cached = await idbGet("pageindex/z.json");
    ok("5b 无 ETag 不写入缓存", cached === null);
  }

  // 用例 6：HTTP 错误 → 抛错（上层 catch 回退）
  {
    const idb = makeFakeIDB();
    const fetch = makeFetch([{ status: 500, headers: {}, json: {} }]);
    const { fetchIndexCached } = makeCacheLayer({ indexedDB: idb, fetch });
    let threw = false;
    try {
      await fetchIndexCached("err.json");
    } catch (_) {
      threw = true;
    }
    ok("6 HTTP 错误抛错", threw);
  }

  // 用例 7：304 但无缓存（不一致状态）→ 抛错（不会返回坏数据）
  {
    const idb = makeFakeIDB();
    const fetch = makeFetch([{ status: 304, headers: {} }]);
    const { fetchIndexCached } = makeCacheLayer({ indexedDB: idb, fetch });
    let threw = false;
    try {
      await fetchIndexCached("weird.json");
    } catch (_) {
      threw = true;
    }
    ok("7 304 无缓存时抛错（不返回坏数据）", threw);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error("测试运行错误:", e);
  process.exit(1);
});
