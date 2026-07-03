#!/usr/bin/env python3
"""Build PageIndex JSON trees from Hugo content for static-site chat agent.

Zero LLM calls — pure heading-based tree construction.
Output: static/pageindex/{global-index,node-index,books/*,papers/*,notes/*}.json
"""

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


# ── fingerprint incremental update ──────────────────────────────────────────

def file_fingerprint(path: str) -> str:
    """MD5 hash of file contents."""
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def collect_content_files() -> list[str]:
    """Return all .md files under content/ that should be indexed."""
    files = []
    for root, _, fnames in os.walk(CONTENT_DIR):
        for fn in fnames:
            if fn.endswith(".md"):
                files.append(os.path.join(root, fn))
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
    """Attach full text (heading line → next heading) to each node in-place."""
    for i, node in enumerate(nodes):
        start = node["line_num"]
        end = nodes[i + 1]["line_num"] if i + 1 < len(nodes) else total_lines
        node["text"] = "\n".join(body_lines[start:end]).strip()


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
    """Remove empty nodes list and keep only needed fields."""
    result = []
    for node in tree:
        cleaned = {
            "title": node["title"],
            "node_id": node["node_id"],
            "text": node["text"],
        }
        if node.get("nodes"):
            cleaned["nodes"] = clean_tree(node["nodes"])
        result.append(cleaned)
    return result


# ── node-index.json flattening ──────────────────────────────────────────────

def flatten_tree(tree: list[dict], doc_id: str, breadcrumb: list[str],
                 doc_url_prefix: str) -> list[dict]:
    """Flatten tree into list of {doc_id, node_id, title, breadcrumb, url, excerpt}."""
    result = []
    for node in tree:
        crumb = breadcrumb + [node["title"]]
        text = node.get("text", "")
        excerpt = text[:200].replace("\n", " ").strip()
        # generate searchable terms from title
        terms = extract_terms(node["title"])
        result.append({
            "doc_id": doc_id,
            "node_id": node["node_id"],
            "title": node["title"],
            "breadcrumb": crumb,
            "url": f"{doc_url_prefix}#pi-node-{node['node_id']}",
            "terms": terms,
            "excerpt": excerpt,
        })
        if node.get("nodes"):
            result.extend(flatten_tree(node["nodes"], doc_id, crumb, doc_url_prefix))
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

        # Wrap chapter in a chapter-level node
        ch_node = {
            "title": ch_title,
            "node_id": "",
            "text": headings[0].get("text", "") if headings else "",
            "nodes": ch_tree,
        }
        book_root["nodes"].append(ch_node)

    # Assign IDs
    counter = [0]
    for ch_node in book_root["nodes"]:
        counter[0] += 1
        ch_node["node_id"] = str(counter[0]).zfill(4)
        assign_node_ids(ch_node.get("nodes", []), counter)

    # Flatten for node-index
    book_url_prefix = f"/books/{slug}/"
    # The URL for chapter content needs the chapter filename
    # Build a mapping: for nodes under a chapter, use chXX.html#pi-node-NNNN
    flat_nodes = []
    chapter_files = [c[4] for c in chapters]  # fnames in order
    ch_idx = 0
    for ch_node in book_root["nodes"]:
        ch_fname = os.path.splitext(chapter_files[ch_idx])[0] + ".html"
        ch_url = f"{book_url_prefix}{ch_fname}"
        # Add chapter node itself
        flat_nodes.append({
            "doc_id": slug,
            "node_id": ch_node["node_id"],
            "title": ch_node["title"],
            "breadcrumb": [book_title, ch_node["title"]],
            "url": f"{ch_url}#pi-node-{ch_node['node_id']}",
            "terms": extract_terms(ch_node["title"]),
            "excerpt": ch_node.get("text", "")[:200].replace("\n", " ").strip(),
        })
        # Flatten children
        child_flat = flatten_tree(ch_node.get("nodes", []), slug,
                                  [book_title, ch_node["title"]], ch_url)
        flat_nodes.extend(child_flat)
        ch_idx += 1

    # Clean tree
    book_root["node_id"] = "0000"
    for ch_node in book_root["nodes"]:
        clean_tree(ch_node.get("nodes", []))

    doc_tree = {
        "doc_name": slug,
        "type": "book",
        "title": book_title,
        "author": meta.get("author", ""),
        "description": meta.get("description", ""),
        "tags": meta.get("tags", []),
        "structure": book_root["nodes"],
    }
    return doc_tree, flat_nodes


