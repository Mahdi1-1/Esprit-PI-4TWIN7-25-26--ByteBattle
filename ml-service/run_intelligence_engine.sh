#!/usr/bin/env bash
set -euo pipefail

ML_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ML_DIR"

PYTHON_BIN="$ML_DIR/venv/bin/python"
if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "❌ Python venv not found at $PYTHON_BIN"
  echo "Create it first: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

MODE="full"
MAX_PROBLEMS=2500
N_USERS=1200
SESSIONS_PER_USER=8
PORT=8001

while [[ $# -gt 0 ]]; do
  case "$1" in
    --train-only) MODE="train"; shift ;;
    --serve-only) MODE="serve"; shift ;;
    --max-problems) MAX_PROBLEMS="$2"; shift 2 ;;
    --n-users) N_USERS="$2"; shift 2 ;;
    --sessions-per-user) SESSIONS_PER_USER="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ "$MODE" == "full" || "$MODE" == "train" ]]; then
  echo "▶ Generating hybrid data..."
  PYTHONPATH=. "$PYTHON_BIN" pipeline/generate_hybrid_data.py \
    --output data/hybrid_sessions.parquet \
    --metadata-output data/challenges_metadata.parquet \
    --max-problems "$MAX_PROBLEMS" \
    --n-users "$N_USERS" \
    --sessions-per-user "$SESSIONS_PER_USER" \
    --outlier-ratio 0.10

  echo "▶ Training 4-model intelligence engine..."
  PYTHONPATH=. "$PYTHON_BIN" pipeline/train_pipeline.py \
    --sessions data/hybrid_sessions.parquet \
    --metadata data/challenges_metadata.parquet \
    --output-dir models/intelligence_engine \
    --synthetic-alpha 0.3
fi

if [[ "$MODE" == "full" || "$MODE" == "serve" ]]; then
  echo "▶ Starting FastAPI Intelligence Engine on port $PORT..."
  PYTHONPATH=. "$ML_DIR/venv/bin/uvicorn" api.app:app --host 0.0.0.0 --port "$PORT" --reload
fi
