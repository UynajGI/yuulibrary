#!/usr/bin/env python3
"""Unified document extraction entry point.

Routes by file extension to the appropriate extractor, producing a unified
output: <out_dir>/merged/book.md + <out_dir>/images/ + <out_dir>/meta.json.

Format support:
  - .pdf  → MinerU VLM (subprocess to mineru-open-api)
  - .docx → MinerU VLM (same path as PDF, MinerU handles natively)
  - .epub → unzip + pandoc (no VLM needed)
  - .fb2  → XML parser (fb2 is structured XML, no VLM needed)
  - .txt  → encoding detection + chapter heuristic splitting

Usage:
    python3 extract.py <input_file> [--out <dir>] [--pages 1-100]
    python3 extract.py book.epub --out pdfs/books/mybook-out/
    python3 extract.py novel.fb2 --out pdfs/books/novel-out/
    python3 extract.py notes.txt --out pdfs/books/notes-out/

Output structure:
    <out_dir>/
    ├── merged/book.md    # unified markdown (all formats converge here)
    ├── images/           # extracted images (WebP conversion deferred to Phase 3)
    └── meta.json         # {title, author, source_format} for front matter
"""
import argparse
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET


# ── Format routing ────────────────────────────────────────────────────────

def extract(input_path: str, out_dir: str, pages: str = None) -> dict:
    """Extract any supported format to <out_dir>/merged/book.md.

    Returns meta dict {title, author, source_format}.
    """
    ext = os.path.splitext(input_path)[1].lower()
    os.makedirs(os.path.join(out_dir, "merged"), exist_ok=True)
    os.makedirs(os.path.join(out_dir, "images"), exist_ok=True)

    if ext == ".pdf":
        return _extract_mineru(input_path, out_dir, pages, source_format="pdf")
    elif ext == ".docx":
        return _extract_mineru(input_path, out_dir, pages, source_format="docx")
    elif ext == ".epub":
        return _extract_epub(input_path, out_dir)
    elif ext == ".fb2":
        return _extract_fb2(input_path, out_dir)
    elif ext == ".txt":
        return _extract_txt(input_path, out_dir)
    else:
        raise ValueError(f"Unsupported format: {ext} (supported: .pdf .docx .epub .fb2 .txt)")


# ── PDF / DOCX via MinerU ─────────────────────────────────────────────────

