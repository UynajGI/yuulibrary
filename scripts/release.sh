#!/usr/bin/env bash
# 算出今天的下一个发布 tag。格式：YYYY.MM.DD.NN（同一天递增最后一位）
# 例：2026.07.07.01 → 2026.07.07.02；当天第一个 → 2026.07.07.01
#
# 只打印建议值，不自动打 tag —— 确认后手动执行输出里的 git tag 命令。
# 打完并 push tag 后，GitHub Actions 自动部署到 gh-pages。
set -euo pipefail

today=$(date +%Y.%m.%d)
last_of_today=$(git tag -l "${today}.*" | sort -V | tail -1)

if [ -z "$last_of_today" ]; then
  next="${today}.01"
else
  seq_num=${last_of_today##*.}
  # 10# 强制十进制，避免 08/09 被当八进制报错；%02d 补零保持两位
  next_num=$((10#$seq_num + 1))
  next="${today}.$(printf '%02d' "$next_num")"
fi

# 分支检查：main 是 template 分支，日常发布应在 personal
branch=$(git branch --show-current 2>/dev/null)
cat <<EOF
下一个发布 tag：$next
EOF
if [ "$branch" = "main" ]; then
  cat <<EOF

⚠️  当前在 main（template）分支。
   日常发布应在 personal 分支：git checkout personal
   若确需在 main 打 tag（更新 template），请再次确认后执行下方命令。
EOF
fi

cat <<EOF

确认无误后执行：
  git tag $next && git push origin $next
EOF
