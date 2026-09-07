#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
VERSION=$(grep '"version"' "$PROJECT_DIR/manifest.json" | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g')
ZIP_NAME="sheetsniper-v${VERSION}.zip"

echo "Building Chrome Web Store Package for SheetSniper v${VERSION}..."

mkdir -p "$DIST_DIR"
rm -f "$DIST_DIR/$ZIP_NAME"

cd "$PROJECT_DIR"

zip -r "$DIST_DIR/$ZIP_NAME" \
  manifest.json \
  background \
  content \
  engine \
  icons \
  lib \
  popup \
  -x "*.DS_Store*" -x "*__pycache__*"

echo "Successfully created package: $DIST_DIR/$ZIP_NAME"
unzip -l "$DIST_DIR/$ZIP_NAME"
