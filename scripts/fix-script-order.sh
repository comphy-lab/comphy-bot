#!/bin/bash

# This script fixes the loading order of JavaScript files to ensure
# that dependencies are properly loaded before they are used.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Fixing script loading order in repository at: $REPO_ROOT"

# Fix the loading order in HTML files
HTML_FILES=$(find "$REPO_ROOT/_layouts" "$REPO_ROOT/_includes" -name "*.html" 2>/dev/null)

for file in $HTML_FILES; do
  # Check if command-data.js loads after command-palette.js
  if grep -q "command-data.js" "$file" && grep -q "command-palette.js" "$file"; then
    # Get line numbers
    PALETTE_LINE=$(grep -n "command-palette.js" "$file" | head -1 | cut -d ":" -f 1)
    DATA_LINE=$(grep -n "command-data.js" "$file" | head -1 | cut -d ":" -f 1)
    
    if [ "$PALETTE_LINE" -gt "$DATA_LINE" ]; then
      echo "Fixing script order in $file..."
      
      # Use platform-independent sed command
      sed -i".bak" "${PALETTE_LINE}d" "$file"
      
      # Add the command-palette.js script before command-data.js
      # Use platform-independent sed approach
      sed -i".bak" "${DATA_LINE}i\\
  <!-- Command palette script before command data -->\\
  <script defer src=\"/assets/js/command-palette.js\"></script>
" "$file"
      
      # Remove backup files created by sed
      rm -f "${file}.bak"
      
      echo "Fixed: Moved command-palette.js (from line $PALETTE_LINE) to before command-data.js (line $DATA_LINE) in $file"
    else
      echo "OK: $file already has correct script loading order"
    fi
  fi
done

echo "Script order fix completed!"