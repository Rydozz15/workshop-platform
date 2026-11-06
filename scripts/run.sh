#!/usr/bin/env bash
# PromptSketch — Zero-Setup Local Memory Mode Runner
# Starts PromptSketch with hermetic in-memory JSON persistence.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

export DB_PROVIDER=memory
export PORT="${PORT:-3000}"
export NODE_ENV="${NODE_ENV:-development}"

echo "=========================================================="
echo " PromptSketch: Educational Prompt A/B & Learning Analytics"
echo " Starting in Zero-Configuration Local Memory Mode"
echo " Persistence: DB_PROVIDER=memory (${DB_MEMORY_PATH:-data.json})"
echo " Port:        http://localhost:${PORT}"
echo "=========================================================="

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  if command -v pnpm >/dev/null 2>&1; then pnpm install; else npm install; fi
fi

# Launch Next.js dev server
if command -v pnpm >/dev/null 2>&1; then pnpm dev -p "$PORT"; else npm run dev -- -p "$PORT"; fi
