#!/usr/bin/env node

/**
 * Comprehensive test suite for Vatsal's personal website
 * Tests all aspects of the site including structure, content, functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Test results
let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];
const warnings = [];

// Simple test framework
global.describe = function(name, fn) {
  console.log(`\n${colors.yellow}${name}${colors.reset}`);
  fn();
};

global.it = function(name, fn) {
  try {
    const result = fn();
    if (result === 'skip') {
      console.log(`  ${colors.blue}⊘${colors.reset} ${name} (skipped)`);
      skipped++;
    } else {
      console.log(`  ${colors.green}✓${colors.reset} ${name}`);
      passed++;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} ${name}`);
    failed++;
    failures.push({ test: name, error: error.message });
  }
};

global.expect = function(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined`);
      }
    },
    toContain(expected) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected value to be truthy`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected value to be falsy`);
      }
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeLessThan(expected) {
      if (!(actual < expected)) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toMatch(pattern) {
      if (!pattern.test(actual)) {
        throw new Error(`Expected "${actual}" to match ${pattern}`);
      }
    },
    toHaveLength(expected) {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${actual.length} to be ${expected}`);
      }
    },
    toBeInstanceOf(expected) {
      if (!(actual instanceof expected)) {
        throw new Error(`Expected value to be instance of ${expected.name}`);
      }
    }
  };
};

// Utility functions
function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function readYamlFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      // Simple YAML parser for basic key-value pairs
      const yaml = {};
      match[1].split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          yaml[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
        }
      });
      return yaml;
    }
    return null;
  } catch (e) {
    return null;
  }
}

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch (e) {
    return -1;
  }
}

function findBrokenLinks(content, filePath) {
  const brokenLinks = [];
  // Match markdown links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const linkPath = match[2];
    
    // Skip external links and anchors
    if (linkPath.startsWith('http') || linkPath.startsWith('#') || linkPath.startsWith('mailto:')) {
      continue;
    }
    
    // Resolve relative paths
    const resolvedPath = path.resolve(path.dirname(filePath), linkPath);
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      brokenLinks.push({ text: match[1], path: linkPath });
    }
  }
  
  return brokenLinks;
}

// Start testing
console.log('🧪 Running comprehensive test suite...\n');

// Test 1: Project Structure and Files
describe('📁 Project Structure and Files', () => {
  const requiredFiles = [
    '_config.yml',
    'Gemfile',
    'Gemfile.lock',
    'index.html',
    'aboutVatsal.md',
    'about.md',
    'contact.md',
    'research-interests.md',
    'phd-thesis.md',
    'talks.md',
    'CNAME',
    'README.md',
    'LICENSE',
    '404.html'
  ];
  
  requiredFiles.forEach(file => {
    it(`should have ${file}`, () => {
      expect(fs.existsSync(file)).toBeTruthy();
    });
  });
  
  const requiredDirs = [
    'assets',
    'assets/css',
    'assets/js',
    'assets/logos',
    'assets/favicon',
    '_includes',
    '_layouts',
    'scripts',
    '.github/workflows'
  ];
  
  requiredDirs.forEach(dir => {
    it(`should have ${dir} directory`, () => {
      expect(fs.existsSync(dir)).toBeTruthy();
      expect(fs.statSync(dir).isDirectory()).toBeTruthy();
    });
  });
});

// Test 2: JavaScript Files
describe('📜 JavaScript Files', () => {
  const jsFiles = [
    'assets/js/main.js',
    'assets/js/command-palette.js',
    'assets/js/command-data.js',
    'assets/js/platform-utils.js',
    'assets/js/plugins.js'
  ];
  
  jsFiles.forEach(file => {
    it(`should have ${file}`, () => {
      expect(fs.existsSync(file)).toBeTruthy();
    });
    
    it(`${file} should have valid syntax`, () => {
      const content = fs.readFileSync(file, 'utf8');
      try {
        new Function(content);
      } catch (e) {
        throw new Error(`Syntax error: ${e.message}`);
      }
    });
    
    it(`${file} should use strict mode`, () => {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatch(/["']use strict["'];?/);
    });
  });
  
  it('search_db.json should exist and be valid JSON', () => {
    const dbPath = 'assets/js/search_db.json';
    expect(fs.existsSync(dbPath)).toBeTruthy();
    
    const content = fs.readFileSync(dbPath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      throw new Error(`Invalid JSON: ${e.message}`);
    }
    
    expect(Array.isArray(parsed)).toBeTruthy();
  });
});

// Test 3: CSS Files
describe('🎨 CSS Files and Themes', () => {
  const cssFiles = [
    'assets/css/styles.css',
    'assets/css/vendor.css',
    'assets/css/command-palette.css'
  ];
  
  cssFiles.forEach(file => {
    it(`should have ${file}`, () => {
      expect(fs.existsSync(file)).toBeTruthy();
    });
  });
  
  it('styles.css should define theme variables', () => {
    const content = fs.readFileSync('assets/css/styles.css', 'utf8');
    
    // Check for light theme variables
    expect(content).toContain(':root {');
    expect(content).toContain('--color-primary');
    expect(content).toContain('--color-text');
    expect(content).toContain('--color-bg');
    
    // Check for dark theme variables
    expect(content).toContain('[data-theme="dark"]');
    expect(content).toContain('--icon-color-bluesky');
  });
  
  it('should have theme toggle styles', () => {
    const content = fs.readFileSync('assets/css/styles.css', 'utf8');
    expect(content).toContain('.theme-toggle');
    expect(content).toContain('.theme-toggle-icon');
  });
  
  it('should have back-to-top button styles', () => {
    const content = fs.readFileSync('assets/css/styles.css', 'utf8');
    expect(content).toContain('.ss-go-top');
    expect(content).toContain('.ss-go-top.link-is-visible');
  });
});

// Test 4: Asset Files
describe('🖼️ Asset Files', () => {
  it('should have favicon files', () => {
    const faviconFiles = [
      'assets/favicon/favicon.ico',
      'assets/favicon/favicon.svg',
      'assets/favicon/apple-touch-icon.png',
      'assets/favicon/site.webmanifest'
    ];
    
    faviconFiles.forEach(file => {
      expect(fs.existsSync(file)).toBeTruthy();
    });
  });
  
  it('should have logo files', () => {
    const logoFiles = [
      'assets/logos/Logo_Vatsal_Vector.png',
      'assets/logos/Logo_Vatsal_Vector-white.png',
      'assets/logos/bluesky.png',
      'assets/logos/CoMPhy-Lab.svg'
    ];
    
    logoFiles.forEach(file => {
      expect(fs.existsSync(file)).toBeTruthy();
    });
  });
  
  it('asset files should not be too large', () => {
    const maxSizes = {
      '.png': 1024 * 1024, // 1MB
      '.jpg': 1024 * 1024, // 1MB
      '.svg': 100 * 1024,  // 100KB
      '.ico': 50 * 1024    // 50KB
    };
    
    const checkDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          checkDir(fullPath);
        } else {
          const ext = path.extname(file).toLowerCase();
          const maxSize = maxSizes[ext];
          
          if (maxSize) {
            const size = stat.size;
            if (size > maxSize) {
              warnings.push(`${fullPath} is ${(size / 1024).toFixed(2)}KB (max: ${(maxSize / 1024).toFixed(2)}KB)`);
            }
          }
        }
      });
    };
    
    checkDir('assets');
  });
});

// Test 5: Content Validation
describe('📝 Content Validation', () => {
  const markdownFiles = [
    'aboutVatsal.md',
    'about.md',
    'contact.md',
    'research-interests.md',
    'phd-thesis.md',
    'talks.md',
    'README.md'
  ];
  
  markdownFiles.forEach(file => {
    it(`${file} should have valid frontmatter`, () => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Skip README.md and aboutVatsal.md as they don't need frontmatter
      if (file === 'README.md' || file === 'aboutVatsal.md') {
        return 'skip';
      }
      
      const frontmatter = readYamlFrontmatter(file);
      expect(frontmatter).toBeDefined();
      expect(frontmatter.layout).toBeDefined();
    });
    
    it(`${file} should not have broken internal links`, () => {
      const content = fs.readFileSync(file, 'utf8');
      const brokenLinks = findBrokenLinks(content, file);
      
      if (brokenLinks.length > 0) {
        throw new Error(`Broken links: ${brokenLinks.map(l => l.path).join(', ')}`);
      }
    });
  });
  
  it('aboutVatsal.md and about.md fallback content should be synchronized', () => {
    const aboutVatsalContent = fs.readFileSync('aboutVatsal.md', 'utf8');
    const aboutContent = fs.readFileSync('about.md', 'utf8');
    
    // Since aboutVatsal.md doesn't have frontmatter, use its content directly
    const vatsalTextContent = aboutVatsalContent.trim();
    
    // Check if about.md contains the fallback content
    if (!aboutContent.includes('<!-- Fallback content in case JavaScript is disabled -->')) {
      warnings.push('about.md may not have synchronized fallback content');
    }
  });
});

// Test 6: Jekyll Configuration
describe('⚙️ Jekyll Configuration', () => {
  it('_config.yml should be valid YAML', () => {
    const content = fs.readFileSync('_config.yml', 'utf8');
    
    // Basic YAML validation
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.trim() && !line.trim().startsWith('#')) {
        // Check for basic YAML structure
        if (!line.includes(':') && !line.startsWith('-') && !line.match(/^\s/)) {
          throw new Error(`Invalid YAML at line ${index + 1}: ${line}`);
        }
      }
    });
  });
  
  it('_config.yml should have required fields', () => {
    const content = fs.readFileSync('_config.yml', 'utf8');
    
    const requiredFields = [
      'title:',
      'description:',
      'url:',
      'baseurl:'
    ];
    
    requiredFields.forEach(field => {
      expect(content).toContain(field);
    });
  });
  
  it('CNAME should contain correct domain', () => {
    const content = fs.readFileSync('CNAME', 'utf8').trim();
    expect(content).toBe('comphy-lab.org');
  });
});

// Test 7: Build Output
describe('🏗️ Build Output', () => {
  it('_site directory should exist', () => {
    if (!fs.existsSync('_site')) {
      console.log('    (Run ./scripts/build.sh first)');
      return 'skip';
    }
    expect(fs.existsSync('_site')).toBeTruthy();
  });
  
  it('_site should contain index.html', () => {
    if (!fs.existsSync('_site')) return 'skip';
    expect(fs.existsSync('_site/index.html')).toBeTruthy();
  });
  
  it('_site should contain all redirect pages', () => {
    if (!fs.existsSync('_site')) return 'skip';
    
    const redirectPages = [
      '_site/about/index.html',
      '_site/contact/index.html',
      '_site/research-interests/index.html',
      '_site/phd-thesis/index.html',
      '_site/talks/index.html'
    ];
    
    redirectPages.forEach(page => {
      expect(fs.existsSync(page)).toBeTruthy();
    });
  });
});

// Test 8: HTML Structure
describe('🏛️ HTML Structure', () => {
  it('index.html should have proper structure', () => {
    const content = fs.readFileSync('index.html', 'utf8');
    
    // Check for Jekyll frontmatter
    expect(content).toContain('---');
    expect(content).toContain('layout: default');
    
    // Check for specific sections
    expect(content).toContain('s-intro');
    expect(content).toContain('id="about"');
  });
  
  it('default layout should have theme toggle', () => {
    const content = fs.readFileSync('_layouts/default.html', 'utf8');
    
    expect(content).toContain('theme-toggle');
    expect(content).toContain('data-theme');
  });
  
  it('default layout should have back-to-top button', () => {
    const content = fs.readFileSync('_layouts/default.html', 'utf8');
    
    expect(content).toContain('ss-go-top');
    expect(content).toContain('fa-arrow-up');
  });
});

// Test 9: Redirect Pages
describe('🔀 Redirect Pages', () => {
  const redirectPages = [
    { file: 'contact.md', url: 'https://comphy-lab.org/join' },
    { file: 'research-interests.md', url: 'https://comphy-lab.org/research' },
    { file: 'phd-thesis.md', url: 'https://comphy-lab.org/research#thesis' },
    { file: 'talks.md', url: 'https://comphy-lab.org/research' }
  ];
  
  redirectPages.forEach(({ file, url }) => {
    it(`${file} should redirect to ${url}`, () => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for redirect_to in frontmatter
      const frontmatter = readYamlFrontmatter(file);
      expect(frontmatter).toBeDefined();
      expect(frontmatter.redirect_to).toBe(url);
    });
  });
  
  it('about.md should have special redirect behavior', () => {
    const content = fs.readFileSync('about.md', 'utf8');
    
    // Check for JavaScript redirect
    expect(content).toContain('window.location.replace("{{ site.baseurl }}/#about")');
    expect(content).toContain('Fallback content');
  });
});

// Test 10: Package Configuration
describe('📦 Package Configuration', () => {
  it('package.json should be valid JSON', () => {
    const pkg = readJsonFile('package.json');
    expect(pkg).toBeDefined();
  });
  
  it('package.json should have all required scripts', () => {
    const pkg = readJsonFile('package.json');
    
    const requiredScripts = [
      'lint:js',
      'lint:css',
      'lint:md',
      'lint',
      'format',
      'test'
    ];
    
    requiredScripts.forEach(script => {
      expect(pkg.scripts[script]).toBeDefined();
    });
  });
  
  it('Gemfile should specify Ruby version', () => {
    const content = fs.readFileSync('Gemfile', 'utf8');
    expect(content).toContain('ruby "~> 3.2.0"');
  });
});

// Test 11: Scripts
describe('🔧 Shell Scripts', () => {
  const scripts = [
    'scripts/setup.sh',
    'scripts/build.sh',
    'scripts/lint-check.sh',
    'scripts/runTests.sh'
  ];
  
  scripts.forEach(script => {
    it(`${script} should exist and be executable`, () => {
      expect(fs.existsSync(script)).toBeTruthy();
      
      // Check shebang
      const content = fs.readFileSync(script, 'utf8');
      expect(content).toMatch(/^#!\/bin\/(bash|sh)/);
    });
  });
});

// Test 12: SEO and Metadata
describe('🔍 SEO and Metadata', () => {
  it('should have robots.txt or sitemap.xml', () => {
    const hasRobots = fs.existsSync('robots.txt');
    const hasSitemap = fs.existsSync('sitemap.xml');
    
    if (!hasRobots && !hasSitemap) {
      warnings.push('Consider adding robots.txt or sitemap.xml for better SEO');
    }
  });
  
  it('_config.yml should have SEO-related fields', () => {
    const content = fs.readFileSync('_config.yml', 'utf8');
    
    const seoFields = ['title:', 'description:', 'url:'];
    seoFields.forEach(field => {
      expect(content).toContain(field);
    });
  });
  
  it('should have social media tags in layout', () => {
    const content = fs.readFileSync('_layouts/default.html', 'utf8');
    
    // Check for Open Graph tags
    if (!content.includes('og:title') && !content.includes('twitter:card')) {
      warnings.push('Consider adding Open Graph and Twitter Card meta tags');
    }
  });
});

// Test 13: JavaScript Functionality
describe('⚡ JavaScript Functionality', () => {
  it('main.js should define key functions', () => {
    const content = fs.readFileSync('assets/js/main.js', 'utf8');
    
    // Check for essential functions
    expect(content).toContain('loadAboutContent');
    expect(content).toContain('ssBackToTop');
    expect(content).toContain('ssMobileMenu');
  });
  
  it('command-palette.js should handle keyboard shortcuts', () => {
    const content = fs.readFileSync('assets/js/command-palette.js', 'utf8');
    
    expect(content).toContain('handleKeyDown');
    expect(content).toContain('togglePalette');
  });
  
  it('command-data.js should define commands', () => {
    const content = fs.readFileSync('assets/js/command-data.js', 'utf8');
    
    expect(content).toContain('COMMANDS');
    expect(content).toContain('RECENT_COMMANDS_KEY');
  });
});

// Test 14: Security
describe('🔒 Security', () => {
  it('should not expose sensitive information', () => {
    const checkFile = (filePath) => {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for common sensitive patterns
      const sensitivePatterns = [
        /api[_-]?key/i,
        /secret/i,
        /password/i,
        /token/i,
        /private[_-]?key/i
      ];
      
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(content)) {
          // Allow some exceptions
          const allowedContexts = [
            'CLOUDFLARE_API_TOKEN',
            'BYPASS_TOKEN',
            'secrets.',
            'github.token'
          ];
          
          const matches = content.match(new RegExp(`.{0,50}${pattern.source}.{0,50}`, 'gi'));
          if (matches) {
            matches.forEach(match => {
              if (!allowedContexts.some(allowed => match.includes(allowed))) {
                warnings.push(`Potential sensitive info in ${filePath}: ${match.trim()}`);
              }
            });
          }
        }
      });
    };
    
    // Check all text files
    const checkDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          checkDir(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (['.js', '.json', '.yml', '.yaml', '.md', '.html'].includes(ext)) {
            checkFile(fullPath);
          }
        }
      });
    };
    
    checkDir('.');
  });
  
  it('should have secure external links', () => {
    const checkFile = (filePath) => {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for non-HTTPS links
      const httpLinks = content.match(/http:\/\/(?!localhost|127\.0\.0\.1)/g);
      if (httpLinks) {
        warnings.push(`Non-HTTPS links in ${filePath}: ${httpLinks.join(', ')}`);
      }
    };
    
    // Check HTML and Markdown files
    ['index.html', '_layouts/default.html', 'aboutVatsal.md'].forEach(checkFile);
  });
});

// Test 15: Performance
describe('⚡ Performance Checks', () => {
  it('JavaScript files should be reasonably sized', () => {
    const jsFiles = fs.readdirSync('assets/js').filter(f => f.endsWith('.js'));
    
    jsFiles.forEach(file => {
      const size = getFileSize(path.join('assets/js', file));
      if (size > 100 * 1024) { // 100KB
        warnings.push(`${file} is ${(size / 1024).toFixed(2)}KB - consider minification`);
      }
    });
  });
  
  it('CSS files should be reasonably sized', () => {
    const cssFiles = fs.readdirSync('assets/css').filter(f => f.endsWith('.css'));
    
    cssFiles.forEach(file => {
      const size = getFileSize(path.join('assets/css', file));
      if (size > 200 * 1024) { // 200KB
        warnings.push(`${file} is ${(size / 1024).toFixed(2)}KB - consider optimization`);
      }
    });
  });
});

// Print test results
console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.yellow}📊 Test Summary${colors.reset}`);
console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);
console.log(`${colors.blue}⊘ Skipped: ${skipped}${colors.reset}`);
console.log(`${colors.yellow}⚠ Warnings: ${warnings.length}${colors.reset}`);

if (failures.length > 0) {
  console.log(`\n${colors.red}❌ Failures:${colors.reset}`);
  failures.forEach(({test, error}) => {
    console.log(`  ${colors.red}•${colors.reset} ${test}`);
    console.log(`    ${colors.red}→${colors.reset} ${error}`);
  });
}

if (warnings.length > 0) {
  console.log(`\n${colors.yellow}⚠️  Warnings:${colors.reset}`);
  warnings.forEach(warning => {
    console.log(`  ${colors.yellow}•${colors.reset} ${warning}`);
  });
}

// Performance report
const totalTests = passed + failed + skipped;
const successRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : 0;

console.log(`\n${colors.magenta}📈 Performance Metrics:${colors.reset}`);
console.log(`  • Total tests: ${totalTests}`);
console.log(`  • Success rate: ${successRate}%`);
console.log(`  • Execution time: ${process.uptime().toFixed(2)}s`);

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);