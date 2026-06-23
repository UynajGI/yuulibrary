#!/bin/bash
# Mechanical validation for book markdown quality
# Called by lefthook pre-commit, or run directly
set -eo pipefail
BOOK_DIR="${1:-content/books}"
ERRORS=0
RED='\033[31m'; GREEN='\033[32m'; NC='\033[0m'

check() { local name="$1" file="$2" pattern="$3" desc="$4"
    local hits=$(grep -cE "$pattern" "$file" 2>/dev/null || true)
    if [ "${hits:-0}" -gt 0 ]; then
        echo -e "  ${RED}FAIL${NC} $desc: ${hits} occurrences in $(basename $file)"
        grep -nE "$pattern" "$file" | head -3
        return 1
    fi
    return 0
}

echo "=== Book validation ==="
for f in $(find "$BOOK_DIR" -name 'ch*.md' | sort); do
    name=$(basename "$f")
    issues=0

    # 1. Images inside $$ blocks
    python3 -c "
import re, sys
with open('$f') as fp:
    lines = fp.readlines()
in_math = False
for i, line in enumerate(lines, 1):
    s = line.strip()
    if s == '\$\$': in_math = not in_math
    elif in_math and s.startswith('!['):
        print(f'{i}: IMAGE in math: {s[:60]}')
        sys.exit(1)
" 2>/dev/null || { ((issues++)); echo "  ${RED}FAIL${NC} image-in-math"; }

    # 2. Odd $$ count
    count=$(grep -cF '$$' "$f" 2>/dev/null || true)
    if [ $((count % 2)) -ne 0 ]; then
        ((issues++)); echo "  ${RED}FAIL${NC} odd $$ count: $count"
    fi

    # 3. Empty $$ blocks
    empty=$(python3 -c "
import re
with open('$f') as fp:
    text = fp.read()
hits = len(re.findall(r'\\\$\\\$\s*\n\s*\\\$\\\$', text))
print(hits)
" 2>/dev/null || echo 0)
    if [ "$empty" -gt 0 ]; then
        ((issues++)); echo "  ${RED}FAIL${NC} $empty empty \$\$ blocks"
    fi

    # 4. Compound math block (two formulas in one $$)
    compound=$(python3 -c "
import re
with open('$f') as fp:
    text = fp.read()
# Find $$ blocks that contain blank lines (compound formulas)
blocks = re.findall(r'\\\$\\\$\s*\n(.*?)\n\s*\\\$\\\$', text, re.DOTALL)
hits = sum(1 for b in blocks if b.count('\n\n') > 0)
print(hits)
" 2>/dev/null || echo 0)
    if [ "$compound" -gt 0 ]; then
        ((issues++)); echo "  ${RED}FAIL${NC} $compound compound \$\$ blocks"
    fi

    # 5. .html links
    check "html-links" "$f" '\.html\)' ".html links" || ((issues++))

    # 6. Naked captions (starts with 图N.N or 表N.N, not wrapped)
    check "captions" "$f" '^(图|表)[0-9]+\.[0-9]+' "naked captions" || ((issues++))

    # 7. <details> remaining
    check "details" "$f" '<details>' "<details> blocks" || ((issues++))

    if [ $issues -gt 0 ]; then ((ERRORS += issues)); fi
done

echo ""
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}=== $ERRORS issues found ===${NC}"
    exit 1
else
    echo -e "${GREEN}=== All clean ===${NC}"
fi
