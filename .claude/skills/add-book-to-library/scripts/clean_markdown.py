#!/usr/bin/env python3
"""Clean MinerU/pandoc-extracted markdown — unified for book + paper.

Pipeline (all rules auto-run, no flags needed):
  1. Noise removal: publisher metadata, flat TOC, footnotes, email, citations,
     page headers (book), ■ bullets (book)
  2. LaTeX repair (scoped to $...$ and $$...$$): digit spacing, command spacing,
     brace letter spacing, subscript spacing
  3. Heading hierarchy: ## N.M → ###, ## N.M.K → ####
  4. Figure caption pairing: Figure N: / 图N： → {{< caption >}}
  5. Blank line collapse + trailing whitespace

Book and paper noise patterns are mutually exclusive (books have no publisher
metadata, papers have no page headers) — all rules run safely on either type.

Usage:
    python3 clean_markdown.py <file.md>          # in-place
    python3 clean_markdown.py <file.md> --dry-run
"""
import argparse
import os
import re
import sys


# ── Book-specific page headers ───────────────────────────────────────────
PAGE_HEADERS = {
    "Brain Teasers", "Probability Theory", "Calculus and Linear Algebra",
    "Stochastic Process and Stochastic Calculus", "Algorithms and Numerical Methods",
    "Finance", "Contents",
    "微积分与线性代数", "概率论", "脑筋急转弯", "随机过程与随机微积分",
    "算法与数值方法", "金融",
}


# ── TOC entry detection ──────────────────────────────────────────────────
def is_toc_entry(line):
    """Check if a line is a flat TOC entry like '1 引言 2' or 'A 附录 15'."""
    s = line.strip()
    if not s or not re.search(r"\s\d+\s*$", s):
        return False
    return bool(re.match(r"^(\d+[\.\d]*\s+\S|[A-Z]\s+\S|参考文献\s|References\s|Bibliography\s)", s))


# ── Stage 1: Noise removal ───────────────────────────────────────────────
def remove_noise(lines):
    """Remove publisher metadata, TOC, footnotes, citations, page headers."""
    stats = {}
    result = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # --- Paper: publisher metadata ---

        # License block: cc Copyright / cc 版权 / © ...  (skip until blank)
        if re.match(r"^(cc\s+(版权|Copyright|©)|©\s)", stripped, re.IGNORECASE):
            stats["license"] = stats.get("license", 0) + 1
            while i < len(lines) and lines[i].strip():
                i += 1
            continue

        # Journal metadata: Received/Accepted/Published/Updated/收到/接受...
        if re.match(r"^(Received|Accepted|Published|Updated|收到|接受|发布|检查.*更新)", stripped):
            stats["metadata"] = stats.get("metadata", 0) + 1
            while i < len(lines) and lines[i].strip() and not lines[i].startswith("#"):
                i += 1
            continue

        # Standalone DOI line
        if re.match(r"^(doi:|DOI:|https?://doi\.org/)", stripped, re.IGNORECASE):
            stats["doi"] = stats.get("doi", 0) + 1
            i += 1
            continue

        # --- Paper: MinerU <details> data tables (not real figures) ---
        if re.match(r"^</?details>?$", stripped):
            stats["details"] = stats.get("details", 0) + 1
            i += 1
            while i < len(lines) and not re.match(r"^</details>$", lines[i].strip()):
                i += 1
            if i < len(lines):
                i += 1  # skip </details>
            continue

        # Flat TOC heading: ## 目录 / ## Contents / ## Table of Contents
        if re.match(r"^##\s+(目录|Contents|Table of Contents)", stripped, re.IGNORECASE):
            stats["toc"] = stats.get("toc", 0) + 1
            i += 1
            while i < len(lines):
                tl = lines[i].strip()
                if not tl:
                    i += 1
                    continue
                if is_toc_entry(tl) or re.match(r"^(参考文献|References)\s+\d+", tl, re.IGNORECASE):
                    i += 1
                    continue
                break
            continue

        # Orphaned TOC entries (heading already removed)
        if is_toc_entry(stripped):
            stats["toc"] = stats.get("toc", 0) + 1
            i += 1
            continue

        # --- Paper: citation fragments: <sub>[</sub>N<sub>]</sub> → [N] ---
        new_line = re.sub(r"<sub>\[</sub>([\d,\s–-]+)<sub>\]</sub>", r"[\1]", line)
        if new_line != line:
            stats["citation"] = stats.get("citation", 0) + 1
            line = new_line

        # --- Paper: <sup>?</sup> footnote markers ---
        new_line = re.sub(r"<sup>[?*]</sup>", "", line)
        if new_line != line:
            stats["footnote"] = stats.get("footnote", 0) + 1
            line = new_line

        # --- Paper: <sup>L</sup> → $\mathbb{L}$ (MinerU math symbol as superscript) ---
        new_line = re.sub(r"<sup>([A-Z])</sup>", lambda m: f"$\\mathbb{{{m.group(1)}}}$", line)
        if new_line != line:
            stats["sup_symbol"] = stats.get("sup_symbol", 0) + 1
            line = new_line

        # --- Paper: email markers ---
        new_line = re.sub(r"^\?\s*[\w.+-]+@[\w.-]+\s*$", "", line)
        if new_line != line:
            stats["email"] = stats.get("email", 0) + 1
            line = new_line

        # --- Book: page headers (standalone chapter names as body text) ---
        s = line.strip()
        if s in PAGE_HEADERS:
            prev = lines[i - 1].strip() if i > 0 else ""
            nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
            if prev == "" and (nxt == "" or nxt.startswith("#") or nxt.startswith("![")):
                stats["page_header"] = stats.get("page_header", 0) + 1
                i += 1
                continue

        result.append(line)
        i += 1

    return result, stats


