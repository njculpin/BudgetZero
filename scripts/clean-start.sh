#!/bin/bash
#
# Free the dev ports, then start the dev server.
#
# The original used `lsof` and `pgrep`, neither of which ships with Git Bash on
# Windows — which is where this repository is developed — so `npm run dev:clean`
# failed on the machine it was written for. Every lookup here falls back to a
# tool that does exist, and a lookup that finds nothing is not an error.

set -u

PORTS="4321 4322"

kill_pid() {
  local pid="$1" port="$2"
  [ -z "$pid" ] && return 0
  echo "   Killing process on port ${port} (PID: ${pid})"
  # taskkill for native Windows PIDs, kill everywhere else.
  if command -v taskkill >/dev/null 2>&1; then
    taskkill //PID "$pid" //F >/dev/null 2>&1 || kill -9 "$pid" 2>/dev/null || true
  else
    kill -9 "$pid" 2>/dev/null || true
  fi
}

pids_on_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti:"$port" 2>/dev/null
  elif command -v netstat >/dev/null 2>&1; then
    # Windows netstat: the PID is the last column of a LISTENING row.
    netstat -ano 2>/dev/null \
      | grep -E "[:.]${port}[[:space:]]" \
      | grep -i "listen" \
      | awk '{print $NF}' \
      | sort -u
  fi
}

echo "🧹 Cleaning up existing dev server processes..."

for port in $PORTS; do
  for pid in $(pids_on_port "$port"); do
    kill_pid "$pid" "$port"
  done
done

# Any stray Astro process that is not holding one of the ports above.
if command -v pkill >/dev/null 2>&1; then
  pkill -9 -f "astro dev" 2>/dev/null || true
fi

echo "✅ Cleanup complete!"
echo "🚀 Starting dev server on port 4321..."
echo ""

npm run dev
