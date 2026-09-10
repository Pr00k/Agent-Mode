#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/brand/icon-1024.png"
OUT="$ROOT/public/icons"
TAURI="$ROOT/src-tauri/icons"
mkdir -p "$OUT" "$TAURI"
for s in 32 48 64 72 96 128 144 152 180 192 256 384 512 1024; do
  convert "$SRC" -resize "${s}x${s}" "$OUT/icon-${s}.png"
done
cp "$OUT/icon-32.png" "$TAURI/32x32.png"
cp "$OUT/icon-128.png" "$TAURI/128x128.png"
cp "$OUT/icon-256.png" "$TAURI/128x128@2x.png"
cp "$SRC" "$TAURI/icon.png"
cp "$OUT/icon-180.png" "$OUT/apple-touch-icon.png"
cp "$OUT/icon-192.png" "$OUT/icon-maskable-192.png"
cp "$OUT/icon-512.png" "$OUT/icon-maskable-512.png"
convert "$SRC" -define icon:auto-resize=256,128,64,48,32,16 "$TAURI/icon.ico"
convert "$SRC" -resize 32x32 "$ROOT/public/favicon.png"
echo "icons ok"
