#!/bin/bash

# This script performs various checks on the codebase
# 1. Ensure Fuse.js is properly loaded in HTML files that use it
# 2. Check for proper script loading order (e.g., dependencies before their usage)
# 3. Fix quote style issues in JavaScript files (single quotes to double quotes)

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Running checks on repository at: $REPO_ROOT"

# Detect OS for sed compatibility
OS=$(uname)
if [ "$OS" = "Darwin" ]; then
  # macOS requires an extension argument (empty string is fine)
  SED_INPLACE="sed -i ''"
else
  # Linux version (no extension needed, but will create .bak files)
  SED_INPLACE="sed -i.bak"
fi

# Function to clean up backup files on Linux
cleanup_bak_files() {
  if [ "$OS" != "Darwin" ]; then
    find "$1" -name "*.bak" -type f -delete
  fi
}

# Check for Fuse dependency
echo "Checking for proper Fuse.js loading..."
# Look for specific Fuse.js usage - not just mentions of the word "Fuse"
FILES_WITH_FUSE=$(grep -l -E "new Fuse|window.searchFuse|Fuse\.js" "$REPO_ROOT/_layouts/"*.html "$REPO_ROOT/_includes/"*.html "$REPO_ROOT/assets/js/"*.js 2>/dev/null || echo "")

if [ -n "$FILES_WITH_FUSE" ]; then
  echo "Found files using Fuse.js:"
  echo "$FILES_WITH_FUSE" | sed 's/^/- /'
  
  # JavaScript files don't need the CDN, only check HTML files
  HTML_WITH_FUSE=$(grep -l -E "new Fuse|window.searchFuse|Fuse\.js" "$REPO_ROOT/_layouts/"*.html "$REPO_ROOT/_includes/"*.html 2>/dev/null || echo "")
  
  if [ -n "$HTML_WITH_FUSE" ]; then
    # Use while read loop to safely handle filenames with spaces
    echo "$HTML_WITH_FUSE" | while IFS= read -r file; do
      [ -z "$file" ] && continue  # Skip empty lines
      if ! grep -q "cdn.jsdelivr.net/npm/fuse.js" "$file"; then
        echo "WARNING: $file uses Fuse but doesn't include the CDN. Adding it..."
        # Find the closing </head> tag and insert the Fuse CDN script before it
        $SED_INPLACE '/<\/head>/i\
  <script defer src="https://cdn.jsdelivr.net/npm/fuse.js@6.6.2"></script>
' "$file"
        echo "Fixed: Added Fuse.js CDN to $file"
      else
        echo "OK: $file properly includes Fuse.js CDN"
      fi
    done
  else
    echo "No HTML files directly using Fuse.js found."
  fi
  
  # Check if default.html includes the Fuse CDN, since it's the base template
  if ! grep -q "cdn.jsdelivr.net/npm/fuse.js" "$REPO_ROOT/_layouts/default.html" 2>/dev/null; then
    echo "Adding Fuse.js to default layout template as a fallback..."
    $SED_INPLACE '/<\/head>/i\
  <!-- Fuse.js dependency for search functionality -->\\
  <script defer src="https://cdn.jsdelivr.net/npm/fuse.js@6.6.2"></script>
' "$REPO_ROOT/_layouts/default.html"
    echo "Fixed: Added Fuse.js CDN to default layout"
  fi
  
  # Optimized cleanup: Clean up .bak files from both directories in one operation
  if [ "$OS" != "Darwin" ]; then
    echo "Cleaning up backup files..."
    for dir in "$REPO_ROOT/_layouts" "$REPO_ROOT/_includes"; do
      cleanup_bak_files "$dir"
    done
  fi
else
  echo "No files using Fuse.js found."
fi

# Check for proper script loading order in HTML files
echo "Checking script loading order..."

# Use find with null delimiters and while read loop to safely handle filenames with spaces
find "$REPO_ROOT/_layouts" "$REPO_ROOT/_includes" -name "*.html" -print0 2>/dev/null | while IFS= read -r -d '' file; do
  # Check if command-data.js loads after command-palette.js
  if grep -q "command-data.js" "$file" && grep -q "command-palette.js" "$file"; then
    # Get first line number for each file (multiple occurrences may exist)
    DATA_LINE=$(grep -n "command-data.js" "$file" | head -1 | cut -d ":" -f 1)
    PALETTE_LINE=$(grep -n "command-palette.js" "$file" | head -1 | cut -d ":" -f 1)
    
    if [ "$PALETTE_LINE" -gt "$DATA_LINE" ]; then
      echo "WARNING: In $file, command-palette.js (line $PALETTE_LINE) loads after command-data.js (line $DATA_LINE). Check for potential dependency issues."
    fi
  fi
done

# Fix quote style in JavaScript files (single quotes to double quotes)
echo "Checking and fixing quote style in JavaScript files..."

# Parse arguments
FIX_MODE=false
if [[ "$1" == "--fix" ]]; then
  FIX_MODE=true
  echo "Running in fix mode - will modify files"
else
  echo "Running in check-only mode (use --fix to modify files)"
fi

# Run ESLint on JavaScript files with quotes rule
JS_DIR="$REPO_ROOT/assets/js"
if [[ "$FIX_MODE" == "true" ]]; then
  # Fix mode: run ESLint with --fix flag
  npx eslint "$JS_DIR" --rule 'quotes: ["error", "double"]' --fix
  if [ $? -eq 0 ]; then
    echo "Fixed quote style in JavaScript files."
  else
    echo "ESLint encountered issues while fixing quote style."
  fi
else
  # Check-only mode: run ESLint without --fix
  npx eslint "$JS_DIR" --rule 'quotes: ["error", "double"]'
  ESLINT_EXIT_CODE=$?
  if [ $ESLINT_EXIT_CODE -eq 0 ]; then
    echo "No quote style issues found in JavaScript files."
  else
    echo "Found quote style issues in JavaScript files (run with --fix to update)."
    exit $ESLINT_EXIT_CODE
  fi
fi

echo "Lint check completed!"