# ── Stage 2: LaTeX repair (scoped to math regions) ──────────────────────
def fix_math_simple(m, delim):
    """Fix fragmented LaTeX inside a single math region."""
    body = m.group(1)

    # 1. Digit-digit spacing: "1 0" → "10"
    body = re.sub(r"(?<=\d)\s+(?=\d)", "", body)

    # 2. Digit-dot-digit
    body = re.sub(r"(?<=\d)\s*\.\s*(?=\d)", ".", body)

    # 3. LaTeX command + brace: "\mathrm { " → "\mathrm{"
    body = re.sub(r"(\\[a-zA-Z]+)\s+\{", r"\1{", body)

    # 4. Collapse single-letter sequences inside \mathrm{text} etc.
    def collapse_brace(bm):
        inner = bm.group(2).strip()  # strip leading/trailing spaces
        if re.match(r"^([a-zA-Z]\s)+[a-zA-Z]$", inner):
            return bm.group(1) + "{" + inner.replace(" ", "") + "}"
        return bm.group(0)

    body = re.sub(r"(\\(?:mathrm|mathbf|mathsf|mathit|mathcal|mathbb|text|operatorname)\*?)\s*\{([^}]*)\}", collapse_brace, body)

    # 4b. Collapse single-letter sequences in ANY brace: {m a x} {i j} {k a}
    def collapse_any_brace(bm):
        inner = bm.group(1)
        if not re.match(r"^([a-zA-Z]\s)+[a-zA-Z]$", inner):
            return bm.group(0)
        collapsed = inner.replace(" ", "")
        if set(collapsed) <= set("lcr"):
            return bm.group(0)
        return "{" + collapsed + "}"

    body = re.sub(r"\{([a-zA-Z](?:\s+[a-zA-Z])+)\}", collapse_any_brace, body)

    # 5. Subscript/superscript spacing
    body = re.sub(r"([a-zA-Z0-9\\})\]])\s+([_^])", r"\1\2", body)
    body = re.sub(r"([_^])\s+\{", r"\1{", body)

    # 6. Brace spaces
    body = re.sub(r"\{\s+", "{", body)
    body = re.sub(r"\s+\}", "}", body)

    # 7. Operator spacing: \ = \ → =
    body = re.sub(r"\\\s+=\s*\\?", "=", body)
    body = re.sub(r"\\\s+-\s*\\?", "-", body)

    # 8. Collapse multiple spaces
    body = re.sub(r"  +", " ", body)

    return delim + body + delim


