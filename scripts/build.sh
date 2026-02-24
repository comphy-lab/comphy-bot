#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=./lib/ruby-bundler.sh
source "$SCRIPT_DIR/lib/ruby-bundler.sh"

echo "Starting build process..."

if [ -n "${GITHUB_ACTIONS:-}" ]; then
  echo "Running in GitHub Actions environment"
else
  if [[ "${OSTYPE:-}" == "darwin"* ]]; then
    echo "macOS detected"
  elif [ -f /etc/os-release ]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    echo "Detected OS: ${NAME:-Unknown}"
  else
    echo "Unknown OS, proceeding with default configuration"
  fi
fi

setup_ruby_and_bundler "$PROJECT_ROOT"

echo "Installing Ruby dependencies..."
bundle_cmd install

echo "Installing npm dependencies..."
if [ -d "$PROJECT_ROOT/scripts" ] && [ -f "$PROJECT_ROOT/scripts/package.json" ]; then
  (cd "$PROJECT_ROOT/scripts" && npm install --no-fund --no-audit --ignore-scripts)
fi

if [ -f "$PROJECT_ROOT/package.json" ]; then
  (cd "$PROJECT_ROOT" && npm install --no-fund --no-audit --ignore-scripts)
fi

echo "Building Jekyll site..."
(
  cd "$PROJECT_ROOT"
  JEKYLL_ENV=production bundle_cmd exec jekyll build
)

echo "Build completed successfully!"
