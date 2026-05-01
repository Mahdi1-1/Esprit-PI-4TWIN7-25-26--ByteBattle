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

echo "🔨 Building bytebattle-sandbox-c..."
docker build -t bytebattle-sandbox-c -f "$SCRIPT_DIR/Dockerfile.c" "$SCRIPT_DIR"

echo "🔨 Building bytebattle-sandbox-java..."
docker build -t bytebattle-sandbox-java -f "$SCRIPT_DIR/Dockerfile.java" "$SCRIPT_DIR"

echo "🔨 Building bytebattle-sandbox-go..."
docker build -t bytebattle-sandbox-go -f "$SCRIPT_DIR/Dockerfile.go" "$SCRIPT_DIR"

echo "🔨 Building bytebattle-sandbox-rust..."
docker build -t bytebattle-sandbox-rust -f "$SCRIPT_DIR/Dockerfile.rust" "$SCRIPT_DIR"

echo "🔨 Building bytebattle-sandbox-typescript..."
docker build -t bytebattle-sandbox-typescript -f "$SCRIPT_DIR/Dockerfile.typescript" "$SCRIPT_DIR"

echo ""
echo "✅ All sandbox images built successfully:"
docker images --format "  {{.Repository}}:{{.Tag}} ({{.Size}})" | grep bytebattle-sandbox
