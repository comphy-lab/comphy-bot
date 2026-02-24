/**
 * Script to fix line length issues in JavaScript files
 * To be used with ESLint's max-line-length rule
 */

const fs = require('fs');
const path = require('path');

// Configure files to process
const jsDir = path.join(__dirname, '../assets/js');
const maxLength = 80;

/**
 * Reads and returns the contents of a file as a UTF-8 string.
 *
 * @param {string} filePath - Path to the file to be read.
 * @returns {string} The file contents as a string.
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return ''; // Return empty string as fallback
  }
}

/**
 * Processes JavaScript file content to split lines exceeding the maximum allowed length.
 *
 * Analyzes each line and applies specialized breaking strategies for object definitions, URL assignments, style definitions, and string concatenations, while skipping comment lines. Returns the modified content with long lines split appropriately.
 *
 * @param {string} content - The content of a JavaScript file.
 * @returns {string} The content with long lines split to comply with the maximum line length.
 */
function fixLongLines(content) {
  const lines = content.split('\n');
  const fixedLines = [];
  
  for (let line of lines) {
    // Skip comments, they're harder to split
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || 
        line.trim().startsWith('*')) {
      fixedLines.push(line);
      continue;
    }
    
    // If line is too long, try to break it
    if (line.length > maxLength) {
      // Handle different cases for long lines
      if (line.includes('{') && line.includes('}')) {
        // Object definitions - break after commas and colons
        let fixedLine = breakObjectDefinition(line);
        fixedLines.push(...fixedLine);
      } else if (line.includes('window.location.href =') || 
                line.includes('window.open(')) {
        // URL lines - break before the URL
        let fixedLine = breakUrlLine(line);
        fixedLines.push(...fixedLine);
      } else if (line.includes('style.')) {
        // Style definitions - break after semicolons
        let fixedLine = breakStyleLine(line);
        fixedLines.push(...fixedLine);
      } else if (line.includes('+=')) {
        // String concatenation - break at += 
        let fixedLine = breakStringConcatenation(line);
        fixedLines.push(...fixedLine);
      } else {
        // Generic long line
        fixedLines.push(line); // Just keep it for now
      }
    } else {
      fixedLines.push(line);
    }
  }
  
  return fixedLines.join('\n');
}

/**
 * Splits a single-line JavaScript object definition into multiple lines at commas, preserving indentation.
 *
 * If the line cannot be split (contains no commas), returns the original line in an array.
 *
 * @param {string} line - The object definition line to split.
 * @returns {string[]} An array of lines representing the object definition split across multiple lines.
 */
function breakObjectDefinition(line) {
  // This is simplified - a real implementation would be more robust
  const indentation = line.match(/^\s*/)[0];
  const extraIndent = indentation + '  '; // Extra indentation for properties
  
  // Split at commas followed by a space
  const parts = line.split(/,\s*/);
  
  if (parts.length === 1) {
    return [line]; // Can't split by commas
  }
  
  // First line keeps the opening bracket
  const result = [parts[0] + ','];
  
  // Middle parts
  for (let i = 1; i < parts.length - 1; i++) {
    result.push(extraIndent + parts[i] + ',');
  }
  
  // Last part
  result.push(extraIndent + parts[parts.length - 1]);
  
  return result;
}

/**
 * Splits a line assigning a URL to `window.location.href` or calling `window.open` into separate lines for improved readability.
 *
 * If the line matches the pattern, returns an array with the assignment/call and the URL value on separate, properly indented lines. Otherwise, returns the original line in an array.
 *
 * @param {string} line - The line of code to process.
 * @returns {string[]} An array of lines with the assignment and URL split, or the original line if no match is found.
 */
function breakUrlLine(line) {
  const indentation = line.match(/^\s*/)[0];
  const extraIndent = indentation + '  ';
  
  // Find the URL part
  const match = line.match(/(window\.(location\.href|open)\s*=\s*)(.+)/);
  if (!match) return [line];
  
  return [
    indentation + match[1],
    extraIndent + match[3]
  ];
}

/**
 * Splits a style assignment line into multiple lines at semicolons, adding extra indentation to each part.
 *
 * @param {string} line - The style assignment line to split.
 * @returns {string[]} An array of lines with style properties separated and properly indented.
 */
function breakStyleLine(line) {
  const indentation = line.match(/^\s*/)[0];
  const extraIndent = indentation + '  ';
  
  // Split at semicolons
  const parts = line.split(/;\s*/);
  
  if (parts.length === 1) {
    return [line]; // Can't split by semicolons
  }
  
  const result = [];
  for (let i = 0; i < parts.length - 1; i++) {
    result.push(extraIndent + parts[i] + ';');
  }
  
  // Last part might not have a semicolon
  if (parts[parts.length - 1].trim()) {
    result.push(extraIndent + parts[parts.length - 1]);
  }
  
  return result;
}

/**
 * Splits a line containing string concatenation with `+=` into multiple lines for readability.
 *
 * If the line matches the pattern `variable += value`, it separates the assignment and the value onto separate lines, preserving and extending indentation. Returns the original line if no match is found.
 *
 * @param {string} line - The line to process.
 * @returns {string[]} An array of lines with the assignment and concatenated value split.
 */
function breakStringConcatenation(line) {
  const indentation = line.match(/^\s*/)[0];
  const extraIndent = indentation + '  ';
  
  // Find the += part
  const match = line.match(/(.*)\s*\+=\s*(.+)/);
  if (!match) return [line];
  
  return [
    indentation + match[1] + ' +=',
    extraIndent + match[2]
  ];
}

/**
 * Processes all JavaScript files in the target directory, fixing lines that exceed the maximum allowed length.
 *
 * Scans each `.js` file, identifies lines longer than the configured maximum, applies line-breaking strategies to fix them, and overwrites files with the corrected content. Logs statistics on the number of long lines found and files modified.
 */
function processJsFiles() {
  const jsFiles = fs.readdirSync(jsDir)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(jsDir, file));
  
  let fixedFiles = 0;
  let totalLongLines = 0;
  
  jsFiles.forEach(file => {
    const content = readFile(file);
    const lines = content.split('\n');
    
    // Count long lines
    const longLines = lines.filter(line => line.length > maxLength).length;
    totalLongLines += longLines;
    
    if (longLines > 0) {
      console.log(`${path.basename(file)}: ${longLines} lines exceed ${maxLength} characters`);
      
      const fixedContent = fixLongLines(content);
      
      if (fixedContent !== content) {
        try {
          fs.writeFileSync(file, fixedContent);
          fixedFiles++;
        } catch (error) {
          console.error(`Error writing to file ${file}:`, error.message);
        }
      }
    }
  });
  
  console.log(`\nTotal stats:`);
  console.log(`- ${totalLongLines} lines exceeded ${maxLength} characters`);
  console.log(`- ${fixedFiles} files were modified`);
}

// Run the script
processJsFiles();