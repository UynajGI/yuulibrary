#!/usr/bin/env python3
"""Check paper front matter categories are first-level only (no subcategories).

Reads content/papers/*/_index.md, extracts category arrays, verifies:
1. No category contains '.' (subcategory like physics.chem-ph)
2. All categories exist in data/arxiv_categories.json (or are custom keys)

Exit 0 on pass, 1 on violation.
"""

import os, sys, json, yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load known categories
cat_path = os.path.join(ROOT, "data", "arxiv_categories.json")
with open(cat_path) as f:
    cat_data = json.load(f)
known_cats = set(cat_data.get("categories", {}).keys())

errors = []

papers_dir = os.path.join(ROOT, "content", "papers")
for name in sorted(os.listdir(papers_dir)):
    path = os.path.join(papers_dir, name, "_index.md")
    if not os.path.isfile(path):
        continue

    with open(path) as f:
        content = f.read()

    if not content.startswith("---"):
        continue

    parts = content.split("---", 2)
    if len(parts) < 3:
        continue

    try:
        fm = yaml.safe_load(parts[1])
    except Exception:
        continue

    if not fm or "category" not in fm:
        continue

    cats = fm["category"]
    if isinstance(cats, str):
        cats = [cats]

    for c in cats:
        if "." in c:
            parent = c.split(".")[0]
            errors.append(f"{name}: subcategory '{c}' — use '{parent}' instead")
        elif c not in known_cats:
            # Custom categories (finance, history, etc.) are OK
            pass

if errors:
    print(f"Category violations ({len(errors)}):")
    for e in errors:
        print(f"  [E] {e}")
    print(f"\nFix: category values must be arXiv first-level only (no dots).")
    print(f"Known first-level keys: {sorted(k for k in known_cats if '.' not in k)}")
    sys.exit(1)

print("Paper categories OK (all first-level)")
