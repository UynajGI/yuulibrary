#!/usr/bin/env python3
"""Build PageIndex JSON trees from Hugo content for static-site chat agent.

Two modes:
  --no-summary (default): pure structural, no LLM. summary = text 前 200 字截断。
  --with-summary:         LLM 生成 summary（< 200 token 用原文，≥ 200 调 litellm）。
                          litellm 按 model 前缀路由到任一 provider（多 API key 支持）。

Output: static/pageindex/{global-index,node-index,books/*,papers/*,notes/*}.json
"""

import asyncio
import hashlib
import json
import os
import re
import sys
import yaml

CONTENT_DIR = os.path.join(os.path.dirname(__file__), "..", "content")
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "pageindex")
FINGERPRINTS_FILE = os.path.join(STATIC_DIR, ".fingerprints.json")
BASE_URL = ""  # filled by Hugo relURL at runtime; script uses relative paths

# source_md 存相对路径（如 content/notes/xxx.md），chat agent 运行时拼 raw URL 前缀
# 这样 fork 仓库不用改——前缀从 Hugo BookRepo 配置推导
RAW_PATH_PREFIX = "content"

# summary 生成阈值（token）：短节点直接用原文，长节点才调 LLM
SUMMARY_TOKEN_THRESHOLD = 200
# LLM model（litellm 格式，如 deepseek/deepseek-chat）；空表示不调 LLM（本地模式）
LLM_MODEL = os.environ.get("LLM_MODEL", "")


def inject_summaries(nodes: list[dict], doc_label: str = "") -> None:
    """同步包装：遍历树注入 summary。无 LLM_MODEL 时只做截断退化。"""
    asyncio.run(add_summaries_to_tree(nodes, LLM_MODEL, doc_label))


# ── summary 生成（对齐 PageIndex get_node_summary 逻辑）─────────────────────

def count_tokens_approx(text: str) -> int:
    """近似 token 数：中文 chars/1.5 + 英文 chars/4。用于判断是否调 LLM。"""
    if not text:
        return 0
    cjk = len(re.findall(r"[一-鿿]", text))
    return int(cjk / 1.5 + (len(text) - cjk) / 4)


