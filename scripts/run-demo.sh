#!/usr/bin/env bash
# PromptSketch — Conference Booth & Interactive Demo Runner
# Automatically orchestrates Next.js memory-mode server, Cloudflare tunnel (if available),
# local IP fallback, dynamic NEXT_PUBLIC_BASE_URL injection, and terminal QR code.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

PORT="${PORT:-3000}"
export DB_PROVIDER=memory
export NODE_ENV=production

# In production the admin stays locked without a password: generate one for this session.
if [ -z "${ADMIN_PASSWORD:-}" ] && ! grep -q '^ADMIN_PASSWORD=' .env.local 2>/dev/null; then
  ADMIN_PASSWORD="$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 10)"
  export ADMIN_PASSWORD
  echo "Admin password for this demo session: $ADMIN_PASSWORD"
fi

SERVER_PID=""
TUNNEL_PID=""

cleanup() {
  echo ""
  echo "=== Shutting down PromptSketch Demo Services ==="
  if [ -n "$TUNNEL_PID" ] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
    kill "$TUNNEL_PID" 2>/dev/null || true
  fi
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  echo "All services terminated cleanly."
  exit 0
}

trap cleanup EXIT INT TERM

echo "=========================================================="
echo " PromptSketch Conference Booth & Demo Launcher"
echo " Initializing local memory persistence & network routing..."
echo "=========================================================="

# 1. Determine Local IP Fallback
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="127.0.0.1"
fi
FALLBACK_URL="http://${LOCAL_IP}:${PORT}"
DEMO_URL="$FALLBACK_URL"

# 2. Check for Cloudflare Tunnel
CLOUDFLARED_BIN=$(command -v cloudflared || true)

if [ -n "$CLOUDFLARED_BIN" ]; then
  echo "✓ Found cloudflared tunnel client at: $CLOUDFLARED_BIN"
  echo "Starting background Next.js server on port $PORT..."
  if command -v pnpm >/dev/null 2>&1; then pnpm dev -p "$PORT"; else npm run dev -- -p "$PORT"; fi > /tmp/promptsketch-dev.log 2>&1 &
  SERVER_PID=$!

  # Wait for local port to be ready
  echo "Waiting for local Next.js server to initialize..."
  for i in $(seq 1 30); do
    if curl -s "http://localhost:${PORT}" > /dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  echo "Starting Cloudflare quick tunnel to http://localhost:${PORT}..."
  cloudflared tunnel --url "http://localhost:${PORT}" > /tmp/promptsketch-tunnel.log 2>&1 &
  TUNNEL_PID=$!

  echo "Waiting for public HTTPS tunnel URL..."
  for i in $(seq 1 20); do
    TUNNEL_URL=$(grep -o 'https://[-a-zA-Z0-9@:%._\+~#=]*\.trycloudflare\.com' /tmp/promptsketch-tunnel.log 2>/dev/null | tail -n 1 || true)
    if [ -n "$TUNNEL_URL" ]; then
      DEMO_URL="$TUNNEL_URL"
      break
    fi
    sleep 1
  done

  if [ -n "$TUNNEL_URL" ]; then
    echo "✓ Public Cloudflare Tunnel established!"
  else
    echo "! Tunnel URL detection timed out; falling back to local network URL."
  fi
else
  echo "! cloudflared not detected in PATH; using local network endpoint."
  echo "Starting Next.js server on port $PORT..."
  if command -v pnpm >/dev/null 2>&1; then pnpm dev -p "$PORT"; else npm run dev -- -p "$PORT"; fi &
  SERVER_PID=$!
fi

export NEXT_PUBLIC_BASE_URL="$DEMO_URL"

echo ""
echo "=========================================================="
echo " PROMPTSKETCH DEMO ACTIVE"
echo " Shareable Endpoint: $DEMO_URL"
echo " Local Facilitator:  http://localhost:${PORT}"
echo " Local Network:      $FALLBACK_URL"
echo " Database Mode:      memory (zero Supabase mutation)"
echo "=========================================================="
echo ""

# 3. Render QR Code in Terminal
echo "Scan the QR code below on your mobile device to join the demo:"
echo ""

QR_PRINTED=false
if command -v npx >/dev/null 2>&1; then
  if npx --yes qrcode-terminal "$DEMO_URL" 2>/dev/null; then
    QR_PRINTED=true
  fi
fi

if [ "$QR_PRINTED" = false ]; then
  if command -v curl >/dev/null 2>&1; then
    if curl -s -m 2 "https://qrenco.de/${DEMO_URL}" 2>/dev/null; then
      QR_PRINTED=true
    fi
  fi
fi

if [ "$QR_PRINTED" = false ]; then
  echo "+----------------------------------------------------------+"
  echo "| Direct URL: $DEMO_URL"
  echo "| (Install qrcode-terminal or connect online for ASCII QR) |"
  echo "+----------------------------------------------------------+"
fi

echo ""
echo "Press Ctrl+C to stop the demo server and tunnel."

# Keep alive waiting for trap
wait "$SERVER_PID"
