#!/usr/bin/env python3
"""Clean MinerU-extracted paper markdown before translation.

Two-stage cleaning:
  1. Noise removal: publisher metadata, flat TOC, footnote markers, email
  2. LaTeX repair: fix fragmented formulas inside $...$ and $$...$$
     (digit spacing, command spacing, subscript/superscript spacing)

The LaTeX repair is scoped to math regions only — global replacement would
corrupt normal text (e.g. "1 2 3" in prose should stay spaced).

Usage:
    python3 clean_paper_md.py <paper.md>          # in-place
    python3 clean_paper_md.py <paper.md> --dry-run
"""
import argparse
import os
import re
import sys


# ── TOC detection ────────────────────────────────────────────────────────
def is_toc_entry(line):
    """Check if a line is a flat TOC entry like '1 引言 2' or 'A 附录 15'."""
    s = line.strip()
    if not s:
        return False
    if not re.search(r"\s\d+\s*$", s):
        return False
    if re.match(r"^(\d+[\.\d]*\s+\S|[A-Z]\s+\S|参考文献\s|References\s|Bibliography\s)", s):
        return True
    return False


# ── Noise removal ────────────────────────────────────────────────────────
def remove_noise(lines):
    """Remove publisher metadata, TOC, footnote markers. Returns (lines, stats)."""
    stats = {}
    result = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

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

        # Flat TOC heading: ## 目录 / ## Contents
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

        # Footnote markers: <sup>?</sup> <sup>*</sup>
        new_line = re.sub(r"<sup>[?*]</sup>", "", line)
        if new_line != line:
            stats["footnote"] = stats.get("footnote", 0) + 1
            line = new_line

        # Email markers: "? address@..." (通讯作者)
        new_line = re.sub(r"^\?\s*[\w.+-]+@[\w.-]+\s*$", "", line)
        if new_line != line:
            stats["email"] = stats.get("email", 0) + 1
            line = new_line

        # Reference citation fragments: <sub>[</sub>N<sub>]</sub> → [N]
        new_line = re.sub(r"<sub>\[</sub>([\d,\s–-]+)<sub>\]</sub>", r"[\1]", line)
        if new_line != line:
            stats["citation"] = stats.get("citation", 0) + 1
            line = new_line

        # <sup>L</sup> → $\mathbb{L}$ (MinerU 把数学符号误标为上标)
        new_line = re.sub(r"<sup>([A-Z])</sup>", lambda m: f"$\\mathbb{{{m.group(1)}}}$", line)
        if new_line != line:
            stats["sup_symbol"] = stats.get("sup_symbol", 0) + 1
            line = new_line

        result.append(line)
        i += 1

    return result, stats


