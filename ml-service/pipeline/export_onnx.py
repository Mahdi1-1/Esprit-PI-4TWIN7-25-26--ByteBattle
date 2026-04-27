"""
Step 5 – DEPLOY (ONNX Export)
==============================
Converts the champion sklearn/xgboost model to ONNX format for production serving.
The pkl model is also kept as primary fallback.

Usage:
    python pipeline/export_onnx.py --model-dir models/ --features data/features.parquet
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from pipeline.model_utils import XGBoostWrapper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


def export_onnx(model_dir: Path, features_path: Path) -> None:
    meta_path = model_dir / "model_meta.json"
    model_path = model_dir / "champion_model.pkl"

    meta = json.loads(meta_path.read_text())
    champion_name = meta["champion"]
    feature_cols = meta["feature_cols"]

    log.info(f"Champion model: {champion_name}")

    model = joblib.load(model_path)

    # Load sample data to infer input shape
    if features_path.suffix == ".parquet":
        df = pd.read_parquet(features_path)
    else:
        df = pd.read_csv(features_path)

    X_sample = df[feature_cols].fillna(0).values[:10].astype(np.float32)

    onnx_path = model_dir / "champion_model.onnx"

    try:
        if champion_name == "XGBoost":
            from onnxmltools import convert_xgboost
            from onnxmltools.convert.common.data_types import FloatTensorType
            initial_types = [("float_input", FloatTensorType([None, X_sample.shape[1]]))]
            # Get the underlying booster (unwrap shifted predict)
            raw_model = joblib.load(model_path)
            onnx_model = convert_xgboost(raw_model, initial_types=initial_types)
        else:
            from skl2onnx import convert_sklearn
            from skl2onnx.common.data_types import FloatTensorType
            initial_type = [("float_input", FloatTensorType([None, X_sample.shape[1]]))]
            onnx_model = convert_sklearn(model, initial_types=initial_type)

        with open(onnx_path, "wb") as f:
            f.write(onnx_model.SerializeToString())

        log.info(f"✅ ONNX model exported → {onnx_path}")

        # Verify
        import onnxruntime as ort
        sess = ort.InferenceSession(str(onnx_path))
        input_name = sess.get_inputs()[0].name
        pred = sess.run(None, {input_name: X_sample})
        log.info(f"✅ ONNX inference verified — sample predictions: {pred[0][:5]}")

    except Exception as e:
        log.warning(f"⚠️  ONNX export failed ({e}). PKL model will be used in production.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", type=Path, default=Path("models/"))
    parser.add_argument("--features", type=Path, default=Path("data/features.parquet"))
    args = parser.parse_args()
    export_onnx(args.model_dir, args.features)


if __name__ == "__main__":
    main()
