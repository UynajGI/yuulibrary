---
name: pdf-to-github-pages
description: |
  Convert academic PDF books into a multi-book MkDocs digital library deployed on GitHub Pages. Supports adding new books incrementally to an existing library. Full pipeline: PDF extraction (MinerU VLM), markdown cleanup, parallel AI translation (English→Chinese), MkDocs Material site with per-book chapter navigation + TOC + index + cross-references.
  Use this skill whenever the user wants to digitize a PDF book, add a book to their digital library, create an online book collection, convert academic papers to web format, build a personal digital library ("个人图书馆"), or deploy docs to GitHub Pages. Triggers on "add this book to my library", "convert PDF to website", "digital library", "GitHub Pages book", "网上图书馆", "个人图书馆".
---

# Multi-Book Digital Library on GitHub Pages

Build and maintain a personal digital library where each PDF book becomes a section of a single MkDocs Material site.

## Architecture

```
repo/                          # One git repo = one GitHub Pages site
├── mkdocs.yml                 # Single config, nav lists all books
├── docs/
│   ├── index.md               # Library landing page (book list)
│   ├── stylesheets/extra.css  # Shared visual styling
│   ├── javascripts/mathjax.js # Shared MathJax config
│   └── <book-slug>/           # One subdirectory per book
│       ├── index.md           # Book cover + TOC
│       ├── preface.md
│       ├── notations.md
│       ├── ch01.md ~ ch0N.md
│       ├── index_term.md
│       └── images/
└── .github/workflows/deploy.yml
```

## Adding the First Book (Creates the Library)

### Step 1: Initialize Library Scaffold

```bash
mkdir -p docs/stylesheets docs/javascripts .github/workflows
# Copy templates from this skill:
cp templates/mkdocs.yml ./mkdocs.yml
cp templates/extra.css docs/stylesheets/
cp templates/mathjax.js docs/javascripts/
cp templates/deploy.yml .github/workflows/
```

### Step 2: Extract PDF

See `/mineru-document-extractor` for details. For academic books with formulas:
```bash
mineru-open-api auth --verify
mineru-open-api extract book.pdf -o out/ -f md --model vlm --language en --timeout 3600
```

**If >200 pages**, split: `--pages 1-200` / `--pages 201-400` etc., then merge.

### Step 3: Clean Markdown

Run `scripts/clean_markdown.py` on the merged output. This handles:
- LaTeX whitespace (`x _ {i}` → `x_{i}`)
- Digit spacing in math (`1 0 0` → `100`)
- Stray page headers (chapter names leaked as body text)
- Footnote superscripts (`$^{1}$`)
- `\text {word}` → `\text{word}`

### Step 4: Translate (Optional, English→Chinese)

Split the book into 6 chunks of ~900 lines each. Dispatch 6 Haiku agents in parallel:

**Critical translation rules for each agent:**
- Translate ONLY English prose → Simplified Chinese
- NEVER touch: LaTeX math (`$...$`, `$$...$$`), image refs (`![](images/...)`), HTML tags, Mermaid code, URLs
- Preserve exact line count (one output line per input line)
- Use standard Chinese academic terminology (期权=option, 概率=probability, 布朗运动=Brownian motion, etc.)

### Step 5: Split into Chapter Files

Create `<book-slug>/` under `docs/`. Extract chapter boundaries from `## 第N章` or `## Chapter N` headings. Fix heading hierarchy:
- Chapter title: `#` (H1)
- Section (N.M): `##` (H2)
- Problem/topic: `###` (H3)

### Step 6: Format Special Pages

**Cover + TOC** (`<book-slug>/index.md`):
- Cover: HTML-styled centered layout with title, author, cover image
- TOC: 2-column HTML table — left = chapter links, right = section links separated by `·`

**Notations** (`<book-slug>/notations.md`):
- 4-column markdown table: symbol | meaning | symbol | meaning

**Index** (`<book-slug>/index_term.md`):
- 6-column markdown table: term | ch | term | ch | term | ch
- Each term links to correct chapter + heading anchor
- Build anchors by running `mkdocs build` first, then extracting actual `id` attributes from HTML

### Step 7: Wrap Solution Blocks

Wrap text starting with `解答：` (or `Solution:`) in:
```html
<div class="solution" markdown="1">

解答：...

</div>
```
This gives solutions a green left-border card. Requires `md_in_html` in mkdocs.yml.

### Step 8: Update mkdocs.yml Nav

Add the book to the nav section. For a translated book:
```yaml
nav:
  - 首页: index.md
  - BOOK_TITLE:
    - 封面: <book-slug>/index.md
    - 前言: <book-slug>/preface.md
    - 符号说明: <book-slug>/notations.md
    - 第1章: <book-slug>/ch01.md
    - ...
    - 索引: <book-slug>/index_term.md
```

### Step 9: Create Library Landing Page

`docs/index.md` — a styled grid/card layout listing all books with cover images and descriptions.

## Adding Another Book

1. Extract → Clean → Translate → Split (Steps 2-6 above) into a new `docs/<book-slug>/`
2. Update `mkdocs.yml` nav to add the new book section
3. Update `docs/index.md` landing page with the new book card
4. Rebuild: `mkdocs build`

**Existing books are untouched.** Shared CSS/JS applies automatically.

## Common Pitfalls

### MathJax Not Rendering Formulas
**Cause**: `ignoreHtmlClass: ".*|"` in mathjax.js blocks everything including `arithmatex` class.
**Fix**: Remove `ignoreHtmlClass` entirely. Default behavior works correctly.

### Markdown Inside HTML Not Parsed
**Fix**: Add `- md_in_html` to `markdown_extensions` in mkdocs.yml.

### Images Inside HTML Divs Not Showing
**Cause**: `![](path)` is markdown syntax, not processed inside raw HTML.
**Fix**: Use `<img src="path">` inside HTML divs, or close the div before markdown images.

### Nested Solution Divs
**Symptom**: Problem text appearing inside a green solution box.
**Cause**: Missing `</div>` before a new problem starts.
**Fix**: Ensure every `<div class="solution">` has a matching `</div>` before the next problem.

### Index Anchors 404
**Cause**: Generated slugs don't match what mkdocs produces.
**Fix**: Build first (`mkdocs build`), extract actual anchor IDs from built HTML, then regenerate index links.

### Admonition Blocks (`!!!`) Not Recommended
They require exact 4-space indentation on every content line and empty blank lines. A single misformatted line breaks the entire block. Use `<div class="solution" markdown="1">` instead — more forgiving.

### Stray "A./B./C." Prefixes
Sub-questions in the original book use letter prefixes. As standalone headings they look orphaned. Remove the prefix from heading text, but keep it in inline body text when part of multi-part problems.

## Templates Included

- `templates/mkdocs.yml` — Base config with Material theme, MathJax, md_in_html
- `templates/extra.css` — H3 blue cards, solution green boxes, image shadows, full-width tables
- `templates/mathjax.js` — Minimal MathJax 3 config (NO ignoreHtmlClass)
- `templates/deploy.yml` — GitHub Actions for automatic gh-pages deployment
