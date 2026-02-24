#!/bin/bash

# Run comprehensive test suite
echo "🧪 Vatsal's Personal Website - Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to run tests."
    exit 1
fi

# Run the comprehensive test suite
node scripts/comprehensive-test.js

# Capture exit code
TEST_EXIT_CODE=$?

# Additional quick checks
echo ""
echo "🔍 Running additional quick checks..."

# Check if Jekyll is available
if command -v bundle &> /dev/null && bundle exec jekyll --version &> /dev/null; then
    echo "✓ Jekyll is available"
else
    echo "⚠ Jekyll not available (run ./scripts/setup.sh to install)"
fi

# Check if the site has been built
if [ -d "_site" ]; then
    echo "✓ Site has been built"
else
    echo "⚠ Site not built (run ./scripts/build.sh to build)"
fi

# Check for node_modules
if [ -d "node_modules" ]; then
    echo "✓ Node dependencies installed"
else
    echo "⚠ Node dependencies not installed (run npm install)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Exit with test suite exit code
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Test suite completed successfully!"
else
    echo "❌ Test suite failed!"
fi

exit $TEST_EXIT_CODE