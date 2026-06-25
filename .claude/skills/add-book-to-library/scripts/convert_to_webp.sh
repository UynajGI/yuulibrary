#!/bin/bash
# Convert all JPG/PNG images in a directory to WebP (quality 80, lossy),
# delete originals, and fix .md references.
# Usage: convert_to_webp.sh <images_dir> <md_dir>

set -e

IMAGES_DIR="${1:?Usage: convert_to_webp.sh <images_dir> <md_dir>}"
MD_DIR="${2:?Usage: convert_to_webp.sh <images_dir> <md_dir>}"

if [ ! -d "$IMAGES_DIR" ]; then
  echo "ERROR: images dir not found: $IMAGES_DIR"
  exit 1
fi

count=$(find "$IMAGES_DIR" -maxdepth 1 \( -name "*.jpg" -o -name "*.png" \) | wc -l)
if [ "$count" -eq 0 ]; then
  echo "No JPG/PNG to convert in $IMAGES_DIR"
  exit 0
fi

echo "Converting $count images to WebP..."

for img in "$IMAGES_DIR"/*.jpg "$IMAGES_DIR"/*.png; do
  [ -f "$img" ] || continue
  out="${img%.*}.webp"
  convert "$img" -define webp:lossless=false -quality 80 "$out"
  rm -f "$img"
done

echo "Done converting. Fixing .md references..."
find "$MD_DIR" -name "*.md" -exec sed -i 's/\.jpg)/.webp)/g; s/\.png)/.webp)/g' {} +

echo "All done. $count images → WebP, references updated."
