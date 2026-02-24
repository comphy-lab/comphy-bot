#!/bin/bash

# Script to fix quote style issues in JavaScript files
cd "$(dirname "$0")/.." || exit 1

# Detect the platform to use appropriate sed command
if [[ "$(uname)" == "Darwin" ]]; then
    # macOS (BSD sed)
    sed_cmd="sed -i ''"
else
    # Linux/Unix (GNU sed)
    sed_cmd="sed -i"
fi

# Replace single quotes with double quotes in JavaScript files
find ./assets/js -name "*.js" -type f -print0 | while IFS= read -r -d '' file; do
    # Create a temp file for the transformation
    tmp_file=$(mktemp)
    
    # Process the file
    cat "$file" | $sed_cmd "s/'[^']*'/\$(echo & | sed 's/'/\"/g')/g" > "$tmp_file"
    
    # Move the temp file to the original
    mv "$tmp_file" "$file"
    
    echo "Processed $file"
done

# Let the user know we're done
echo "Quote style fixed in JavaScript files"