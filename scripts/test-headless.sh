#!/bin/bash

# Script to run Electron tests in headless mode using Xvfb
# Usage: ./scripts/test-headless.sh

set -e

echo "Running Electron tests in headless mode..."

# Check if running on Linux and if Xvfb is available
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v xvfb-run &> /dev/null; then
        echo "Using Xvfb for headless testing on Linux..."
        export DISPLAY=:99
        xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24 -ac" \
            npm run test:electron:headless
    else
        echo "Warning: Xvfb not found. Installing virtual framebuffer..."
        echo "Please run: sudo apt-get update && sudo apt-get install -y xvfb"
        echo "For now, running with HEADLESS=1 (windows may still be visible)..."
        npm run test:electron:headless
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Running on macOS with headless configuration..."
    npm run test:electron:headless
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Running on Windows with headless configuration..."
    npm run test:electron:headless
else
    echo "Unknown OS type: $OSTYPE"
    echo "Attempting to run with headless configuration..."
    npm run test:electron:headless
fi

echo "Headless test run completed!"