# ── Stage 3: Heading hierarchy ───────────────────────────────────────────
# Patterns for paper-style heading prefixes (MinerU puts all at same level)
_RE_ROMAN = re.compile(r"^#+\s+(?:第)?(I{1,3}|IV|VI{0,3}|IX|XI{0,3})[\.\s章]")
_RE_LETTER = re.compile(r"^#+\s+([A-HJ-NP-Z])\.\s")   # single letter . (skip I/V/X)
_RE_NUMBER = re.compile(r"^#+\s+(\d+)\.\s")


def _heading_prefix_type(line: str) -> tuple[str, int]:
    """Return (type, current_level) for a heading line.

    type: 'roman' | 'letter' | 'number' | 'numbered_sub' | None
    """
    m = re.match(r"^(#+)\s", line)
    if not m:
        return ("none", 0)
    level = len(m.group(1))
    stripped = line[level:].strip()

    # Roman numerals: I., II., ... or 第I章
    if re.match(r"^(?:第)?(I{1,3}|IV|VI{0,3}|IX|XI{0,3})[\.\s章]", stripped):
        return ("roman", level)
    # Letter: A., B., ... (but not I, V, X which are Roman numerals)
    if re.match(r"^([A-HJ-NP-Z])\.\s", stripped):
        return ("letter", level)
    # Numbered: 1., 2., ...
    if re.match(r"^(\d+)\.\s", stripped):
        return ("number", level)
    # Numbered subsection: N.M or N.M.K
    if re.match(r"^\d+\.\d+", stripped):
        return ("numbered_sub", level)

    return ("none", level)


def fix_heading_hierarchy(text):
    """Fix heading levels for book chapters AND paper sections.

    Book: ## N.M → ###, ## N.M.K → #### (numbered subsections under chapter)

    Paper: MinerU puts all sections at ## regardless of actual hierarchy.
    Detect I./II./A./B./1./2. prefixes and build proper levels:
      Roman numeral (I., II.) → top-level (keep)
      Letter (A., B.)         → sub-section (demote 1)
      Number (1., 2.)         → sub-sub-section (demote 2)
    """
    lines = text.split("\n")
    stats = {"headings_demoted": 0}

    # ── Pass 1: detect paper-style hierarchy ─────────────────────────
    heading_indices = []
    for i, line in enumerate(lines):
        typ, level = _heading_prefix_type(line)
        if typ != "none":
            heading_indices.append((i, typ, level))

    # Build level map: for each heading, determine target level
    # Roman numerals at current base → keep; letters → +1; numbers → +2
    target_levels = {}
    if heading_indices:
        # Find the "base" level (most common heading level among roman numerals)
        roman_levels = [lv for _, typ, lv in heading_indices if typ == "roman"]
        base_level = max(set(roman_levels), key=roman_levels.count) if roman_levels else 2
        # If there are no roman numerals, use the most common heading level
        if not roman_levels:
            all_levels = [lv for _, _, lv in heading_indices]
            base_level = max(set(all_levels), key=all_levels.count) if all_levels else 2

        for idx, typ, lv in heading_indices:
            if typ == "roman":
                target_levels[idx] = base_level
            elif typ == "letter":
                target_levels[idx] = base_level + 1
            elif typ == "number":
                target_levels[idx] = base_level + 2

    # ── Pass 2: apply level changes ──────────────────────────────────
    result = []
    for i, line in enumerate(lines):
        if i in target_levels:
            current = len(re.match(r"^#+", line).group(0))
            target = target_levels[i]
            if target > current:
                line = "#" * target + line[current:]
                stats["headings_demoted"] += 1
            elif target < current:
                line = "#" * target + line[current:]
            result.append(line)
            continue

        # Existing numbered-subsection rules (## N.M → ###, ## N.M.K → ####)
        m = re.match(r"^(##)\s+(\d+\.\d+\.\d+)\s", line)
        if m:
            line = "####" + line[2:]
            stats["headings_demoted"] += 1
            result.append(line)
            continue
        m = re.match(r"^(##)\s+(\d+\.\d+)\s", line)
        if m:
            line = "###" + line[2:]
            stats["headings_demoted"] += 1
            result.append(line)
            continue
        result.append(line)

    return "\n".join(result), stats


