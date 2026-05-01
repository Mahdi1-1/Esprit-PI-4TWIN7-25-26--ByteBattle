#!/usr/bin/env bash
# =============================================================================
# ByteBattle ML Service – End-to-End Pipeline Runner
# =============================================================================
# Usage:
#   ./run_pipeline.sh [--seed | --deepmind] [--problems N]
#
# Modes:
#   --seed      Use synthetic seed data (fast, offline) — default
#   --deepmind  Download real data from deepmind/code_contests (requires internet)
#
# =============================================================================

set -euo pipefail

ML_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ML_DIR"

# Colours
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "${GREEN}[$(date +%H:%M:%S)] ✅ $*${NC}"; }
info()  { echo -e "${BLUE}[$(date +%H:%M:%S)] ℹ️  $*${NC}"; }
warn()  { echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠️  $*${NC}"; }
error() { echo -e "${RED}[$(date +%H:%M:%S)] ❌ $*${NC}"; exit 1; }

# Parse args
MODE="seed"
MAX_PROBLEMS=3000

while [[ $# -gt 0 ]]; do
  case $1 in
    --seed)     MODE="seed";     shift ;;
    --deepmind) MODE="deepmind"; shift ;;
    --problems) MAX_PROBLEMS="$2"; shift 2 ;;
    *) error "Unknown argument: $1" ;;
  esac
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ByteBattle ML Service — Progressive Hint System"
echo "   Mode: $MODE | Problems: $MAX_PROBLEMS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ─── STEP 0: Virtual environment ───────────────────────────────────────────
export PYTHONPATH="$ML_DIR"

if [ ! -d "venv" ]; then
  info "Creating Python virtual environment…"
  python3 -m venv venv
fi

source venv/bin/activate
info "Activated venv: $(which python)"

info "Installing dependencies…"
pip install -q -r requirements.txt

# ─── STEP 1: Ingest ────────────────────────────────────────────────────────
echo ""
echo "━━━ STEP 1: INGEST ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
mkdir -p data models

if [ "$MODE" = "deepmind" ]; then
  info "Ingesting from deepmind/code_contests (max $MAX_PROBLEMS problems)…"
  python pipeline/ingest_deepmind.py \
    --max-problems "$MAX_PROBLEMS" \
    --output data/raw_events.jsonl
else
  info "Generating synthetic seed dataset (2000 events)…"
  python data/seed_dataset.py \
    --output data/raw_events.jsonl \
    --n 2000
fi

EVENTS=$(wc -l < data/raw_events.jsonl)
log "Ingested $EVENTS events → data/raw_events.jsonl"

# ─── STEP 2+3: Transform & Feature Engineering ─────────────────────────────
echo ""
echo "━━━ STEP 2+3: TRANSFORM & FEATURE ENGINEERING ━━━━━━━━━━━━━━━━━━━━━"
python pipeline/transform.py \
  --input data/raw_events.jsonl \
  --output data/features.parquet
log "Features saved → data/features.parquet"

# ─── STEP 4: Train & Evaluate ──────────────────────────────────────────────
echo ""
echo "━━━ STEP 4: TRAIN & EVALUATE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python pipeline/train.py \
  --features data/features.parquet \
  --output-dir models/
log "Model trained → models/champion_model.pkl"
log "Report saved → models/report.json"

# ─── STEP 5: Export ONNX ───────────────────────────────────────────────────
echo ""
echo "━━━ STEP 5: EXPORT ONNX ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
python pipeline/export_onnx.py \
  --model-dir models/ \
  --features data/features.parquet || warn "ONNX export failed (optional step). PKL model will be used."

# ─── DONE ──────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Pipeline complete!"
echo ""
echo -e "${BLUE}📊 Model report:${NC}"
cat models/report.json | python3 -c "
import json, sys
r = json.load(sys.stdin)
print(f\"  Champion: {r['champion']['model']}\")
print(f\"  Score:    {r['champion']['champion_score']:.4f}\")
print(f\"  Accuracy: {r['champion']['accuracy']:.4f}\")
print(f\"  Macro-F1: {r['champion']['macro_f1']:.4f}\")
print(f\"  Kappa:    {r['champion']['quadratic_kappa']:.4f}\")
print(f\"  MAE:      {r['champion']['mae']:.4f}\")
print(f\"  Test set: {r['test_set_size']} samples\")
"

echo ""
echo -e "${GREEN}🚀 To start the hint API server:${NC}"
echo "   cd ml-service && source venv/bin/activate"
echo "   uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload"
echo ""
echo -e "${GREEN}📖 API docs:${NC} http://localhost:8001/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
