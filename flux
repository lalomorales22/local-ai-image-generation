#!/bin/bash

# FLUX Studio - Quick Launch
# https://github.com/lalomorales22/local-ai-image-generation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "┌─────────────────────────────────────┐"
echo "│         ✦ FLUX Studio ✦            │"
echo "└─────────────────────────────────────┘"
echo ""

# Check if Ollama is running, start if not
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "Starting Ollama..."
    ollama serve >/dev/null 2>&1 &
    sleep 2
fi

# Check for FLUX model
if ! ollama list 2>/dev/null | grep -q "flux2-klein"; then
    echo "FLUX model not found. Downloading (~5.7GB)..."
    echo ""
    ollama pull x/flux2-klein
    echo ""
fi

echo "Launching..."
echo ""
echo "  App:      http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Open browser after delay
(sleep 3 && open http://localhost:5173) &

# Start the app
npm run dev
