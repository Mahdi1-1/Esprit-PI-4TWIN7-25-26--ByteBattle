"""
Step 4 – TRAIN & EVALUATE
==========================
Loads features.parquet → trains 3 models → evaluates on FROZEN 15% test set
→ picks champion → saves report.json + champion_model.pkl.

Models compared:
1. LogisticRegression (baseline)
2. RandomForest
3. XGBoost (wrapped in a picklable sklearn-compatible class)

Champion formula:
    score = 0.35 * macro_f1 + 0.30 * kappa + 0.20 * accuracy + 0.15 * (1 - mae_norm)

Usage:
    python pipeline/train.py --features data/features.parquet --output-dir models/
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path
import warnings

warnings.filterwarnings("ignore")

import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    cohen_kappa_score,
    f1_score,
    mean_absolute_error,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
import xgboost as xgb
from pipeline.model_utils import XGBoostWrapper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Feature columns (exclude identifiers + target + text blobs)
# ---------------------------------------------------------------------------
NON_FEATURE_COLS = {
    "target_level", "event_id", "problem_name",
    "solution_snippet", "solution_full", "cf_tags_raw",
}

RANDOM_STATE = 42
TEST_SIZE = 0.15
LABEL_COL = "target_level"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def load_features(path: Path) -> pd.DataFrame:
    if path.suffix == ".parquet":
        df = pd.read_parquet(path)
    else:
        df = pd.read_csv(path)
    log.info(f"Loaded {len(df)} rows × {df.shape[1]} cols from {path}")
    return df


def champion_score(macro_f1: float, kappa: float, accuracy: float, mae: float) -> float:
    mae_norm = mae / 4.0  # levels 1-5, max MAE = 4
    return 0.35 * macro_f1 + 0.30 * kappa + 0.20 * accuracy + 0.15 * (1 - mae_norm)


def evaluate(model, X_test: np.ndarray, y_test: np.ndarray, name: str) -> dict:
    y_pred = model.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))
    macro_f1 = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
    kappa = float(cohen_kappa_score(y_test, y_pred, weights="quadratic"))
    mae = float(mean_absolute_error(y_test, y_pred))
    score = champion_score(macro_f1, kappa, acc, mae)

    metrics = {
        "model": name,
        "accuracy": round(acc, 4),
        "macro_f1": round(macro_f1, 4),
        "quadratic_kappa": round(kappa, 4),
        "mae": round(mae, 4),
        "champion_score": round(score, 4),
    }
    log.info(
        f"[{name:30s}] Acc={acc:.4f}  F1={macro_f1:.4f}  "
        f"Kappa={kappa:.4f}  MAE={mae:.4f}  ChampScore={score:.4f}"
    )
    return metrics


def build_models():
    """Returns list of (name, unfitted_model)."""
    return [
        (
            "LogisticRegression",
            Pipeline([
                ("scaler", StandardScaler()),
                ("clf", LogisticRegression(
                    max_iter=1000,
                    C=1.0,
                    class_weight="balanced",
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                )),
            ]),
        ),
        (
            "RandomForest",
            RandomForestClassifier(
                n_estimators=300,
                max_depth=None,
                min_samples_leaf=2,
                class_weight="balanced",
                random_state=RANDOM_STATE,
                n_jobs=-1,
            ),
        ),
        (
            "XGBoost",
            XGBoostWrapper(
                n_estimators=400,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                eval_metric="mlogloss",
                random_state=RANDOM_STATE,
                n_jobs=-1,
                verbosity=0,
            ),
        ),
    ]


# ---------------------------------------------------------------------------
# Main training loop
# ---------------------------------------------------------------------------
def train(features_path: Path, output_dir: Path) -> None:
    df = load_features(features_path)

    feature_cols = [c for c in df.columns if c not in NON_FEATURE_COLS]
    X = df[feature_cols].fillna(0).values
    y = df[LABEL_COL].values

    log.info(f"Feature matrix: {X.shape}, Labels distribution: {dict(zip(*np.unique(y, return_counts=True)))}")

    # Frozen test split (stratified)
    indices = np.arange(len(X))
    idx_train, idx_test = train_test_split(
        indices, test_size=TEST_SIZE, stratify=y, random_state=RANDOM_STATE
    )
    X_train, X_test = X[idx_train], X[idx_test]
    y_train, y_test = y[idx_train], y[idx_test]

    log.info(f"Train set: {len(X_train)}, Test set: {len(X_test)} (frozen, stratified)")

    output_dir.mkdir(parents=True, exist_ok=True)

    results = []
    fitted_models = {}

    for name, model in build_models():
        log.info(f"\n{'='*60}\nTraining {name}…")
        model.fit(X_train, y_train)
        metrics = evaluate(model, X_test, y_test, name)
        results.append(metrics)
        fitted_models[name] = model

    # Pick champion
    champion = max(results, key=lambda r: r["champion_score"])
    log.info(f"\n🏆 Champion: {champion['model']} (score={champion['champion_score']})")

    champion_model = fitted_models[champion["model"]]

    # Save champion model
    model_path = output_dir / "champion_model.pkl"
    joblib.dump(champion_model, model_path)
    log.info(f"✅ Saved champion model → {model_path}")

    # Save metadata (feature columns for inference)
    meta = {
        "champion": champion["model"],
        "feature_cols": feature_cols,
        "champion_score": champion["champion_score"],
    }
    meta_path = output_dir / "model_meta.json"
    meta_path.write_text(json.dumps(meta, indent=2))
    log.info(f"✅ Saved model metadata → {meta_path}")

    # Save comparative report
    report = {
        "results": results,
        "champion": champion,
        "test_set_size": int(len(X_test)),
        "train_set_size": int(len(X_train)),
        "feature_count": int(X.shape[1]),
    }
    report_path = output_dir / "report.json"
    report_path.write_text(json.dumps(report, indent=2))
    log.info(f"✅ Saved comparison report → {report_path}")

    # Print final table
    print("\n" + "="*70)
    print(f"{'Model':<30} {'Acc':>6} {'F1':>6} {'Kappa':>6} {'MAE':>6} {'Score':>7}")
    print("-"*70)
    for r in sorted(results, key=lambda x: -x["champion_score"]):
        marker = " 🏆" if r["model"] == champion["model"] else ""
        print(
            f"{r['model']:<30} {r['accuracy']:>6.4f} {r['macro_f1']:>6.4f}"
            f" {r['quadratic_kappa']:>6.4f} {r['mae']:>6.4f} {r['champion_score']:>7.4f}{marker}"
        )
    print("="*70)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--features", type=Path, default=Path("data/features.parquet"))
    parser.add_argument("--output-dir", type=Path, default=Path("models/"))
    args = parser.parse_args()
    train(args.features, args.output_dir)


if __name__ == "__main__":
    main()