# ── Stage 4: Figure caption pairing ──────────────────────────────────────
def pair_figures(text):
    """Match figure captions with nearby images, wrap in {{< caption >}}."""
    stats = {"fig_paired": 0, "fig_orphan_caption": 0, "fig_orphan_image": 0}
    lines = text.split("\n")
    result_lines = list(lines)

    captions = {}
    image_lines = []
    for i, line in enumerate(lines):
        m = re.match(r"^(图\s*(\d+)\s*[：:.]|Figure\s+(\d+)\s*[：:]|Fig\.?\s+(\d+)\s*[：:.])\s*(.*)", line.strip(), re.IGNORECASE)
        if m:
            fig_num = int(m.group(2) or m.group(3) or m.group(4))
            captions[fig_num] = (i, line.strip())
        if re.search(r"!\[.*?\]\(images/", line):
            image_lines.append(i)

    used_images = set()
    for fig_num, (cap_idx, cap_text) in sorted(captions.items()):
        best_img = None
        best_dist = 999
        for img_idx in image_lines:
            if img_idx in used_images:
                continue
            dist = abs(img_idx - cap_idx)
            if dist <= 8 and dist < best_dist:
                best_img = img_idx
                best_dist = dist

        cap_content = re.sub(
            r"^(图\s*\d+\s*[：:.]|Figure\s+\d+\s*[：:]|Fig\.?\s+\d+\s*[：:.])\s*",
            "", cap_text, flags=re.IGNORECASE,
        )
        new_caption = f"{{{{< caption >}}}}图{fig_num}：{cap_content}{{{{< /caption >}}}}"

        if best_img is not None:
            used_images.add(best_img)
            stats["fig_paired"] += 1
        else:
            stats["fig_orphan_caption"] += 1
        result_lines[cap_idx] = new_caption

    for img_idx in image_lines:
        if img_idx not in used_images:
            near_cap = any(abs(img_idx - c) <= 8 for _, (c, _) in captions.items())
            if not near_cap:
                stats["fig_orphan_image"] += 1

    return "\n".join(result_lines), stats


# ── Stage 5: Book-specific misc ──────────────────────────────────────────
def fix_book_misc(text):
    """■ → -, book footnote superscripts ($^{N}$)."""
    stats = {}
    # ■ bullets
    if "■" in text:
        count = text.count("■")
        text = text.replace("■", "-")
        stats["bullets"] = count
    # Book footnote superscripts: $\$^{N}\$` style
    text, n = re.subn(r"\s*\\?\$\^\{(\d+)\}\\?\$", "", text)
    if n:
        stats["book_footnotes"] = n
    return text, stats


