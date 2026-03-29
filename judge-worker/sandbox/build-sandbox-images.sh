#!/usr/bin/env bash
# ── Build all ByteBattle sandbox Docker images ───────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔨 Building bytebattle-sandbox-node..."
docker build -t bytebattle-sandbox-node -f "$SCRIPT_DIR/Dockerfile.node" "$SCRIPT_DIR"

echo "🔨 Building bytebattle-sandbox-python..."
docker build -t bytebattle-sandbox-python -f "$SCRIPT_DIR/Dockerfile.python" "$SCRIPT_DIR"

echo "🔨 Building bytebattle-sandbox-cpp..."
docker build -t bytebattle-sandbox-cpp -f "$SCRIPT_DIR/Dockerfile.cpp" "$SCRIPT_DIR"

echo ""
echo "✅ All sandbox images built successfully:"
docker images --format "  {{.Repository}}:{{.Tag}} ({{.Size}})" | grep bytebattle-sandbox