async def generate_summary(text: str, model: str = "") -> str:
    """短节点用原文，长节点调 LLM 生成要点摘要。

    无 model 或 text 不足阈值时退化（不调 LLM）：
    - < threshold: 返回原文
    - 无 model:    返回前 200 字截断（兼容旧 excerpt 行为）

    model 支持逗号分隔的优先级列表，依次尝试直到成功：
    LLM_MODEL="deepseek/deepseek-chat,mimo/mimo-v2-pro"
    会先试 DeepSeek，失败/无 key 则 fallback 到 MiMo。
    """
    text = text or ""
    if count_tokens_approx(text) < SUMMARY_TOKEN_THRESHOLD:
        return text
    if not model:
        return text[:200].replace("\n", " ").strip()

    models = [m.strip() for m in model.split(",") if m.strip()]
    if not models:
        return text[:200].replace("\n", " ").strip()

    import litellm
    litellm.drop_params = True

    last_error = ""
    for model_candidate in models:
        resolved, extra_kwargs = _resolve_model(model_candidate)
        try:
            resp = await litellm.acompletion(
                model=resolved,
                messages=[{"role": "user", "content": (
                    "你正在为一篇文档构建结构化索引。请概括以下节点内容的要点，"
                    "用一两句话描述这个节点讲了什么（便于检索时判断相关性）。"
                    "直接返回描述，不要加任何前缀或解释。\n\n"
                    f"{text[:3000]}"
                )}],
                temperature=0,
                **extra_kwargs,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            last_error = str(e)[:100]
            continue  # fallback to next model

    print(f"    ⚠ summary LLM 全部失败 ({len(models)} models)，退化为截断: {last_error}", file=sys.stderr)
    return text[:200].replace("\n", " ").strip()


def _resolve_model(model: str) -> tuple[str, dict]:
    """Resolve model shorthand to (litellm_model, extra_kwargs).

    Standard litellm models (deepseek/, anthropic/, openai/, etc.) pass through
    as-is — litellm auto-detects provider from env vars with matching API key.

    Custom providers that need api_base + separate API key are resolved here.
    """
    # MiMo (Xiaomi): OpenAI-compatible, needs custom base URL + separate API key
    # Defaults to CN endpoint (fastest from mainland); override with MIMO_BASE_URL
    if model.startswith("mimo/"):
        key = os.environ.get("MIMO_API_KEY", "")
        if not key:
            raise ValueError("MIMO_API_KEY not set — add to GitHub Secrets")
        base = os.environ.get(
            "MIMO_BASE_URL",
            "https://token-plan-cn.xiaomimimo.com/v1",
        )
        return ("openai/" + model[5:], {"api_base": base, "api_key": key})

    return model, {}


async def add_summaries_to_tree(nodes: list[dict], model: str, doc_label: str = "") -> None:
    """递归遍历树，为每个节点生成 summary（并发，限流 10 并发防 429）。"""
    if not nodes:
        return
    # 收集所有需要生成 summary 的（text 超阈值的）叶子节点
    tasks = []
    task_nodes = []

    def collect(ns):
        for n in ns:
            child_nodes = n.get("nodes", [])
            if child_nodes:
                collect(child_nodes)
            else:
                # 叶子节点：text 超阈值才调 LLM
                if count_tokens_approx(n.get("text", "")) >= SUMMARY_TOKEN_THRESHOLD and model:
                    tasks.append(generate_summary(n["text"], model))
                    task_nodes.append(n)

    collect(nodes)
    if tasks:
        total = len(tasks)
        done_count = [0]  # mutable counter for closure
        label = f"{doc_label} " if doc_label else ""

        async def limited(idx, task):
            async with asyncio.Semaphore(10):
                result = await task
                done_count[0] += 1
                if done_count[0] % 5 == 0 or done_count[0] == total:
                    print(f"    {label}summary {done_count[0]}/{total}", file=sys.stderr)
                return result

        print(f"    {label}generating {total} summaries (concurrency=10)...", file=sys.stderr)
        summaries = await asyncio.gather(*[limited(i, t) for i, t in enumerate(tasks)])
        for n, s in zip(task_nodes, summaries):
            n["summary"] = s
    # 非叶子节点 + 未调 LLM 的叶子节点：summary = text 截断或原文
    def fill(ns):
        for n in ns:
            if "summary" not in n:
                t = n.get("text", "")
                n["summary"] = t if count_tokens_approx(t) < SUMMARY_TOKEN_THRESHOLD else t[:200].replace("\n", " ").strip()
            if n.get("nodes"):
                fill(n["nodes"])
    fill(nodes)


# ── fingerprint incremental update ──────────────────────────────────────────

def file_fingerprint(path: str) -> str:
    """MD5 hash of file contents. path is relative to content/."""
    abs_path = os.path.join(CONTENT_DIR, path) if not os.path.isabs(path) else path
    with open(abs_path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def collect_content_files() -> list[str]:
    """Return all .md files under content/ as paths relative to content/.

    Relative paths make fingerprints portable across local and CI environments
    (absolute paths differ: /home/user/... vs /home/runner/work/...).
    Example: 'books/slug/ch01.md', 'notes/draft.md'
    """
    files = []
    for root, _, fnames in os.walk(CONTENT_DIR):
        for fn in fnames:
            if fn.endswith(".md"):
                abs_path = os.path.join(root, fn)
                rel_path = os.path.relpath(abs_path, CONTENT_DIR)
                files.append(rel_path)
    return sorted(files)


def load_fingerprints() -> dict[str, str]:
    """Load stored {path: md5} map."""
    if os.path.exists(FINGERPRINTS_FILE):
        with open(FINGERPRINTS_FILE, "r") as f:
            return json.load(f)
    return {}


def save_fingerprints(fps: dict[str, str]) -> None:
    os.makedirs(STATIC_DIR, exist_ok=True)
    with open(FINGERPRINTS_FILE, "w") as f:
        json.dump(fps, f, indent=2, sort_keys=True)


def changed_files(existing_fps: dict[str, str]) -> list[str]:
    """Return content files that are new or modified since last build."""
    current = collect_content_files()
    changed = []
    for path in current:
        old_hash = existing_fps.get(path, "")
        new_hash = file_fingerprint(path)
        if new_hash != old_hash:
            changed.append(path)
    return changed


def update_fingerprints() -> dict[str, str]:
    """Compute fresh fingerprints for all content files and save."""
    fps = {}
    for path in collect_content_files():
        fps[path] = file_fingerprint(path)
    save_fingerprints(fps)
    return fps

# ── front matter ────────────────────────────────────────────────────────────

FM_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def parse_front_matter(text: str) -> tuple[dict, str, int]:
    """Parse YAML front matter between --- delimiters.
    Returns (metadata, body, body_start_line_number)."""
    m = FM_RE.match(text)
    if not m:
        return {}, text, 0
    try:
        meta = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError:
        meta = {}
    body = text[m.end():]
    fm_lines = text[:m.end()].count("\n")
    return meta, body, fm_lines


# ── heading extraction ──────────────────────────────────────────────────────

HEADING_RE = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)
CODE_FENCE_RE = re.compile(r"^```", re.MULTILINE)


def extract_headings(body: str, line_offset: int = 0) -> list[dict]:
    """Extract headings from markdown body, skipping code fences.
    Returns flat list of {title, level, line_num} sorted by position."""
    nodes = []
    lines = body.split("\n")
    in_code = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        m = re.match(r"^(#{1,6})\s+(.+)$", stripped)
        if m:
            nodes.append({
                "title": m.group(2).strip(),
                "level": len(m.group(1)),
                "line_num": line_offset + i,
            })
    return nodes


def attach_text(nodes: list[dict], body_lines: list[str], total_lines: int) -> None:
    """Attach full text + line_end (heading line → next heading) to each node in-place."""
    for i, node in enumerate(nodes):
        start = node["line_num"]
        end = nodes[i + 1]["line_num"] if i + 1 < len(nodes) else total_lines
        node["text"] = "\n".join(body_lines[start:end]).strip()
        node["line_end"] = end


# ── tree building ───────────────────────────────────────────────────────────

def build_tree(flat_nodes: list[dict]) -> list[dict]:
    """Stack-based nested tree from flat heading list."""
    if not flat_nodes:
        return []
    stack: list[tuple[dict, int]] = []
    roots: list[dict] = []
    counter = [0]  # mutable counter for node_id

    for node in flat_nodes:
        tree_node = {
            "title": node["title"],
            "node_id": "",  # filled later
            "text": node.get("text", ""),
            "line_num": node.get("line_num", 0),
            "line_end": node.get("line_end", 0),
            "nodes": [],
        }
        level = node["level"]

        while stack and stack[-1][1] >= level:
            stack.pop()

        if not stack:
            roots.append(tree_node)
        else:
            stack[-1][0]["nodes"].append(tree_node)

        stack.append((tree_node, level))

    return roots


def assign_node_ids(tree: list[dict], counter: list[int] | None = None) -> None:
    """Depth-first node ID assignment (0001, 0002, ...)."""
    if counter is None:
        counter = [0]
    for node in tree:
        counter[0] += 1
        node["node_id"] = str(counter[0]).zfill(4)
        if node.get("nodes"):
            assign_node_ids(node["nodes"], counter)


def clean_tree(tree: list[dict]) -> list[dict]:
    """Remove text (chat agent fetches from source_md), keep source_md + line range."""
    result = []
    for node in tree:
        cleaned = {
            "title": node["title"],
            "node_id": node["node_id"],
            "summary": node.get("summary", ""),
            "line_num": node.get("line_num", 0),
            "line_end": node.get("line_end", 0),
            "source_md": node.get("source_md", ""),
        }
        if node.get("nodes"):
            cleaned["nodes"] = clean_tree(node["nodes"])
        result.append(cleaned)
    return result


# ── node-index.json flattening ──────────────────────────────────────────────

def flatten_tree(tree: list[dict], doc_id: str, breadcrumb: list[str],
                 doc_url_prefix: str) -> list[dict]:
    """Flatten tree into list of {doc_id, node_id, title, breadcrumb, url, summary, line_num}."""
    result = []
    for node in tree:
        crumb = breadcrumb + [node["title"]]
        text = node.get("text", "")
        # summary：优先用已生成的 LLM 摘要，否则退化截断
        summary = node.get("summary") or text[:200].replace("\n", " ").strip()
        terms = extract_terms(node["title"])
        result.append({
            "doc_id": doc_id,
            "node_id": node["node_id"],
            "title": node["title"],
            "breadcrumb": crumb,
            "url": f"{doc_url_prefix}#pi-node-{node['node_id']}",
            "terms": terms,
            "summary": summary,
            "line_num": node.get("line_num", 0),
        })
        if node.get("nodes"):
            result.extend(flatten_tree(node["nodes"], doc_id, crumb, doc_url_prefix))
    return result


def flatten_tree_with_text(tree: list[dict], doc_id: str,
                           breadcrumb: list[str]) -> list[dict]:
    """Flatten tree 保留正文 text + source_md（供 chunk 切分）。

    在 clean_tree 剥离 text 之前调用。只取叶子节点（有正文的），
    容器节点（text 仅是 description）不参与正文 chunk。
    """
    result = []
    for node in tree:
        crumb = breadcrumb + [node["title"]]
        children = node.get("nodes") or []
        # 只为有实际正文的节点生成 chunk 节点（容器节点 text 太短，跳过）
        text = node.get("text", "")
        if text and len(text) > 30:
            result.append({
                "doc_id": doc_id,
                "node_id": node["node_id"],
                "title": node["title"],
                "breadcrumb": crumb,
                "summary": node.get("summary") or text[:200].replace("\n", " ").strip(),
                "text": text,
                "source_md": node.get("source_md", ""),
                "line_num": node.get("line_num", 0),
            })
        if children:
            result.extend(flatten_tree_with_text(children, doc_id, crumb))
    return result



def extract_terms(title: str) -> list[str]:
    """Extract searchable terms from a title string."""
    # Split on common separators, keep words >= 2 chars
    parts = re.split(r"[\s·\-\—\.\,\;\:\!\?\(\)\[\]\{\}]+", title)
    terms = []
    for p in parts:
        p = p.strip()
        if len(p) >= 2:
            terms.append(p)
    return list(dict.fromkeys(terms))  # dedup, preserve order


# ── tokenizer（与 chat.js / retrieval.js 的 tokenize() 行为对齐） ──────────────
# 关键：构建期 postings 的 token 必须与运行期查询 token 完全一致，否则查不到。
# JS 逻辑：英文 [a-zA-Z][a-zA-Z0-9]{1,} lower + 数字 \d{2,} + CJK 2-gram。
_EN_RE = re.compile(r"[a-zA-Z][a-zA-Z0-9]{1,}")
_NUM_RE = re.compile(r"\d{2,}")
_CJK_RE = re.compile(r"[一-鿿]+")


def tokenize_raw(text: str) -> list[str]:
    """保留重复（BM25 真实 TF 用）。与 retrieval.js tokenizeRaw 对齐。"""
    if not text:
        return []
    tokens: list[str] = []
    tokens.extend(w.lower() for w in _EN_RE.findall(text))
    tokens.extend(_NUM_RE.findall(text))
    for seg in _CJK_RE.findall(text):
        for i in range(len(seg) - 1):
            tokens.append(seg[i:i + 2])  # 2-gram
    return tokens


def tokenize_unique(text: str) -> list[str]:
    """去重保持序（DF / postings 候选用）。与 retrieval.js tokenizeUnique 对齐。"""
    seen: set[str] = set()
    out = []
    for t in tokenize_raw(text):
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out


def tokenize(text: str) -> list[str]:
    """保留重复（BM25 TF 用）——与 retrieval.js tokenize 对齐。
    历史 API：旧代码用此名，阶段 2 改为保留重复以修 TF 失真。
    """
    return tokenize_raw(text)


# ── 正文 chunk 切分 + 倒排 postings 构建 ──────────────────────────────────────
# 让正文深处的事实可被第一阶段检索命中（修复 summary 截断导致正文大部分不可搜索）。
# chunk 粒度：中文 ~500 字符，重叠 ~100，优先段落边界。

CHUNK_TARGET_CHARS = 500
CHUNK_OVERLAP_CHARS = 100
# 停用词阈值：DF 超过此比例的 token 视为停用词（IDF 极低，占体积不区分），写入时丢弃。
STOPWORD_DF_RATIO = 0.35
_CHUNK_COUNTER = [0]  # 全局 chunk_id 计数器（进程级）


def _next_chunk_id() -> str:
    _CHUNK_COUNTER[0] += 1
    return f"c{_CHUNK_COUNTER[0]:06d}"


def reset_chunk_counter() -> None:
    """每个全量/增量构建开始前重置（保证可复现的 chunk_id）。"""
    _CHUNK_COUNTER[0] = 0


def split_into_chunks(text: str, target: int = CHUNK_TARGET_CHARS,
                      overlap: int = CHUNK_OVERLAP_CHARS) -> list[tuple[str, int, int]]:
    """把正文切成 ~target 字符的 chunk，重叠 overlap 字符。

    优先段落边界（空行切分），单段超长再按 target 硬切。
    返回 [(chunk_text, start_char, end_char), ...]，char 偏移相对于 text。
    """
    if not text or not text.strip():
        return []
    paragraphs = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
    if not paragraphs:
        return []
    chunks: list[tuple[str, int, int]] = []
    buf = ""
    buf_start = 0
    pos = 0  # 当前在 text 中的字符游标

    def flush(end_pos: int) -> None:
        nonlocal buf, buf_start
        if buf.strip():
            chunks.append((buf.strip(), buf_start, end_pos))
        # 重叠：保留末尾 overlap 字符作为下一段起点
        if overlap > 0 and len(buf) > overlap:
            tail = buf[-overlap:]
            buf = tail
            buf_start = end_pos - overlap
        else:
            buf = ""
            buf_start = end_pos

    for para in paragraphs:
        # 单段超长 → 直接按 target 切（不再等累加）
        if len(para) >= target:
            if buf.strip():
                flush(pos)
            i = 0
            while i < len(para):
                piece = para[i:i + target]
                chunks.append((piece.strip(), pos + i, pos + i + len(piece)))
                i += target - overlap if (target - overlap) > 0 else target
            # 段后游标推进（para 末尾 + 原段间分隔）
            pos += len(para) + 2  # \n\n 近似
            continue
        # 累加段落
        if len(buf) + len(para) + 2 > target and buf:
            flush(pos)
        if not buf:
            buf_start = pos
        buf = (buf + "\n\n" + para) if buf else para
        pos += len(para) + 2  # 段间 \n\n
    flush(pos)
    return chunks


def build_chunks_and_postings(flat_nodes: list[dict], doc_meta: dict) -> tuple[list[dict], dict]:
    """为 flat_nodes 生成正文 chunk + 倒排 postings。

    flat_nodes: node-index 风格的节点（含 title/breadcrumb/summary/source_md/line_num）。
        注意此处正文 text 不在 node-index 里——调用方需先把正文塞进 node["text"]。
    doc_meta: {doc_id, doc_title, doc_type, ...} 用于 chunk 元数据。

    返回 (chunks, postings)：
      chunks: [{chunk_id, doc_id, node_id, title, breadcrumb, body, summary,
                source_md, line_num, line_end}, ...]
      postings: {token: [{c: chunk_id, tf: int}, ...]}
    """
    chunks: list[dict] = []
    postings: dict[str, list[dict]] = {}
    doc_id = doc_meta.get("doc_id", "")
    doc_title = doc_meta.get("title", "")
    doc_type = doc_meta.get("type", "")
    for node in flat_nodes:
        body = node.get("text", "") or ""
        title = node.get("title", "")
        breadcrumb = node.get("breadcrumb", [])
        source_md = node.get("source_md", "")
        line_num = node.get("line_num", 0)
        node_id = node.get("node_id", "")
        # 短正文不切，整段一个 chunk
        if len(body) <= CHUNK_TARGET_CHARS:
            pieces = [(body, 0, len(body))] if body.strip() else []
        else:
            pieces = split_into_chunks(body)
        for ci, (piece, _cstart, cend) in enumerate(pieces):
            chunk_id = _next_chunk_id()
            chunk = {
                "chunk_id": chunk_id,
                "doc_id": doc_id,
                "node_id": node_id,
                # summary 不存——node-index.json 已有，运行期按 node_id 关联，省 ~8MB
                "title": title,
                "breadcrumb": breadcrumb,
                "body": piece,
                "source_md": source_md,
                "line_num": line_num,
            }
            chunks.append(chunk)
            # postings：body + title + breadcrumb 一起 token 化（标题权重在运行期 BM25F 加）
            combined = f"{title} {' '.join(breadcrumb)} {piece}"
            toks = tokenize(combined)
            # chunk 内 TF（保留重复——这是阶段 2 正确 BM25 的基础）
            tf_map: dict[str, int] = {}
            for t in toks:
                tf_map[t] = tf_map.get(t, 0) + 1
            # 紧凑格式：posting = [cid_num, tf]（cid_num 为整数，运行期拼回 c000001）
            cid_num = _CHUNK_COUNTER[0]
            for t, tf in tf_map.items():
                postings.setdefault(t, []).append([cid_num, tf])
    return chunks, postings


def merge_postings(all_postings: list[dict]) -> dict:
    """合并多个文档的 postings dict → 全局 postings。

    all_postings: [{token: [{c, tf}, ...]}, ...]
    同 token 的 posting list 合并（chunk_id 全局唯一，无需再去重）。
    """
    merged: dict[str, list[dict]] = {}
    for p in all_postings:
        for tok, lst in p.items():
            merged.setdefault(tok, []).extend(lst)
    return merged



# ── document processing ─────────────────────────────────────────────────────

def process_book(slug: str, book_dir: str) -> tuple[dict | None, list[dict]]:
    """Build PageIndex tree for a book by merging all chapter files.
    Returns (doc_tree, flat_nodes_for_index)."""
    index_path = os.path.join(book_dir, "_index.md")
    if not os.path.exists(index_path):
        return None, []

    with open(index_path, "r") as f:
        index_text = f.read()
    meta, _, _ = parse_front_matter(index_text)
    book_title = meta.get("title", slug)

    # Collect chapter files sorted by weight
    chapters = []
    for fname in sorted(os.listdir(book_dir)):
        if not fname.endswith(".md") or fname == "_index.md":
            continue
        fpath = os.path.join(book_dir, fname)
        with open(fpath, "r") as f:
            content = f.read()
        ch_meta, body, body_offset = parse_front_matter(content)
        ch_title = ch_meta.get("title", os.path.splitext(fname)[0])
        ch_weight = ch_meta.get("weight", 999)
        chapters.append((ch_weight, ch_title, body, body_offset, fname))

    chapters.sort(key=lambda x: x[0])

    # Build tree: book → chapters → sections
    all_nodes = []
    book_root = {
        "title": book_title,
        "node_id": "",  # filled later
        "text": meta.get("description", ""),
        "nodes": [],
    }

    for _, ch_title, body, body_offset, fname in chapters:
        body_lines = body.split("\n")
        headings = extract_headings(body, 0)
        if not headings:
            continue
        attach_text(headings, body_lines, len(body_lines))
        ch_tree = build_tree(headings)

        # Wrap chapter in a chapter-level node（纯容器：text 放 description，不重复正文）
        # 分文件模式下正文全在子节点里，chapter 只做层级容器
        ch_description = ch_meta.get("description", "")
        ch_source_md = f"{RAW_PATH_PREFIX}/books/{slug}/{fname}"
        ch_node = {
            "title": ch_title,
            "node_id": "",
            "text": ch_description,  # front matter description，非正文（summary 生成用）
            "line_num": headings[0].get("line_num", 0) if headings else 0,
            "line_end": headings[-1].get("line_end", 0) if headings else 0,
            "source_md": ch_source_md,
            "nodes": ch_tree,
        }
        # 子节点继承 chapter 的 source_md（在同一文件里）
        def propagate_source(nodes, src):
            for n in nodes:
                n["source_md"] = src
                if n.get("nodes"):
                    propagate_source(n["nodes"], src)
        propagate_source(ch_tree, ch_source_md)
        book_root["nodes"].append(ch_node)

    # Assign IDs
    counter = [0]
    for ch_node in book_root["nodes"]:
        counter[0] += 1
        ch_node["node_id"] = str(counter[0]).zfill(4)
        assign_node_ids(ch_node.get("nodes", []), counter)

    # Flatten for node-index
    book_url_prefix = f"/books/{slug}/"
    # Generate summaries (LLM if LLM_MODEL set, else truncated fallback)
    # Must run BEFORE flatten (chapter nodes need summary filled) and clean_tree
    inject_summaries(book_root["nodes"], f"book/{slug}")

    # Flatten for node-index (after summaries are injected)
    # The URL for chapter content needs the chapter filename
    flat_nodes = []
    chapter_files = [c[4] for c in chapters]  # fnames in order
    ch_idx = 0
    for ch_node in book_root["nodes"]:
        ch_fname = os.path.splitext(chapter_files[ch_idx])[0] + ".html"
        ch_url = f"{book_url_prefix}{ch_fname}"
        # Add chapter node itself
        ch_text = ch_node.get("text", "")
        flat_nodes.append({
            "doc_id": slug,
            "node_id": ch_node["node_id"],
            "title": ch_node["title"],
            "breadcrumb": [book_title, ch_node["title"]],
            "url": f"{ch_url}#pi-node-{ch_node['node_id']}",
            "terms": extract_terms(ch_node["title"]),
            "summary": ch_node.get("summary") or ch_text[:200].replace("\n", " ").strip(),
            "line_num": ch_node.get("line_num", 0),
        })
        # Flatten children
        child_flat = flatten_tree(ch_node.get("nodes", []), slug,
                                  [book_title, ch_node["title"]], ch_url)
        flat_nodes.extend(child_flat)
        ch_idx += 1

    # 在 clean_tree 剥离 text 之前，先抽出带正文的扁平节点（供 chunk 切分）
    chunk_nodes = []
    for ch_node in book_root["nodes"]:
        chunk_nodes.extend(
            flatten_tree_with_text(ch_node.get("nodes", []), slug, [book_title, ch_node["title"]])
        )

    # Clean tree（修复：clean_tree 返回新列表，必须赋回，否则书树 JSON 仍保留完整 text）
    book_root["node_id"] = "0000"
    for ch_node in book_root["nodes"]:
        ch_node["nodes"] = clean_tree(ch_node.get("nodes", []))

    doc_tree = {
        "doc_name": slug,
        "type": "book",
        "title": book_title,
        "author": meta.get("author", ""),
        "description": meta.get("description", ""),
        "tags": meta.get("tags", []),
        "structure": book_root["nodes"],
    }
    return doc_tree, flat_nodes, chunk_nodes


def process_paper(slug: str, paper_dir: str) -> tuple[dict | None, list[dict], list[dict]]:
    """Build PageIndex tree for a paper from its _index.md.
    Returns (doc_tree, flat_nodes_for_index, chunk_nodes_with_text)."""
    index_path = os.path.join(paper_dir, "_index.md")
    if not os.path.exists(index_path):
        return None, [], []

    with open(index_path, "r") as f:
        content = f.read()
    meta, body, body_offset = parse_front_matter(content)
    doc_title = meta.get("title", slug)
    body_lines = body.split("\n")
    headings = extract_headings(body, 0)
    if not headings:
        return None, [], []

    attach_text(headings, body_lines, len(body_lines))
    tree = build_tree(headings)
    assign_node_ids(tree)

    # 所有节点指向同一篇 md（paper 是单文件 _index.md）
    paper_source_md = f"{RAW_PATH_PREFIX}/papers/{slug}/_index.md"
    def propagate_paper_source(nodes):
        for n in nodes:
            n["source_md"] = paper_source_md
            if n.get("nodes"):
                propagate_paper_source(n["nodes"])
    propagate_paper_source(tree)

    doc_url = f"/papers/{slug}/index.html"

    # Generate summaries (LLM if LLM_MODEL set, else truncated fallback)
    # Must run BEFORE flatten and clean_tree (both read node.summary)
    inject_summaries(tree, f"paper/{slug}")

    flat = flatten_tree(tree, slug, [doc_title], doc_url)
    # clean_tree 前先抽带正文的扁平节点（供 chunk 切分）
    chunk_nodes = flatten_tree_with_text(tree, slug, [doc_title])

    doc_tree = {
        "doc_name": slug,
        "type": "paper",
        "title": doc_title,
        "author": meta.get("author", ""),
        "year": meta.get("year", ""),
        "description": meta.get("description", ""),
        "tags": meta.get("tags", []),
        "structure": clean_tree(tree),
    }
    return doc_tree, flat, chunk_nodes


def process_note(slug: str, note_path: str) -> tuple[dict | None, list[dict], list[dict]]:
    """Build PageIndex tree for a standalone note .md file.
    Returns (doc_tree, flat_nodes_for_index, chunk_nodes_with_text)."""
    with open(note_path, "r") as f:
        content = f.read()
    meta, body, body_offset = parse_front_matter(content)
    doc_title = meta.get("title", slug)
    body_lines = body.split("\n")
    headings = extract_headings(body, 0)
    if not headings:
        return None, [], []

    attach_text(headings, body_lines, len(body_lines))
    tree = build_tree(headings)
    assign_node_ids(tree)

    # 所有节点指向同一篇 md（note 是单文件 slug.md）
    note_source_md = f"{RAW_PATH_PREFIX}/notes/{slug}.md"
    def propagate_note_source(nodes):
        for n in nodes:
            n["source_md"] = note_source_md
            if n.get("nodes"):
                propagate_note_source(n["nodes"])
    propagate_note_source(tree)

    doc_url = f"/notes/{slug}.html"

    # Generate summaries (LLM if LLM_MODEL set, else truncated fallback)
    # Must run BEFORE flatten and clean_tree (both read node.summary)
    inject_summaries(tree, f"note/{slug}")

    flat = flatten_tree(tree, slug, [doc_title], doc_url)
    # clean_tree 前先抽带正文的扁平节点（供 chunk 切分）
    chunk_nodes = flatten_tree_with_text(tree, slug, [doc_title])

    doc_tree = {
        "doc_name": slug,
        "type": "note",
        "title": doc_title,
        "author": meta.get("author", ""),
        "date": str(meta.get("date", "")),
        "description": meta.get("description", ""),
        "tags": meta.get("tags", []),
        "source_type": meta.get("source_type", ""),
        "source_title": meta.get("source_title", ""),
        "structure": clean_tree(tree),
    }
    return doc_tree, flat, chunk_nodes


# ── main ────────────────────────────────────────────────────────────────────

def main():
    os.makedirs(os.path.join(STATIC_DIR, "books"), exist_ok=True)
    os.makedirs(os.path.join(STATIC_DIR, "papers"), exist_ok=True)
    os.makedirs(os.path.join(STATIC_DIR, "notes"), exist_ok=True)

    global_docs: list[dict] = []
    all_nodes: list[dict] = []
    all_chunk_nodes: list[dict] = []  # 带正文的扁平节点（供 chunk 倒排索引）
    reset_chunk_counter()

    # ── books ──
    books_dir = os.path.join(CONTENT_DIR, "books")
    if os.path.isdir(books_dir):
        for slug in sorted(os.listdir(books_dir)):
            book_dir = os.path.join(books_dir, slug)
            if not os.path.isdir(book_dir) or slug.startswith("_"):
                continue
            doc_tree, flat, chunk_nodes = process_book(slug, book_dir)
            if doc_tree is None:
                continue

            out_path = os.path.join(STATIC_DIR, "books", f"{slug}.json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(doc_tree, f, indent=2, ensure_ascii=False)
            print(f"  [book]  {slug}  ({len(flat)} nodes)")

            global_docs.append({
                "id": slug,
                "type": "book",
                "title": doc_tree["title"],
                "author": doc_tree["author"],
                "description": doc_tree["description"],
                "tags": doc_tree["tags"],
                "path": f"/books/{slug}/",
                "url": f"/books/{slug}.html",
            })
            all_nodes.extend(flat)
            all_chunk_nodes.extend(chunk_nodes)

    # ── papers ──
    papers_dir = os.path.join(CONTENT_DIR, "papers")
    if os.path.isdir(papers_dir):
        for slug in sorted(os.listdir(papers_dir)):
            paper_dir = os.path.join(papers_dir, slug)
            if not os.path.isdir(paper_dir) or slug.startswith("_"):
                continue
            doc_tree, flat, chunk_nodes = process_paper(slug, paper_dir)
            if doc_tree is None:
                continue

            out_path = os.path.join(STATIC_DIR, "papers", f"{slug}.json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(doc_tree, f, indent=2, ensure_ascii=False)
            print(f"  [paper] {slug}  ({len(flat)} nodes)")

            global_docs.append({
                "id": slug,
                "type": "paper",
                "title": doc_tree["title"],
                "author": doc_tree["author"],
                "year": doc_tree.get("year", ""),
                "description": doc_tree["description"],
                "tags": doc_tree["tags"],
                "path": f"/papers/{slug}/",
                "url": f"/papers/{slug}.html",
            })
            all_nodes.extend(flat)
            all_chunk_nodes.extend(chunk_nodes)

    # ── notes ──
    notes_dir = os.path.join(CONTENT_DIR, "notes")
    if os.path.isdir(notes_dir):
        for fname in sorted(os.listdir(notes_dir)):
            if not fname.endswith(".md") or fname == "_index.md":
                continue
            slug = os.path.splitext(fname)[0]
            note_path = os.path.join(notes_dir, fname)
            doc_tree, flat, chunk_nodes = process_note(slug, note_path)
            if doc_tree is None:
                continue

            out_path = os.path.join(STATIC_DIR, "notes", f"{slug}.json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(doc_tree, f, indent=2, ensure_ascii=False)
            print(f"  [note]  {slug}  ({len(flat)} nodes)")

            global_docs.append({
                "id": slug,
                "type": "note",
                "title": doc_tree["title"],
                "author": doc_tree["author"],
                "date": doc_tree.get("date", ""),
                "description": doc_tree["description"],
                "tags": doc_tree["tags"],
                "source_type": doc_tree.get("source_type", ""),
                "source_title": doc_tree.get("source_title", ""),
                "path": f"/notes/",
                "url": f"/notes/{slug}.html",
            })
            all_nodes.extend(flat)
            all_chunk_nodes.extend(chunk_nodes)

    # ── write global-index.json ──
    global_path = os.path.join(STATIC_DIR, "global-index.json")
    with open(global_path, "w", encoding="utf-8") as f:
        json.dump({"docs": global_docs}, f, indent=2, ensure_ascii=False)
    print(f"\n  global-index: {len(global_docs)} docs")

    # ── write node-index.json ──
    node_index_path = os.path.join(STATIC_DIR, "node-index.json")
    with open(node_index_path, "w", encoding="utf-8") as f:
        json.dump({"nodes": all_nodes}, f, indent=2, ensure_ascii=False)
    print(f"  node-index:   {len(all_nodes)} nodes")

    # ── build + write inverted index (正文 chunk 倒排索引) ──
    write_inverted_index(all_chunk_nodes, global_docs)

    # ── size summary ──
    total_kb = 0
    for root, _, files in os.walk(STATIC_DIR):
        for fname in files:
            total_kb += os.path.getsize(os.path.join(root, fname))
    print(f"  total size:   {total_kb / 1024:.1f} KB")

    # 全量重建后也写 fingerprints，否则下次 --incremental 会再次全量
    update_fingerprints()


def write_inverted_index(all_chunk_nodes: list[dict], global_docs: list[dict]) -> None:
    """构建全局 chunks.json + inverted-index.json。

    all_chunk_nodes: 所有文档的带正文扁平节点（doc_id 分组无序，这里按 doc 重建 chunk）。
    global_docs: 用于 doc_meta（doc_title / type）。
    """
    doc_meta = {d["id"]: d for d in global_docs}
    # 按 doc 分组构建 chunk + postings（每文档独立 postings，最后 merge）
    by_doc: dict[str, list[dict]] = {}
    for n in all_chunk_nodes:
        by_doc.setdefault(n["doc_id"], []).append(n)

    all_chunks: list[dict] = []
    all_postings: list[dict] = []
    for doc_id, nodes in by_doc.items():
        meta = doc_meta.get(doc_id, {})
        doc_meta_for_chunk = {
            "doc_id": doc_id,
            "title": meta.get("title", doc_id),
            "type": meta.get("type", ""),
        }
        chunks, postings = build_chunks_and_postings(nodes, doc_meta_for_chunk)
        all_chunks.extend(chunks)
        all_postings.append(postings)

    merged_postings = merge_postings(all_postings)
    # 停用词截断：DF 过高的 token（出现在 >STOPWORD_DF_RATIO 比例 chunk 里）IDF 极低，
    # 不参与有效区分，却占用最大 posting list。写入时丢弃以控体积。
    n_chunks = len(all_chunks) or 1
    stopword_cap = int(n_chunks * STOPWORD_DF_RATIO)
    kept_tokens = 0
    dropped_tokens = 0
    filtered: dict[str, list] = {}
    for tok, lst in merged_postings.items():
        if len(lst) > stopword_cap:
            dropped_tokens += 1
            continue
        filtered[tok] = lst
        kept_tokens += 1

    chunks_path = os.path.join(STATIC_DIR, "chunks.json")
    with open(chunks_path, "w", encoding="utf-8") as f:
        # 紧凑 JSON（无 indent）——大文件省 20-30% 体积
        json.dump({"chunks": all_chunks}, f, ensure_ascii=False, separators=(",", ":"))
    postings_path = os.path.join(STATIC_DIR, "inverted-index.json")
    with open(postings_path, "w", encoding="utf-8") as f:
        json.dump({"postings": filtered, "num_chunks": n_chunks}, f,
                  ensure_ascii=False, separators=(",", ":"))
    print(f"  chunks:       {n_chunks} chunks, "
          f"{kept_tokens} tokens (dropped {dropped_tokens} stopwords, cap={stopword_cap})")


def changed_docs(file_paths: list[str]) -> set[tuple[str, str]]:
    """Map changed file paths to affected (type, slug) pairs.
    file_paths are relative to content/ (e.g. 'books/slug/ch01.md').
    """
    docs = set()
    for path in file_paths:
        parts = path.replace("\\", "/").split("/")
        if parts[0] == "books" and len(parts) >= 2:
            docs.add(("book", parts[1]))
        elif parts[0] == "papers" and len(parts) >= 2:
            docs.add(("paper", parts[1]))
        elif parts[0] == "notes" and parts[-1].endswith(".md") and parts[-1] != "_index.md":
            docs.add(("note", os.path.splitext(parts[-1])[0]))
    return docs


def process_one_doc(doc_type: str, slug: str) -> tuple[dict | None, list[dict], list[dict]]:
    """Process a single document and return (doc_tree, flat_nodes, chunk_nodes)."""
    if doc_type == "book":
        book_dir = os.path.join(CONTENT_DIR, "books", slug)
        if os.path.isdir(book_dir):
            return process_book(slug, book_dir)
    elif doc_type == "paper":
        paper_dir = os.path.join(CONTENT_DIR, "papers", slug)
        if os.path.isdir(paper_dir):
            return process_paper(slug, paper_dir)
    elif doc_type == "note":
        note_path = os.path.join(CONTENT_DIR, "notes", f"{slug}.md")
        if os.path.isfile(note_path):
            return process_note(slug, note_path)
    return None, [], []


def patch_indexes(doc_type: str, slug: str, doc_tree: dict | None, flat: list[dict],
                  chunk_nodes: list[dict] | None = None) -> None:
    """Insert/update or remove entries for a single doc in global-index + node-index
    + chunks/inverted-index."""
    gi_path = os.path.join(STATIC_DIR, "global-index.json")
    ni_path = os.path.join(STATIC_DIR, "node-index.json")

    gi = {"docs": []}
    ni = {"nodes": []}
    if os.path.exists(gi_path):
        with open(gi_path, "r") as f:
            gi = json.load(f)
    if os.path.exists(ni_path):
        with open(ni_path, "r") as f:
            ni = json.load(f)

    # Remove old entries for this doc
    gi["docs"] = [d for d in gi["docs"] if not (d.get("id") == slug and d.get("type") == doc_type)]
    ni["nodes"] = [n for n in ni["nodes"] if n.get("doc_id") != slug]

    # Add new entries if doc was rebuilt successfully
    if doc_tree is not None:
        entry = {
            "id": slug, "type": doc_type,
            "title": doc_tree["title"],
            "author": doc_tree.get("author", ""),
            "description": doc_tree.get("description", ""),
            "tags": doc_tree.get("tags", []),
        }
        if doc_type == "book":
            entry["path"] = f"/books/{slug}/"
            entry["url"] = f"/books/{slug}.html"
        elif doc_type == "paper":
            entry["path"] = f"/papers/{slug}/"
            entry["url"] = f"/papers/{slug}.html"
            entry["year"] = doc_tree.get("year", "")
        elif doc_type == "note":
            entry["path"] = "/notes/"
            entry["url"] = f"/notes/{slug}.html"
            entry["date"] = doc_tree.get("date", "")
            entry["source_type"] = doc_tree.get("source_type", "")
            entry["source_title"] = doc_tree.get("source_title", "")
        gi["docs"].append(entry)
        ni["nodes"].extend(flat)

    with open(gi_path, "w", encoding="utf-8") as f:
        json.dump(gi, f, indent=2, ensure_ascii=False)
    with open(ni_path, "w", encoding="utf-8") as f:
        json.dump(ni, f, indent=2, ensure_ascii=False)

    # 同步更新倒排索引（chunks + postings）
    if chunk_nodes is not None:
        patch_inverted_index(slug, doc_tree, chunk_nodes)


def patch_inverted_index(slug: str, doc_tree: dict | None, chunk_nodes: list[dict]) -> None:
    """增量更新单文档在 chunks.json + inverted-index.json 中的条目。

    策略：先移除该 doc 的旧 chunk，再为新 chunk 重新分配全局唯一 chunk_id
    （取现有最大 chunk_id 之后继续编号），重建该 doc 的 postings 并合并。
    posting 格式为 [cid_num, tf]（与 build_chunks_and_postings 一致）。
    """
    chunks_path = os.path.join(STATIC_DIR, "chunks.json")
    postings_path = os.path.join(STATIC_DIR, "inverted-index.json")

    data = {"chunks": []}
    if os.path.exists(chunks_path):
        with open(chunks_path, "r") as f:
            data = json.load(f)
    pidx = {"postings": {}, "num_chunks": 0}
    if os.path.exists(postings_path):
        with open(postings_path, "r") as f:
            pidx = json.load(f)

    chunks: list[dict] = data.get("chunks", [])
    postings: dict = pidx.get("postings", {})

    # 推进 chunk_id 计数器到现有最大值之后（保证增量分配的 id 不冲突）
    max_num = 0
    for c in chunks:
        cid = c.get("chunk_id", "")
        if cid.startswith("c"):
            try:
                max_num = max(max_num, int(cid[1:]))
            except ValueError:
                pass
    # 移除该 doc 的旧 chunk，记录旧 chunk 的数值 id（用于 postings 清理）
    old_nums = set()
    kept = []
    for c in chunks:
        if c.get("doc_id") == slug:
            cid = c.get("chunk_id", "")
            if cid.startswith("c"):
                try:
                    old_nums.add(int(cid[1:]))
                except ValueError:
                    pass
        else:
            kept.append(c)
    chunks = kept
    # 从 postings 中清掉旧 chunk 的 posting（posting = [cid_num, tf]）
    if old_nums:
        empty_tokens = []
        for tok, lst in postings.items():
            postings[tok] = [p for p in lst if p[0] not in old_nums]
            if not postings[tok]:
                empty_tokens.append(tok)
        for t in empty_tokens:
            del postings[t]

    # 为新 chunk 分配 id 并重建 postings
    if doc_tree is not None and chunk_nodes:
        _CHUNK_COUNTER[0] = max_num
        doc_meta = {"doc_id": slug, "title": doc_tree.get("title", slug),
                    "type": doc_tree.get("type", "")}
        new_chunks, new_postings = build_chunks_and_postings(chunk_nodes, doc_meta)
        chunks.extend(new_chunks)
        for tok, lst in new_postings.items():
            postings.setdefault(tok, []).extend(lst)

    # 增量也应用停用词截断（与全量一致）
    n_chunks = len(chunks) or 1
    stopword_cap = int(n_chunks * STOPWORD_DF_RATIO)
    filtered = {tok: lst for tok, lst in postings.items() if len(lst) <= stopword_cap}

    data["chunks"] = chunks
    pidx = {"postings": filtered, "num_chunks": n_chunks}
    with open(chunks_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    with open(postings_path, "w", encoding="utf-8") as f:
        json.dump(pidx, f, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    incremental = "--incremental" in sys.argv
    if incremental:
        existing = load_fingerprints()
        changed = changed_files(existing)
        if not changed:
            print("PageIndex: nothing changed, skipping build.")
            sys.exit(0)
        docs = changed_docs(changed)
        print(f"PageIndex: {len(changed)} files changed → {len(docs)} docs to rebuild")
        os.makedirs(os.path.join(STATIC_DIR, "books"), exist_ok=True)
        os.makedirs(os.path.join(STATIC_DIR, "papers"), exist_ok=True)
        os.makedirs(os.path.join(STATIC_DIR, "notes"), exist_ok=True)
        for doc_type, slug in sorted(docs):
            doc_tree, flat, chunk_nodes = process_one_doc(doc_type, slug)
            if doc_tree is None:
                print(f"  [skip]  {doc_type}/{slug} (no content)")
                patch_indexes(doc_type, slug, None, [], [])
                # Also remove the JSON file
                jpath = os.path.join(STATIC_DIR, f"{doc_type}s", f"{slug}.json")
                if os.path.exists(jpath):
                    os.remove(jpath)
                continue
            out_path = os.path.join(STATIC_DIR, f"{doc_type}s", f"{slug}.json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(doc_tree, f, indent=2, ensure_ascii=False)
            patch_indexes(doc_type, slug, doc_tree, flat, chunk_nodes)
            print(f"  [{doc_type}] {slug}  ({len(flat)} nodes)")
        update_fingerprints()
        print(f"PageIndex: incremental build done.")
    else:
        main()