def fix_mineru_divs(text):
    """Convert MinerU <div class="mineru-algorithm">...</div> to fenced code blocks.

    MinerU wraps terminal output / pseudocode in these divs with inline styles.
    The content is typically Matlab/session output → convert to ```matlab block.
    Also unescapes HTML entities (&gt; → >, &lt; → <, &amp; → &).
    """
    stats = {}
    pattern = re.compile(
        r'<div class="mineru-algorithm"[^>]*>(.*?)</div>', re.DOTALL
    )

    def replace_div(m):
        content = m.group(1)
        content = (
            content.replace("&gt;", ">")
            .replace("&lt;", "<")
            .replace("&quot;", '"')
            .replace("&amp;", "&")
        )
        # drop blank lines inside
        content = "\n".join(l for l in content.split("\n") if l.strip())
        return "```matlab\n" + content + "\n```"

    new_text, n = pattern.subn(replace_div, text)
    if n:
        stats["mineru_div"] = n
        text = new_text
    return text, stats


# ── Main clean function ──────────────────────────────────────────────────
def clean(content):
    """Full cleaning pipeline. Returns (cleaned_content, stats_dict)."""
    lines = content.split("\n")

    # Stage 1: noise removal
    lines, noise_stats = remove_noise(lines)

    # Stage 1c: separate consecutive reference entries with blank lines
    # MinerU often produces consecutive [N] lines without blank line separation,
    # causing Markdown to render them as a single paragraph.
    ref_line_count = 0
    ref_sep_lines = []
    for line in lines:
        is_ref = bool(re.match(r"^\[\d+\]", line.strip()))
        if is_ref and ref_sep_lines and re.match(r"^\[\d+\]", ref_sep_lines[-1].strip()):
            ref_sep_lines.append("")
            ref_line_count += 1
        ref_sep_lines.append(line)
    if ref_line_count:
        lines = ref_sep_lines
        noise_stats["ref_sep"] = ref_line_count

    text = "\n".join(lines)

    # Stage 1b: book misc (bullets, book footnotes)
    text, book_stats = fix_book_misc(text)

    # Stage 1c: MinerU <div class="mineru-algorithm"> → ```matlab code blocks
    text, div_stats = fix_mineru_divs(text)

    # Stage 2: LaTeX repair (scoped to math regions)
    inline_before = len(re.findall(r"\$[^$\n]+?\$", text))
    display_before = len(re.findall(r"\$\$", text)) // 2
    text = re.sub(r"\$\$([\s\S]*?)\$\$", lambda m: fix_math_simple(m, "$$"), text)
    text = re.sub(r"\$([^$\n]+?)\$", lambda m: fix_math_simple(m, "$"), text)

    # Stage 3: heading hierarchy
    text, heading_stats = fix_heading_hierarchy(text)

    # Stage 4: figure caption pairing
    text, fig_stats = pair_figures(text)

    # Stage 5: collapse 3+ blank lines
    before_blanks = len(re.findall(r"\n{4,}", text))
    text = re.sub(r"\n{4,}", "\n\n\n", text)

    # Stage 6: trailing whitespace
    text = "\n".join(l.rstrip() for l in text.split("\n"))

    stats = {**noise_stats, **book_stats, **div_stats, **heading_stats, **fig_stats}
    stats["math_regions"] = inline_before + display_before
    if before_blanks:
        stats["blank_collapse"] = before_blanks

    return text, stats


def main():
    ap = argparse.ArgumentParser(description="Clean MinerU/pandoc markdown (book + paper).")
    ap.add_argument("md_path", help="path to markdown file")
    ap.add_argument("--dry-run", action="store_true", help="preview without writing")
    args = ap.parse_args()

    if not os.path.isfile(args.md_path):
        print(f"Error: {args.md_path} not found", file=sys.stderr)
        return 1

    with open(args.md_path, encoding="utf-8") as f:
        content = f.read()

    cleaned, stats = clean(content)
    total = sum(v for v in stats.values() if isinstance(v, int))
    detail = ", ".join(f"{k}:{v}" for k, v in sorted(stats.items()))

    if not args.dry_run:
        with open(args.md_path, "w", encoding="utf-8") as f:
            f.write(cleaned)
        print(f"✓ {os.path.basename(args.md_path)}: {detail}")
    else:
        print(f"[dry-run] {os.path.basename(args.md_path)}: {detail}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
