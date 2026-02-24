#!/usr/bin/env bash

set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This check must run inside a git repository."
  exit 1
fi

STAGED_NODE_MODULES="$(git diff --cached --name-only -- 'node_modules/**')"

if [[ -n "${STAGED_NODE_MODULES}" ]]; then
  echo "Blocked: staged changes detected under node_modules/."
  echo "Unstage or revert these paths before committing:"
  echo "${STAGED_NODE_MODULES}"
  echo
  echo "Quick cleanup options:"
  echo "  git restore --staged --worktree -- node_modules"
  echo "  git clean -fdX -- node_modules/"
  exit 1
fi

echo "No staged node_modules changes found."
