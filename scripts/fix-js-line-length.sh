#!/bin/bash

# Script to fix JavaScript line length issues
set -e

# Define color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Repository root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}    CoMPhy Lab Website JS Line Length Fixer  ${NC}"
echo -e "${BLUE}=============================================${NC}"
echo

echo -e "${BLUE}Running JavaScript line length fixes...${NC}"

# Check if node is available
if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js is required but not installed. Please install Node.js first.${NC}"
  exit 1
fi

# Run our line length fixer script
node "$REPO_ROOT/scripts/fix-line-length.js"

echo -e "${GREEN}Line length fixes complete.${NC}"
echo
echo -e "${YELLOW}Note: Some complex formatting issues may require manual fixes.${NC}"
echo
echo -e "${BLUE}To check if the issues are resolved, run:${NC}"
echo -e "  ./scripts/lint-check.sh"