#!/usr/bin/env node

/**
 * Simple test runner for Vatsal's personal website
 * Runs without Jest or other dependencies
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// Test results
let passed = 0;
let failed = 0;
const failures = [];

// Simple test framework
global.describe = function(name, fn) {
  console.log(`\n${colors.yellow}${name}${colors.reset}`);
  fn();
};

global.it = function(name, fn) {
  try {
    fn();
    console.log(`  ${colors.green}✓${colors.reset} ${name}`);
    passed++;
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
    }
  };
};

// Run simple validation tests
console.log('🧪 Running simple validation tests...\n');

// Test 1: Check if required files exist
describe('Project structure', () => {
  it('should have _config.yml', () => {
    expect(fs.existsSync('_config.yml')).toBeTruthy();
  });
  
  it('should have Gemfile', () => {
    expect(fs.existsSync('Gemfile')).toBeTruthy();
  });
  
  it('should have assets directory', () => {
    expect(fs.existsSync('assets')).toBeTruthy();
  });
  
  it('should have index.html', () => {
    expect(fs.existsSync('index.html')).toBeTruthy();
  });
  
  it('should have aboutVatsal.md', () => {
    expect(fs.existsSync('aboutVatsal.md')).toBeTruthy();
  });
});

// Test 2: Check JavaScript files
describe('JavaScript files', () => {
  const jsFiles = [
    'assets/js/main.js',
    'assets/js/command-palette.js',
    'assets/js/command-data.js'
  ];
  
  jsFiles.forEach(file => {
    it(`should have ${file}`, () => {
      expect(fs.existsSync(file)).toBeTruthy();
    });
  });
});

// Test 3: Check if build output exists
describe('Build output', () => {
  it('should have _site directory after build', () => {
    expect(fs.existsSync('_site')).toBeTruthy();
  });
  
  it('should have search database', () => {
    expect(fs.existsSync('assets/js/search_db.json')).toBeTruthy();
  });
});

// Test 4: Basic JavaScript syntax check
describe('JavaScript syntax', () => {
  it('should have valid JavaScript in main.js', () => {
    const content = fs.readFileSync('assets/js/main.js', 'utf8');
    expect(content).toContain('use strict');
  });
});

// Print results
console.log(`\n${colors.yellow}Test Results:${colors.reset}`);
console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

if (failures.length > 0) {
  console.log(`\n${colors.red}Failures:${colors.reset}`);
  failures.forEach(({test, error}) => {
    console.log(`  ${test}: ${error}`);
  });
}

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);