# ── LaTeX repair (scoped to $...$ and $$...$$) ───────────────────────────
def repair_latex_in_math(text):
    """Fix fragmented LaTeX inside math regions only.

    Patterns fixed (inside $...$ or $$...$$):
      - Digit spacing: "0 . 1" → "0.1", "1 0 ^ { 4 }" → "10^{4}"
      - Command spacing: "\\mathrm { m a x }" → "\\mathrm{max}"
      - Subscript/superscript: "E _ { \\mathrm { m a x } }" → "E_{\\mathrm{max}"
      - Operator spacing: "\\ = \\" → "=", "\\leq" preserved
    """
    stats = {"digit_space": 0, "cmd_space": 0, "brace_space": 0, "sub_space": 0}

    def fix_math(m):
        """Apply all LaTeX fixes to a single math region."""
        delim = m.group(1)  # $ or $$
        body = m.group(2)

        # 1. Digit-digit spacing: "1 0" → "10", "2 4" → "24"
        new = re.sub(r"(?<=\d)\s+(?=\d)", "", body)
        if new != body:
            stats["digit_space"] += 1
            body = new

        # 2. Digit-dot-digit: "0 . 1" → "0.1" (already handled by rule 1 for digits,
        #    but dot between digits: "0 . 1" → after digit-space fix becomes "0. 1" → need dot fix)
        new = re.sub(r"(?<=\d)\s*\.\s*(?=\d)", ".", body)
        if new != body:
            body = new

        # 3. LaTeX command + brace: "\mathrm { " → "\mathrm{"
        new = re.sub(r"(\\[a-zA-Z]+)\s+\{", r"\1{", body)
        if new != body:
            stats["cmd_space"] += 1
            body = new

        # 4. Inner brace spaces: "{ m a x }" → "{max}" (letters inside \mathrm/\text)
        #    Only collapse single-letter sequences inside braces after \mathrm/\text/\mathbb etc.
        def collapse_brace(bm):
            inner = bm.group(2)
            cmd = bm.group(1)
            # Only collapse if inner is single letters separated by spaces: "m a x" → "max"
            if re.match(r"^([a-zA-Z]\s)+[a-zA-Z]$", inner):
                return cmd + "{" + inner.replace(" ", "") + "}"
            return bm.group(0)

        # operatorname* may have space after *: \operatorname* {m a x}
        body = re.sub(r"(\\(?:mathrm|mathbf|mathsf|mathit|mathcal|mathbb|text|operatorname)\*?)\s*\{([^}]*)\}", collapse_brace, body)

        # 4b. Also collapse single-letter sequences in ANY brace: {m a x} {i j} {k a}
        #     Skip LaTeX array column specs: {l c l} {c r c} etc (single letters from lrct)
        def collapse_any_brace(bm):
            inner = bm.group(1)
            if not re.match(r"^([a-zA-Z]\s)+[a-zA-Z]$", inner):
                return bm.group(0)
            collapsed = inner.replace(" ", "")
            # Skip if it's an array column spec (only l/c/r chars)
            if set(collapsed) <= set("lcr"):
                return bm.group(0)
            return "{" + collapsed + "}"

        body = re.sub(r"\{([a-zA-Z](?:\s+[a-zA-Z])+)\}", collapse_any_brace, body)

        # 5. Subscript/superscript spacing: "E _ {" → "E_{", "^ { " → "^{"
        new = re.sub(r"([a-zA-Z0-9\\})\]])\s+([_^])", r"\1\2", body)
        if new != body:
            stats["sub_space"] += 1
            body = new
        new = re.sub(r"([_^])\s+\{", r"\1{", body)
        if new != body:
            body = new

        # 6. Inner brace spaces: "{ ... }" → "{...}" (collapse all spaces adjacent to braces)
        new = re.sub(r"\{\s+", "{", body)
        if new != body:
            stats["brace_space"] += 1
            body = new
        new = re.sub(r"\s+\}", "}", body)
        if new != body:
            body = new

        # 7. Operator spacing: "\ = \" → "=" (backslash-space equals)
        body = re.sub(r"\\\s+=\s*\\?", "=", body)
        body = re.sub(r"\\\s+-\s*\\?", "-", body)

        # 8. Collapse remaining multiple spaces inside math (but preserve single spaces
        #    that are semantically meaningful like "\frac a b")
        body = re.sub(r"  +", " ", body)

        return delim + body + delim

    # Process $$...$$ first (greedy), then $...$ (non-greedy)
    text = re.sub(r"(\$\$)([\s\S]*?)(\$\$)", lambda m: fix_math(type("", (), {"group": lambda self, i: [None, m.group(1), m.group(2), m.group(3)][i]})()), text)

    # Simpler: use a wrapper that captures delim and body
    def fix_display(m):
        return fix_math_simple(m, "$$")

    def fix_inline(m):
        return fix_math_simple(m, "$")

    text = re.sub(r"\$\$([\s\S]*?)\$\$", fix_display, text)
    text = re.sub(r"\$([^$\n]+?)\$", fix_inline, text)

    return text, stats


def fix_math_simple(m, delim):
    """Simpler interface: fix math body, prepend/append delim."""
    body = m.group(1)

    # 1. Digit-digit spacing
    body = re.sub(r"(?<=\d)\s+(?=\d)", "", body)

    # 2. Digit-dot-digit
    body = re.sub(r"(?<=\d)\s*\.\s*(?=\d)", ".", body)

    # 3. LaTeX command + brace
    body = re.sub(r"(\\[a-zA-Z]+)\s+\{", r"\1{", body)

    # 4. Collapse single-letter sequences inside \mathrm{text} etc.
    def collapse_brace(bm):
        inner = bm.group(2)
        if re.match(r"^([a-zA-Z]\s)+[a-zA-Z]$", inner):
            return bm.group(1) + "{" + inner.replace(" ", "") + "}"
        return bm.group(0)

    body = re.sub(r"(\\(?:mathrm|mathbf|mathsf|mathit|mathcal|mathbb|text|operatorname))\{([^}]*)\}", collapse_brace, body)

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


