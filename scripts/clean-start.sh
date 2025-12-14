#!/bin/bash

# Clean Start Script - Ensures dev server runs on port 4321

echo "🧹 Cleaning up existing dev server processes..."

# Kill any processes on port 4321
PORT_4321_PID=$(lsof -ti:4321)
if [ ! -z "$PORT_4321_PID" ]; then
  echo "   Killing process on port 4321 (PID: $PORT_4321_PID)"
  kill -9 $PORT_4321_PID
  sleep 1
fi

# Kill any processes on port 4322
PORT_4322_PID=$(lsof -ti:4322)
if [ ! -z "$PORT_4322_PID" ]; then
  echo "   Killing process on port 4322 (PID: $PORT_4322_PID)"
  kill -9 $PORT_4322_PID
  sleep 1
fi

# Kill any existing astro dev processes
ASTRO_PIDS=$(pgrep -f "astro dev")
if [ ! -z "$ASTRO_PIDS" ]; then
  echo "   Killing existing astro dev processes"
  pkill -9 -f "astro dev"
  sleep 1
fi

echo "✅ Cleanup complete!"
echo "🚀 Starting dev server on port 4321..."
echo ""

# Start the dev server
npm run dev
