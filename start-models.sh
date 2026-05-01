#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ML_SCRIPT="$ROOT_DIR/ml-service/run_intelligence_engine.sh"

if [[ ! -f "$ML_SCRIPT" ]]; then
  echo "ML launcher not found: $ML_SCRIPT"
  exit 1
fi

exec bash "$ML_SCRIPT" "$@"