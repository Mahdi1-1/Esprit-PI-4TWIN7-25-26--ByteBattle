#!/usr/bin/env bash
set -euo pipefail

# Usage: ./tools/lighthouse/run_lighthouse.sh [BASE_URL]
# Example: ./tools/lighthouse/run_lighthouse.sh http://localhost:5173

BASE_URL=${1:-http://localhost:5173}
OUT_DIR=reports/lighthouse
mkdir -p "$OUT_DIR"
DATE=$(date +"%Y%m%d-%H%M%S")

ROUTES=("/" "/admin/users" "/discussion" "/ai/interview")

echo "Starting Lighthouse sweeps against $BASE_URL"

for route in "${ROUTES[@]}"; do
  # sanitize filename
  safe_route=$(echo "$route" | sed 's#/#-#g' | sed 's#^-##')
  outfile="$OUT_DIR/lighthouse-${safe_route:-root}-$DATE.html"
  echo "-> Auditing: $BASE_URL$route -> $outfile"
  # Run lighthouse via npx so no global install is required. Requires Chrome/Chromium present.
  npx lighthouse "$BASE_URL$route" --output html --output-path "$outfile" --quiet || {
    echo "Lighthouse failed for $route; continuing..." >&2
  }
done

echo "Lighthouse runs complete. Reports saved in $OUT_DIR"
