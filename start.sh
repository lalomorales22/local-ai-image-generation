#!/bin/bash

# FLUX Studio - Start Script
# https://github.com/lalomorales22/flux-studio

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo -e "${BOLD}┌─────────────────────────────────────┐${NC}"
echo -e "${BOLD}│         ✦ FLUX Studio ✦            │${NC}"
echo -e "${BOLD}│     Local AI Image Generation      │${NC}"
echo -e "${BOLD}└─────────────────────────────────────┘${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo -e "${RED}Error: FLUX image generation only works on macOS${NC}"
    exit 1
fi

echo -e "${BLUE}[1/5]${NC} Checking dependencies..."

# Check for Node.js
if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo ""
    echo "Please install Node.js first:"
    echo "  brew install node"
    echo "  or visit https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}Warning: Node.js version 18+ recommended (you have $(node -v))${NC}"
fi

echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

# Check for Ollama
if ! command_exists ollama; then
    echo -e "${YELLOW}Ollama not found. Installing...${NC}"

    if command_exists brew; then
        brew install ollama
    else
        echo ""
        echo -e "${RED}Please install Ollama manually:${NC}"
        echo "  Visit https://ollama.com/download"
        exit 1
    fi
fi

echo -e "  ${GREEN}✓${NC} Ollama installed"

# Start Ollama if not running
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo -e "${BLUE}[2/5]${NC} Starting Ollama..."
    ollama serve >/dev/null 2>&1 &
    sleep 3

    # Wait for Ollama to be ready
    for i in {1..10}; do
        if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done
fi

echo -e "  ${GREEN}✓${NC} Ollama running"

# Check for FLUX model
echo -e "${BLUE}[3/5]${NC} Checking FLUX model..."

if ! ollama list 2>/dev/null | grep -q "flux2-klein"; then
    echo -e "${YELLOW}FLUX model not found. Downloading (~5.7GB)...${NC}"
    echo ""
    ollama pull x/flux2-klein
    echo ""
fi

echo -e "  ${GREEN}✓${NC} FLUX.2 Klein model ready"

# Install dependencies
echo -e "${BLUE}[4/5]${NC} Installing dependencies..."

if [ ! -d "node_modules" ]; then
    npm install --silent
fi

if [ ! -d "client/node_modules" ]; then
    cd client && npm install --silent && cd ..
fi

echo -e "  ${GREEN}✓${NC} Dependencies installed"

# Create images directory if it doesn't exist
mkdir -p public/images

# Start the app
echo -e "${BLUE}[5/5]${NC} Starting FLUX Studio..."
echo ""

# Open browser after delay
(sleep 3 && open http://localhost:5173) &

echo -e "${GREEN}${BOLD}FLUX Studio is running!${NC}"
echo ""
echo -e "  ${BOLD}App:${NC}      http://localhost:5173"
echo -e "  ${BOLD}Backend:${NC}  http://localhost:3001"
echo ""
echo -e "Press ${BOLD}Ctrl+C${NC} to stop"
echo ""
echo "─────────────────────────────────────"
echo ""

# Start the development server
npm run dev