# ── Figure caption pairing ───────────────────────────────────────────────
def pair_figures(text):
    """Match figure captions (图N：...) with nearby images, wrap in {{< caption >}}.

    Strategy: scan line by line. When a 图N：caption is found, look for the
    nearest image reference within 5 lines (before or after). If found, move
    the image right before the caption and wrap the caption in {{< caption >}}.

    Returns (text, stats_dict).
    """
    lines = text.split("\n")
    stats = {"fig_paired": 0, "fig_orphan_caption": 0, "fig_orphan_image": 0}

    # Collect all caption and image positions
    captions = {}  # fig_num → (line_idx, caption_text)
    images = {}    # line_idx → image_hash (for quick lookup)
    image_lines = []

    for i, line in enumerate(lines):
        # 中文图注：图N：/ 图N./ 图 N：
        # 英文图注：Figure N: / Fig. N: / Fig N.
        m = re.match(r"^(图\s*(\d+)\s*[：:.]|Figure\s+(\d+)\s*[：:]|Fig\.?\s+(\d+)\s*[：:.])\s*(.*)", line.strip(), re.IGNORECASE)
        if m:
            fig_num = int(m.group(2) or m.group(3) or m.group(4))
            captions[fig_num] = (i, line.strip())
        m2 = re.search(r"!\[.*?\]\(images/([a-f0-9]+\.webp)\)", line)
        if m2:
            images[i] = m2.group(1)
            image_lines.append(i)

    # Track which images are already paired
    used_images = set()
    result_lines = list(lines)  # work on a copy

    for fig_num, (cap_idx, cap_text) in sorted(captions.items()):
        # Find nearest unused image within 5 lines
        best_img = None
        best_dist = 999
        for img_idx in image_lines:
            if img_idx in used_images:
                continue
            dist = abs(img_idx - cap_idx)
            if dist <= 8 and dist < best_dist:
                best_img = img_idx
                best_dist = dist

        if best_img is not None:
            used_images.add(best_img)
            stats["fig_paired"] += 1

            # Wrap caption in {{< caption >}}
            # Extract the caption content after "图N：" or "Figure N:"
            cap_content = re.sub(r"^(图\s*\d+\s*[：:.]|Figure\s+\d+\s*[：:]|Fig\.?\s+\d+\s*[：:.])\s*", "", cap_text, flags=re.IGNORECASE)
            new_caption = f"{{{{< caption >}}}}图{fig_num}：{cap_content}{{{{< /caption >}}}}"

            # Replace caption line
            result_lines[cap_idx] = new_caption
            # Note: image stays where it is (already near the caption)
        else:
            stats["fig_orphan_caption"] += 1
            # Still wrap the caption even without a nearby image
            cap_content = re.sub(r"^(图\s*\d+\s*[：:.]|Figure\s+\d+\s*[：:]|Fig\.?\s+\d+\s*[：:.])\s*", "", cap_text, flags=re.IGNORECASE)
            result_lines[cap_idx] = f"{{{{< caption >}}}}图{fig_num}：{cap_content}{{{{< /caption >}}}}"

    # Count orphan images (images not near any caption)
    for img_idx in image_lines:
        if img_idx not in used_images:
            # Check if near any caption at all
            near_cap = any(abs(img_idx - cap_idx) <= 8 for _, (cap_idx, _) in captions.items())
            if not near_cap:
                stats["fig_orphan_image"] += 1

    return "\n".join(result_lines), stats


# ── Heading hierarchy fix ────────────────────────────────────────────────
def fix_heading_hierarchy(text):
    """Fix MinerU's flat heading levels.

    MinerU marks all section headings as ##, losing hierarchy:
      ## 2 Title       → ## 2 Title       (chapter, keep ##)
      ## 2.1 Subtitle  → ### 2.1 Subtitle (subsection, demote to ###)
      ## A Appendix    → ## A Appendix    (letter appendix, keep ##)

    Returns (text, stats_dict).
    """
    stats = {"headings_demoted": 0}
    lines = text.split("\n")
    result = []

    for line in lines:
        # Match ## N.M 标题 (decimal section number) → demote to ###
        m = re.match(r"^(##)\s+(\d+\.\d+)\s", line)
        if m:
            line = "###" + line[2:]  # ## → ###
            stats["headings_demoted"] += 1
            result.append(line)
            continue

        # Match ## N.M.K (even deeper) → ####
        m = re.match(r"^(##)\s+(\d+\.\d+\.\d+)\s", line)
        if m:
            line = "####" + line[2:]
            stats["headings_demoted"] += 1
            result.append(line)
            continue

        result.append(line)

    return "\n".join(result), stats


# ── Main clean function ──────────────────────────────────────────────────
def clean(content):
    """Full cleaning pipeline. Returns (cleaned_content, stats_dict)."""
    lines = content.split("\n")

    # Stage 1: noise removal
    lines, noise_stats = remove_noise(lines)

    # Stage 2: LaTeX repair (scoped to math regions)
    text = "\n".join(lines)

    # Count math regions before
    inline_before = len(re.findall(r"\$[^$\n]+?\$", text))
    display_before = len(re.findall(r"\$\$", text)) // 2

    text = re.sub(r"\$\$([\s\S]*?)\$\$", lambda m: fix_math_simple(m, "$$"), text)
    text = re.sub(r"\$([^$\n]+?)\$", lambda m: fix_math_simple(m, "$"), text)

    # Stage 2b: heading hierarchy (N.M → ###, N → ##)
    text, heading_stats = fix_heading_hierarchy(text)

    # Stage 3: figure caption pairing
    text, fig_stats = pair_figures(text)

    # Stage 4: collapse 3+ blank lines
    before_blanks = len(re.findall(r"\n{4,}", text))
    text = re.sub(r"\n{4,}", "\n\n\n", text)

    # Stage 5: trailing whitespace
    text = "\n".join(l.rstrip() for l in text.split("\n"))

    stats = dict(noise_stats)
    stats.update(fig_stats)
    stats.update(heading_stats)
    stats["math_regions"] = inline_before + display_before
    if before_blanks:
        stats["blank_collapse"] = before_blanks

    return text, stats


def main():
    ap = argparse.ArgumentParser(description="Clean MinerU paper markdown.")
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