def process_paper(slug: str, paper_dir: str) -> tuple[dict | None, list[dict]]:
    """Build PageIndex tree for a paper from its _index.md."""
    index_path = os.path.join(paper_dir, "_index.md")
    if not os.path.exists(index_path):
        return None, []

    with open(index_path, "r") as f:
        content = f.read()
    meta, body, body_offset = parse_front_matter(content)
    doc_title = meta.get("title", slug)
    body_lines = body.split("\n")
    headings = extract_headings(body, 0)
    if not headings:
        return None, []

    attach_text(headings, body_lines, len(body_lines))
    tree = build_tree(headings)
    assign_node_ids(tree)

    doc_url = f"/papers/{slug}/index.html"
    flat = flatten_tree(tree, slug, [doc_title], doc_url)

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
    return doc_tree, flat


def process_note(slug: str, note_path: str) -> tuple[dict | None, list[dict]]:
    """Build PageIndex tree for a standalone note .md file."""
    with open(note_path, "r") as f:
        content = f.read()
    meta, body, body_offset = parse_front_matter(content)
    doc_title = meta.get("title", slug)
    body_lines = body.split("\n")
    headings = extract_headings(body, 0)
    if not headings:
        return None, []

    attach_text(headings, body_lines, len(body_lines))
    tree = build_tree(headings)
    assign_node_ids(tree)

    doc_url = f"/notes/{slug}.html"
    flat = flatten_tree(tree, slug, [doc_title], doc_url)

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
    return doc_tree, flat


# ── main ────────────────────────────────────────────────────────────────────

def main():
    os.makedirs(os.path.join(STATIC_DIR, "books"), exist_ok=True)
    os.makedirs(os.path.join(STATIC_DIR, "papers"), exist_ok=True)
    os.makedirs(os.path.join(STATIC_DIR, "notes"), exist_ok=True)

    global_docs: list[dict] = []
    all_nodes: list[dict] = []

    # ── books ──
    books_dir = os.path.join(CONTENT_DIR, "books")
    if os.path.isdir(books_dir):
        for slug in sorted(os.listdir(books_dir)):
            book_dir = os.path.join(books_dir, slug)
            if not os.path.isdir(book_dir) or slug.startswith("_"):
                continue
            doc_tree, flat = process_book(slug, book_dir)
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

    # ── papers ──
    papers_dir = os.path.join(CONTENT_DIR, "papers")
    if os.path.isdir(papers_dir):
        for slug in sorted(os.listdir(papers_dir)):
            paper_dir = os.path.join(papers_dir, slug)
            if not os.path.isdir(paper_dir) or slug.startswith("_"):
                continue
            doc_tree, flat = process_paper(slug, paper_dir)
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

    # ── notes ──
    notes_dir = os.path.join(CONTENT_DIR, "notes")
    if os.path.isdir(notes_dir):
        for fname in sorted(os.listdir(notes_dir)):
            if not fname.endswith(".md") or fname == "_index.md":
                continue
            slug = os.path.splitext(fname)[0]
            note_path = os.path.join(notes_dir, fname)
            doc_tree, flat = process_note(slug, note_path)
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

    # ── size summary ──
    total_kb = 0
    for root, _, files in os.walk(STATIC_DIR):
        for fname in files:
            total_kb += os.path.getsize(os.path.join(root, fname))
    print(f"  total size:   {total_kb / 1024:.1f} KB")


if __name__ == "__main__":
    incremental = "--incremental" in sys.argv
    if incremental:
        existing = load_fingerprints()
        changed = changed_files(existing)
        if not changed:
            print("PageIndex: nothing changed, skipping build.")
            sys.exit(0)
        print(f"PageIndex: {len(changed)} files changed, rebuilding...")
    main()
    if incremental:
        update_fingerprints()
        print("PageIndex: fingerprints updated.")
