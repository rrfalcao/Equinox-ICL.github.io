#!/usr/bin/env bash
# optimize-images.sh — generate WebP + JPEG derivatives for every photo in
# static/images/ at 800/1600/2400 widths. Idempotent; only rebuilds outputs
# older than the source.
#
# Requires: cwebp, magick (ImageMagick 7). Install on macOS with:
#   brew install webp imagemagick
#
# Usage:
#   ./scripts/optimize-images.sh              # process all photos
#   ./scripts/optimize-images.sh landing.jpg  # process one file (basename)

set -euo pipefail

IMG_DIR="static/images"
WIDTHS=(800 1600 2400)
WEBP_QUALITY=78
JPEG_QUALITY=82

command -v cwebp >/dev/null || { echo "cwebp missing — run: brew install webp"; exit 1; }
command -v magick >/dev/null || { echo "magick missing — run: brew install imagemagick"; exit 1; }

process() {
  local src="$1"
  local dir base ext stem
  dir=$(dirname "$src")
  base=$(basename "$src")
  ext="${base##*.}"
  stem="${base%.*}"

  # Skip if already a derivative
  [[ "$stem" =~ -[0-9]+w$ ]] && return 0

  local src_w
  src_w=$(magick identify -format "%w" "$src")

  # Pick which widths actually apply. Always include the source width
  # so small images still get a WebP derivative.
  local widths_to_emit=()
  for w in "${WIDTHS[@]}"; do
    (( w <= src_w )) && widths_to_emit+=("$w")
  done
  if [[ ${#widths_to_emit[@]} -eq 0 ]]; then
    widths_to_emit=("$src_w")
  fi

  for w in "${widths_to_emit[@]}"; do
    # Derivatives sit alongside the source so subfolders stay self-contained.
    local webp_out="${dir}/${stem}-${w}w.webp"
    local jpg_out="${dir}/${stem}-${w}w.jpg"

    if [[ ! -f "$webp_out" || "$src" -nt "$webp_out" ]]; then
      magick "$src" -resize "${w}x" -strip -quality "$JPEG_QUALITY" "$jpg_out"
      cwebp -quiet -q "$WEBP_QUALITY" -m 6 "$jpg_out" -o "$webp_out"
      printf "  %s  →  %s (%s)\n" \
        "${dir#$IMG_DIR/}/$(basename "$src")" \
        "$(basename "$webp_out")" \
        "$(du -h "$webp_out" | cut -f1)"
    fi
  done
}

if [[ $# -gt 0 ]]; then
  process "$1"
else
  # All photos in IMG_DIR and one level of subdirectories
  shopt -s nullglob
  for f in "$IMG_DIR"/*.jpg "$IMG_DIR"/*.jpeg "$IMG_DIR"/*.png \
           "$IMG_DIR"/*/*.jpg "$IMG_DIR"/*/*.jpeg "$IMG_DIR"/*/*.png; do
    process "$f"
  done
fi

echo "done."