def _extract_mineru(input_path: str, out_dir: str, pages: str, source_format: str) -> dict:
    """Extract PDF or DOCX via MinerU VLM API.

    MinerU handles both formats natively. For large PDFs (>200 pages), pass
    --pages to batch. Output is merged into book.md.
    """
    out_part = os.path.join(out_dir, "part1")
    os.makedirs(out_part, exist_ok=True)

    cmd = [
        "mineru-open-api", "extract", input_path,
        "-o", out_part,
        "--model", "pipeline",
        "--language", "ch",
        "--timeout", "2400",
    ]
    if pages:
        cmd.extend(["--pages", pages])

    print(f"MinerU 提取 {source_format}: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"MinerU failed: {result.stderr}", file=sys.stderr)
        raise RuntimeError(f"MinerU extraction failed: {result.stderr}")

    # Merge all .md outputs
    md_files = sorted(f for f in os.listdir(out_part) if f.endswith(".md"))
    if not md_files:
        raise RuntimeError(f"No .md output from MinerU in {out_part}")
    merged_path = os.path.join(out_dir, "merged", "book.md")
    with open(merged_path, "w", encoding="utf-8") as out:
        for md in md_files:
            with open(os.path.join(out_part, md), encoding="utf-8") as f:
                out.write(f.read())
                out.write("\n\n")

    # Collect images
    for root, _, files in os.walk(out_part):
        for f in files:
            if f.lower().endswith((".jpg", ".png", ".jpeg", ".webp")):
                shutil.copy2(os.path.join(root, f), os.path.join(out_dir, "images"))

    meta = {"title": os.path.splitext(os.path.basename(input_path))[0],
            "author": "", "source_format": source_format}
    _save_meta(out_dir, meta)
    return meta


# ── EPUB via unzip + pandoc ───────────────────────────────────────────────

def _extract_epub(input_path: str, out_dir: str) -> dict:
    """Extract EPUB via unzip + pandoc. No VLM needed."""
    epub_dir = os.path.join(out_dir, "epub")
    os.makedirs(epub_dir, exist_ok=True)

    # Unzip
    subprocess.run(["unzip", "-o", input_path, "-d", epub_dir], check=True,
                   capture_output=True)

    # Find XHTML content directory (usually OEBPS/ or OPS/)
    xhtml_files = []
    for root, _, files in os.walk(epub_dir):
        for f in files:
            if f.endswith((".xhtml", ".html", ".htm")):
                xhtml_files.append(os.path.join(root, f))
    xhtml_files.sort()

    if not xhtml_files:
        raise RuntimeError(f"No XHTML/HTML found in {input_path}")

    # Convert each to markdown via pandoc
    epub_md_dir = os.path.join(out_dir, "epub-md")
    os.makedirs(epub_md_dir, exist_ok=True)
    for xf in xhtml_files:
        name = os.path.splitext(os.path.basename(xf))[0]
        subprocess.run(
            ["pandoc", "-f", "html", "-t", "markdown", xf,
             "-o", os.path.join(epub_md_dir, f"{name}.md")],
            check=True, capture_output=True
        )

    # Merge by filename order (EPUB spine usually matches filename order)
    merged_path = os.path.join(out_dir, "merged", "book.md")
    md_files = sorted(f for f in os.listdir(epub_md_dir) if f.endswith(".md"))
    with open(merged_path, "w", encoding="utf-8") as out:
        for md in md_files:
            with open(os.path.join(epub_md_dir, md), encoding="utf-8") as f:
                content = f.read()
            # Strip pandoc div markers (::: {#xxx})
            content = re.sub(r"^::: \{#[^}]*\}$", "", content, flags=re.MULTILINE)
            out.write(content)
            out.write("\n\n")

    # Extract images
    for root, _, files in os.walk(epub_dir):
        for f in files:
            if f.lower().endswith((".jpg", ".png", ".jpeg", ".gif", ".svg", ".webp")):
                shutil.copy2(os.path.join(root, f), os.path.join(out_dir, "images"))

    # Try to read title/author from OPF
    meta = {"title": os.path.splitext(os.path.basename(input_path))[0],
            "author": "", "source_format": "epub"}
    _parse_epub_meta(epub_dir, meta)
    _save_meta(out_dir, meta)
    return meta


def _parse_epub_meta(epub_dir: str, meta: dict):
    """Best-effort title/author extraction from OPF file."""
    for root, _, files in os.walk(epub_dir):
        for f in files:
            if f.endswith(".opf"):
                try:
                    tree = ET.parse(os.path.join(root, f))
                    ns = {"dc": "http://purl.org/dc/elements/1.1/"}
                    title = tree.find(".//dc:title", ns)
                    author = tree.find(".//dc:creator", ns)
                    if title is not None and title.text:
                        meta["title"] = title.text.strip()
                    if author is not None and author.text:
                        meta["author"] = author.text.strip()
                    return
                except ET.ParseError:
                    return


# ── FB2 via XML parsing ───────────────────────────────────────────────────

# FB2 namespace
FB2_NS = "http://www.gribuser.ru/xml/fiction/book/2.0"


def _extract_fb2(input_path: str, out_dir: str) -> dict:
    """Extract FB2 (FictionBook 2) via XML parsing.

    FB2 is structured XML — no VLM or pandoc needed. Extracts:
    - <title-info> for title/author
    - <body><section> as chapters (## headings)
    - <binary> embedded images (base64-decoded to images/)
    """
    os.makedirs(os.path.join(out_dir, "merged"), exist_ok=True)
    os.makedirs(os.path.join(out_dir, "images"), exist_ok=True)
    tree = ET.parse(input_path)
    root = tree.getroot()

    # Defoliate namespace for easier querying
    def tag(name):
        return f"{{{FB2_NS}}}{name}"

    # ── Metadata ─────────────────────────────────────────────────────────
    meta = {"title": os.path.splitext(os.path.basename(input_path))[0],
            "author": "", "source_format": "fb2"}
    title_info = root.find(f".//{tag('title-info')}")
    if title_info is not None:
        book_title = title_info.find(tag("book-title"))
        if book_title is not None and book_title.text:
            meta["title"] = book_title.text.strip()
        author_el = title_info.find(tag("author"))
        if author_el is not None:
            parts = []
            for field in ("first-name", "middle-name", "last-name"):
                el = author_el.find(tag(field))
                if el is not None and el.text:
                    parts.append(el.text.strip())
            meta["author"] = " ".join(parts)

    # ── Build image id→extension map (from <binary> content-type) ────────
    img_ext_map = {}
    for binary in root.findall(tag("binary")):
        ctype = binary.get("content-type", "image/jpeg")
        ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif"}
        img_id = binary.get("id", "")
        if img_id:
            img_ext_map[img_id] = ext_map.get(ctype, ".jpg")

    # ── Body sections → chapters ─────────────────────────────────────────
    body = root.find(tag("body"))
    sections = []
    if body is not None:
        # Top-level sections become chapters
        for section in body.findall(tag("section")):
            sections.append(section)

    merged_path = os.path.join(out_dir, "merged", "book.md")
    with open(merged_path, "w", encoding="utf-8") as out:
        if not sections:
            # No section structure — dump entire body text
            out.write(_fb2_element_to_text(body or root, img_ext_map))
        else:
            for i, section in enumerate(sections, 1):
                title_el = section.find(tag("title"))
                if title_el is not None:
                    title_text = _fb2_element_to_text(title_el, img_ext_map).strip()
                    out.write(f"\n\n# {title_text}\n\n")
                else:
                    out.write(f"\n\n# 第{i}节\n\n")
                # Convert section body, skipping the <title> (already written above)
                out.write(_fb2_section_body_to_text(section, img_ext_map))
                out.write("\n")

    # ── Binary images (base64-encoded in FB2) ───────────────────────────
    for binary in root.findall(tag("binary")):
        ctype = binary.get("content-type", "image/jpeg")
        ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif"}
        img_ext = ext_map.get(ctype, ".jpg")
        img_id = binary.get("id", f"image_{id(binary)}")
        if binary.text:
            img_data = base64.b64decode(binary.text.strip())
            img_path = os.path.join(out_dir, "images", f"{img_id}{img_ext}")
            with open(img_path, "wb") as f:
                f.write(img_data)

    _save_meta(out_dir, meta)
    return meta


def _fb2_section_body_to_text(section_el, img_ext_map: dict = None) -> str:
    """Convert an FB2 <section> body to text, skipping the <title> sub-element
    (the title is already written separately by the caller as a # heading).
    """
    img_ext_map = img_ext_map or {}
    parts = []
    for child in section_el:
        ctag = child.tag.split("}")[-1]
        if ctag == "title":
            continue  # skip — title already emitted by caller
        text = _fb2_element_to_text(child, img_ext_map)
        # <p> elements need paragraph spacing when at section top level
        if ctag == "p":
            text = text.strip() + "\n\n"
        parts.append(text)
    return "".join(parts)


def _fb2_element_to_text(el, img_ext_map: dict = None) -> str:
    """Recursively convert an FB2 element to markdown text.

    Handles <p> (paragraphs), <empty-line/> (blank lines), <emphasis> (italics),
    <strong> (bold), <title> (heading), <image> (image ref), <a> (links).

    ElementTree stores text after a child element in child.tail (not in the
    parent's .text), so we must append .tail after each child's converted text.
    """
    img_ext_map = img_ext_map or {}
    if el is None:
        return ""
    parts = []
    # Leading text before any child
    if el.text:
        parts.append(el.text)
    for child in el:
        ctag = child.tag.split("}")[-1]  # strip namespace
        if ctag == "p":
            parts.append(_fb2_element_to_text(child, img_ext_map).strip() + "\n\n")
        elif ctag == "empty-line":
            parts.append("\n")
        elif ctag == "emphasis":
            parts.append(f"*{_fb2_element_to_text(child, img_ext_map).strip()}*")
        elif ctag == "strong":
            parts.append(f"**{_fb2_element_to_text(child, img_ext_map).strip()}**")
        elif ctag == "title":
            parts.append(f"## {_fb2_element_to_text(child, img_ext_map).strip()}\n\n")
        elif ctag == "image":
            href = child.get(f"{{{FB2_NS}}}href", child.get("href", ""))
            if href.startswith("#"):
                href = href[1:]
            # Use real extension from binary content-type, fall back to .jpg
            ext = img_ext_map.get(href, ".jpg")
            parts.append(f"\n![{href}](images/{href}{ext})\n\n")
        elif ctag == "a":
            href = child.get(f"{{{FB2_NS}}}href", child.get("href", ""))
            text = _fb2_element_to_text(child, img_ext_map).strip()
            if href:
                parts.append(f"[{text}]({href})")
            else:
                parts.append(text)
        elif child.text:
            parts.append(child.text)
        # Text after this child element (before the next sibling) lives in .tail
        if child.tail:
            parts.append(child.tail)
    return "".join(parts)


# ── TXT via encoding detection + chapter splitting ────────────────────────

def _detect_encoding(path: str) -> str:
    """Detect file encoding using chardet (falls back to utf-8)."""
    try:
        import chardet
        with open(path, "rb") as f:
            raw = f.read()
        result = chardet.detect(raw)
        return result.get("encoding") or "utf-8"
    except ImportError:
        # No chardet — try common encodings
        for enc in ("utf-8", "gbk", "big5", "shift-jis", "utf-16"):
            try:
                with open(path, encoding=enc) as f:
                    f.read(1024)
                return enc
            except (UnicodeDecodeError, LookupError):
                continue
        return "utf-8"


# Chapter heading patterns (Chinese + English + numeric).
# Constraints to avoid matching body text:
#   - Title line must be short (<20 chars after the marker)
#   - Must NOT end with sentence punctuation
#   - Must NOT contain common body particles (的/是/和/在/了/着/过/与/或/及)
#     — these almost never appear in a chapter title
_CHAPTER_BODY_PARTICLES = "的是和在了着过与或及"
_CHAPTER_PATTERNS = [
    re.compile(
        r"^第[一二三四五六七八九十百千零\d]+[章节回卷][^\n。！？]{0,20}$",
        re.MULTILINE
    ),
    re.compile(r"^Chapter\s+\d+[^\n.]{0,30}$", re.MULTILINE | re.IGNORECASE),
    re.compile(r"^[一二三四五六七八九十]+、[^\n。！？]{1,20}$", re.MULTILINE),
]


def _is_likely_chapter_title(line: str) -> bool:
    """Filter out body lines that match chapter patterns but aren't titles.

    A real chapter title is short and doesn't contain body particles.
    """
    stripped = line.strip()
    # Reject if contains common body particles (e.g. "第二章的内容")
    if any(ch in stripped for ch in _CHAPTER_BODY_PARTICLES):
        return False
    return True


def _extract_txt(input_path: str, out_dir: str) -> dict:
    """Extract TXT via encoding detection + heuristic chapter splitting.

    No VLM or pandoc needed. Detects encoding (UTF-8/GBK/Big5/Shift-JIS),
    splits into chapters by heading patterns, or treats entire file as one
    chapter if no headings found.
    """
    os.makedirs(os.path.join(out_dir, "merged"), exist_ok=True)
    os.makedirs(os.path.join(out_dir, "images"), exist_ok=True)
    encoding = _detect_encoding(input_path)
    print(f"检测编码: {encoding}")
    with open(input_path, encoding=encoding, errors="replace") as f:
        content = f.read()

    # Normalize line endings
    content = content.replace("\r\n", "\n").replace("\r", "\n")

    # Try to find chapter boundaries
    chapter_marks = []
    for pattern in _CHAPTER_PATTERNS:
        marks = [(m.start(), m.group().strip()) for m in pattern.finditer(content)
                 if _is_likely_chapter_title(m.group())]
        if len(marks) >= 2:  # need at least 2 to be meaningful
            chapter_marks = marks
            break

    merged_path = os.path.join(out_dir, "merged", "book.md")
    with open(merged_path, "w", encoding="utf-8") as out:
        if not chapter_marks:
            # No chapter structure — single chapter
            out.write("# 正文\n\n")
            out.write(content.strip())
            out.write("\n")
        else:
            # Split by chapter marks. Body starts AFTER the title line.
            for i, (start, title) in enumerate(chapter_marks):
                end = chapter_marks[i + 1][0] if i + 1 < len(chapter_marks) else len(content)
                # Skip the title line itself — find end of first line
                title_end = content.find("\n", start)
                if title_end == -1 or title_end > end:
                    title_end = start + len(title)
                chapter_text = content[title_end:end].strip()
                out.write(f"\n\n# {title}\n\n")
                out.write(chapter_text)
                out.write("\n")
            # Content before first chapter mark (preface/intro)
            if chapter_marks[0][0] > 0:
                preface = content[:chapter_marks[0][0]].strip()
                if preface:
                    # Rewrite to put preface first
                    with open(merged_path, "r", encoding="utf-8") as f:
                        body = f.read()
                    with open(merged_path, "w", encoding="utf-8") as f:
                        f.write("# 前言\n\n" + preface + "\n\n" + body)

    meta = {"title": os.path.splitext(os.path.basename(input_path))[0],
            "author": "", "source_format": "txt"}
    _save_meta(out_dir, meta)
    return meta


# ── Helpers ───────────────────────────────────────────────────────────────

def _save_meta(out_dir: str, meta: dict):
    """Write meta.json to <out_dir>/meta.json."""
    meta_path = os.path.join(out_dir, "meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


# ── CLI ───────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Extract documents to unified markdown.")
    ap.add_argument("input", help="input file (.pdf .docx .epub .fb2 .txt)")
    ap.add_argument("--out", required=True, help="output directory")
    ap.add_argument("--pages", help="page range for PDF (e.g. 1-100)", default=None)
    args = ap.parse_args()

    if not os.path.exists(args.input):
        print(f"Error: {args.input} not found", file=sys.stderr)
        return 1

    try:
        meta = extract(args.input, args.out, pages=args.pages)
        print(f"\n✓ 提取完成 → {args.out}/merged/book.md")
        print(f"  标题: {meta['title']}")
        print(f"  作者: {meta['author'] or '(未知)'}")
        print(f"  格式: {meta['source_format']}")
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
