"""
Step 2 + 3 – TRANSFORM & FEATURE ENGINEERING
=============================================
Reads raw_events.jsonl → validates schema → engineers features → writes
features.parquet (or features.csv as fallback).

Features produced:
  - difficulty_norm          : cf_rating / 3500  (0-1)
  - code_length_log          : log1p(code_length)
  - solution_lines_log       : log1p(solution_lines)
  - error_rate               : wrong_answer_count / (wrong_answer_count + 1)  (0-1)
  - time_limit_s             : time_limit_ms / 1000
  - lang_*                   : one-hot for top languages
  - tag_*                    : multi-hot for top 30 cf_tags
  - target_level             : 1-5 (label)

Usage:
    python pipeline/transform.py --input data/raw_events.jsonl --output data/features.parquet
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Schema validation
# ---------------------------------------------------------------------------
REQUIRED_FIELDS = {
    "event_id", "problem_name", "difficulty", "cf_tags", "language",
    "code_length", "solution_lines", "wrong_answer_count",
    "time_limit_ms", "memory_limit_bytes", "target_level",
}

TOP_TAGS = [
    "implementation", "math", "greedy", "dp", "data structures",
    "brute force", "constructive algorithms", "graphs", "strings",
    "sortings", "binary search", "trees", "number theory",
    "dfs and similar", "two pointers", "bitmasks", "combinatorics",
    "shortest paths", "geometry", "flows", "hashing", "games",
    "matrices", "probabilities", "divide and conquer",
    "meet-in-the-middle", "string suffix structures",
    "expression parsing", "2-sat", "fft",
]

TOP_LANGS = ["CPP", "PYTHON3", "JAVA", "PYTHON2", "UNKNOWN"]


def validate_record(rec: dict) -> bool:
    missing = REQUIRED_FIELDS - rec.keys()
    if missing:
        return False
    if not (1 <= rec["target_level"] <= 5):
        return False
    if not isinstance(rec["cf_tags"], list):
        return False
    return True


def load_raw_events(path: Path) -> pd.DataFrame:
    records = []
    bad = 0
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                bad += 1
                continue
            if validate_record(rec):
                records.append(rec)
            else:
                bad += 1

    log.info(f"Loaded {len(records)} valid records, skipped {bad} invalid.")
    return pd.DataFrame(records)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame()

    # --- Numeric features ---
    out["difficulty_norm"] = df["difficulty"].clip(800, 3500) / 3500
    out["code_length_log"] = np.log1p(df["code_length"])
    out["solution_lines_log"] = np.log1p(df["solution_lines"])
    out["error_rate"] = df["wrong_answer_count"] / (df["wrong_answer_count"] + 1)
    out["time_limit_s"] = (df["time_limit_ms"] / 1000).clip(0, 10)
    out["memory_mb"] = (df["memory_limit_bytes"] / (1024 ** 2)).clip(0, 1024)

    # --- One-hot: language ---
    for lang in TOP_LANGS:
        out[f"lang_{lang.lower()}"] = (df["language"] == lang).astype(int)

    # --- Multi-hot: cf_tags ---
    for tag in TOP_TAGS:
        col = "tag_" + tag.replace(" ", "_").replace("-", "_")
        out[col] = df["cf_tags"].apply(lambda tags: int(tag in tags))

    # --- Target ---
    out["target_level"] = df["target_level"].astype(int)

    # --- Passthrough identifiers (not used in training) ---
    out["event_id"] = df["event_id"]
    out["problem_name"] = df["problem_name"]

    # Store snippet and full solution for hint serving
    out["solution_snippet"] = df.get("solution_snippet", "")
    out["solution_full"] = df.get("solution_full", "")
    out["cf_tags_raw"] = df["cf_tags"].apply(json.dumps)

    return out


def transform(input_path: Path, output_path: Path) -> None:
    df_raw = load_raw_events(input_path)
    if df_raw.empty:
        log.error("No valid records found — aborting transform.")
        sys.exit(1)

    df_feat = engineer_features(df_raw)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        df_feat.to_parquet(output_path, index=False)
        log.info(f"✅ Saved {len(df_feat)} rows → {output_path}")
    except Exception as e:
        csv_path = output_path.with_suffix(".csv")
        log.warning(f"Parquet failed ({e}), falling back to CSV → {csv_path}")
        df_feat.to_csv(csv_path, index=False)
        log.info(f"✅ Saved {len(df_feat)} rows → {csv_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("data/raw_events.jsonl"))
    parser.add_argument("--output", type=Path, default=Path("data/features.parquet"))
    args = parser.parse_args()
    transform(args.input, args.output)


if __name__ == "__main__":
    main()
