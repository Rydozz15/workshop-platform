#!/usr/bin/env bash
# macOS: double-click this file. (If it says it has no permission: chmod +x start.command)
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed: download the LTS version at https://nodejs.org and open this file again."
  read -r -p "Press Enter to close..." _
  exit 1
fi
node scripts/start-local.js "$@"
read -r -p "PromptSketch stopped. Press Enter to close..." _
