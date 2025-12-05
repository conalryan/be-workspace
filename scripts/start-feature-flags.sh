#!/bin/bash

# Quick Start Script - Feature Flags System
# Runs both the API server and UI in separate processes

set -e

echo "🚩 Starting Feature Flags System..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $API_PID 2>/dev/null || true
    kill $UI_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start API Server
echo "📡 Starting API Server on port 3001..."
cd packages/api-feature-flags
pnpm dev &
API_PID=$!
cd ../..

# Wait for API to be ready
sleep 3

# Start UI
echo "🎨 Starting React UI on port 3000..."
cd packages/ui-feature-flags
pnpm dev &
UI_PID=$!
cd ../..

echo ""
echo "✅ Feature Flags System is running!"
echo ""
echo "📡 API Server:  http://localhost:3001"
echo "🎨 React UI:    http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait
