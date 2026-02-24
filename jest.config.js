/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'assets/js/**/*.js',
    'scripts/**/*.js',
    'tests/setup.js',
    '!scripts/simple-test.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/_site/**'
  ],
  transform: {},
  modulePathIgnorePatterns: ['_site'],
  testPathIgnorePatterns: ['_site', 'node_modules'],
  setupFiles: ['./tests/setup.js']
};