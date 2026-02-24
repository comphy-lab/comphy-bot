#!/usr/bin/env bash

# deploy.sh - Find an available port and start Jekyll development server
# Usage: ./scripts/deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=./lib/ruby-bundler.sh
source "$SCRIPT_DIR/lib/ruby-bundler.sh"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
START_PORT=4001
END_PORT=4999
LIVERELOAD_START_PORT=35729
LIVERELOAD_END_PORT=36729

# Filter known WEBrick client disconnect noise (non-fatal connection resets).
filter_webrick_noise() {
    sed -E \
      -e '/Errno::ECONNRESET: Connection reset by peer @ io_fillbuf/d' \
      -e '/WEBrick::HTTPServer#run/d' \
      -e '/WEBrick::GenericServer#start_thread/d' \
      -e '/webrick\/httpserver\.rb:82:in '\''IO#eof\?'\''/d'
}

# Function to check if a port is available
is_port_available() {
    local port=$1
    # Check if port has a TCP LISTEN socket (not ephemeral client connections)
    if lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
        return 1  # Port is in use (listening)
    else
        return 0  # Port is available
    fi
}

# Function to find an available port
find_available_port_in_range() {
    local start_port=$1
    local end_port=$2

    for port in $(seq "$start_port" "$end_port"); do
        if is_port_available $port; then
            echo $port
            return 0
        fi
    done

    return 1
}

# Main execution
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Jekyll Development Server${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

setup_ruby_and_bundler "$PROJECT_ROOT"

echo -e "${BLUE}🔍 Searching for available site port...${NC}" >&2
PORT=$(find_available_port_in_range "$START_PORT" "$END_PORT")

if [ -z "$PORT" ]; then
    echo -e "${RED}✗ No available site ports found in range ${START_PORT}-${END_PORT}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found available site port: ${PORT}${NC}" >&2

echo -e "${BLUE}🔍 Searching for available LiveReload port...${NC}" >&2
LIVERELOAD_PORT=$(find_available_port_in_range "$LIVERELOAD_START_PORT" "$LIVERELOAD_END_PORT")

if [ -z "$LIVERELOAD_PORT" ]; then
    echo -e "${RED}✗ No available LiveReload ports found in range ${LIVERELOAD_START_PORT}-${LIVERELOAD_END_PORT}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found available LiveReload port: ${LIVERELOAD_PORT}${NC}" >&2

echo ""
echo -e "${GREEN}🚀 Starting Jekyll server on port ${PORT}...${NC}"
echo -e "${YELLOW}📍 Local URL: http://localhost:${PORT}${NC}"
echo -e "${YELLOW}🔁 LiveReload URL: http://localhost:${LIVERELOAD_PORT}${NC}"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Start Jekyll with the found port
(
    cd "$PROJECT_ROOT"
    bundle_cmd exec jekyll serve --port "$PORT" --livereload --livereload-port "$LIVERELOAD_PORT" \
      2> >(filter_webrick_noise >&2)
)
