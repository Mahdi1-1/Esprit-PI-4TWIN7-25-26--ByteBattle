from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, cohen_kappa_score, mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier, XGBRegressor

try:
    from pipeline.recommender import ChallengeRecommender, tags_text
except ModuleNotFoundError:
    from recommender import ChallengeRecommender, tags_text


SKILL_NAMES = [
    "algo",
    "data_structures",
    "dynamic_programming",
    "graphs",
    "debugging",
    "clean_code",
    "speed",
]

HINT_GAIN_WEIGHTS = {
    1: 1.0,
    2: 0.8,
    3: 0.6,
    4: 0.4,
    5: 0.2,
}


@dataclass
class TrainingArtifacts:
    m1: Any
    m2: Any
    m3: Any
    m4: Any
    feature_columns: list[str]
    m3_target_columns: list[str]


def _safe_json_loads(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(v) for v in value]
    if not isinstance(value, str) or not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(v) for v in parsed]
    except json.JSONDecodeError:
        pass
    return []


def _tags_text(value: Any) -> str:
    return tags_text(value)


def _build_m2_features(df: pd.DataFrame) -> pd.DataFrame:
    feat = pd.DataFrame()
    feat["cf_rating"] = df["cf_rating"].astype(float)
    feat["minutes_stuck"] = df["minutes_stuck"].astype(float)
    feat["attempts_count"] = df["attempts_count"].astype(float)
    feat["last_hint_level"] = df["last_hint_level"].astype(float)
    feat["difficulty"] = df["difficulty"].astype(float)
    feat["code_lines"] = df.get("code_lines", 40).astype(float)
    feat["tags_text"] = df["challenge_tags"].apply(_tags_text)
    return feat


def _build_m1_target(df: pd.DataFrame) -> np.ndarray:
    return (df["target_level"].astype(int) >= 3).astype(int).to_numpy()


def _build_sample_weights(df: pd.DataFrame, alpha: float) -> np.ndarray:
    is_synth = df["is_synthetic"].astype(bool).to_numpy()
    return np.where(is_synth, alpha, 1.0)


def _skill_delta_targets(df: pd.DataFrame) -> pd.DataFrame:
    n = len(df)
    out = pd.DataFrame(index=df.index)

    tags = df["challenge_tags"].apply(_safe_json_loads)
    solved = (df["target_level"].astype(int) <= 2).astype(float)
    hint_weight = df["target_level"].astype(int).map(HINT_GAIN_WEIGHTS).astype(float)

    base_gain = 0.7 + 0.6 * solved
    weighted_gain = base_gain * hint_weight

    def has_tag(tag_list: list[str], *keys: str) -> float:
        text = " ".join(tag_list).lower()
        return 1.0 if any(k in text for k in keys) else 0.0

    algo_sig = np.array([has_tag(t, "implementation", "greedy", "math") for t in tags], dtype=float)
    ds_sig = np.array([has_tag(t, "data structures", "sort", "heap", "tree", "hash") for t in tags], dtype=float)
    dp_sig = np.array([has_tag(t, "dp", "dynamic") for t in tags], dtype=float)
    graph_sig = np.array([has_tag(t, "graph", "dfs", "bfs", "shortest paths") for t in tags], dtype=float)
    debug_sig = np.clip(df["attempts_count"].astype(float).to_numpy() / 7.0, 0.0, 1.0)
    clean_sig = np.clip(np.log1p(df.get("code_lines", pd.Series(np.full(n, 40))).astype(float).to_numpy()) / 6.0, 0.0, 1.0)
    speed_sig = np.clip(1.0 - (df["minutes_stuck"].astype(float).to_numpy() / 120.0), 0.0, 1.0)

    out["skill_algo"] = weighted_gain * (0.5 + 0.5 * algo_sig)
    out["skill_ds"] = weighted_gain * (0.5 + 0.5 * ds_sig)
    out["skill_dp"] = weighted_gain * (0.4 + 0.6 * dp_sig)
    out["skill_graph"] = weighted_gain * (0.4 + 0.6 * graph_sig)
    out["skill_debug"] = weighted_gain * (0.3 + 0.7 * debug_sig)
    out["skill_clean_code"] = weighted_gain * (0.4 + 0.6 * clean_sig)
    out["skill_speed"] = weighted_gain * (0.4 + 0.6 * speed_sig)

    return out


def _fit_m1(X_train: pd.DataFrame, y_train: np.ndarray, sample_weight: np.ndarray) -> Pipeline:
    num_cols = ["cf_rating", "minutes_stuck", "attempts_count", "last_hint_level", "difficulty", "code_lines"]
    pre = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("txt", TfidfVectorizer(token_pattern=r"[^ ]+"), "tags_text"),
        ]
    )

    clf = XGBClassifier(
        objective="binary:logistic",
        n_estimators=260,
        max_depth=5,
        learning_rate=0.06,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )

    pipe = Pipeline([("pre", pre), ("clf", clf)])
    pipe.fit(X_train, y_train, clf__sample_weight=sample_weight)
    return pipe


def _fit_m2(X_train: pd.DataFrame, y_train: np.ndarray, sample_weight: np.ndarray) -> Pipeline:
    num_cols = ["cf_rating", "minutes_stuck", "attempts_count", "last_hint_level", "difficulty", "code_lines"]
    pre = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("txt", TfidfVectorizer(token_pattern=r"[^ ]+"), "tags_text"),
        ]
    )

    clf = XGBClassifier(
        objective="multi:softprob",
        num_class=5,
        n_estimators=320,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    )

    pipe = Pipeline([("pre", pre), ("clf", clf)])
    pipe.fit(X_train, y_train - 1, clf__sample_weight=sample_weight)
    return pipe


def _fit_m3(
    X_train: pd.DataFrame,
    y_train: pd.DataFrame,
    sample_weight: np.ndarray,
) -> Pipeline:
    num_cols = ["cf_rating", "minutes_stuck", "attempts_count", "last_hint_level", "difficulty", "code_lines"]
    pre = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("txt", TfidfVectorizer(token_pattern=r"[^ ]+"), "tags_text"),
        ]
    )

    reg = MultiOutputRegressor(
        XGBRegressor(
            objective="reg:squarederror",
            n_estimators=220,
            max_depth=5,
            learning_rate=0.06,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=42,
            n_jobs=-1,
        )
    )

    pipe = Pipeline([("pre", pre), ("reg", reg)])
    pipe.fit(X_train, y_train, reg__sample_weight=sample_weight)
    return pipe


def train_pipeline(
    sessions_path: Path,
    metadata_path: Path,
    output_dir: Path,
    synthetic_alpha: float,
) -> dict[str, Any]:
    sessions_df = pd.read_parquet(sessions_path)
    metadata_df = pd.read_parquet(metadata_path)

    required_cols = {
        "user_id",
        "challenge_id",
        "difficulty",
        "cf_rating",
        "minutes_stuck",
        "attempts_count",
        "last_hint_level",
        "is_synthetic",
        "target_level",
    }
    missing = required_cols - set(sessions_df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    m2_features = _build_m2_features(sessions_df)
    y_m1 = _build_m1_target(sessions_df)
    y_m2 = sessions_df["target_level"].astype(int).to_numpy()
    y_m3 = _skill_delta_targets(sessions_df)
    weights = _build_sample_weights(sessions_df, alpha=synthetic_alpha)

    idx = np.arange(len(sessions_df))
    idx_train, idx_test = train_test_split(
        idx,
        test_size=0.2,
        stratify=y_m2,
        random_state=42,
    )

    X_train = m2_features.iloc[idx_train]
    X_test = m2_features.iloc[idx_test]

    m1 = _fit_m1(X_train, y_m1[idx_train], sample_weight=weights[idx_train])
    m2 = _fit_m2(X_train, y_m2[idx_train], sample_weight=weights[idx_train])
    m3 = _fit_m3(X_train, y_m3.iloc[idx_train], sample_weight=weights[idx_train])

    m1_pred = m1.predict(X_test)
    m1_acc = float(accuracy_score(y_m1[idx_test], m1_pred))

    m2_pred_raw = m2.predict(X_test)
    m2_pred = m2_pred_raw.astype(int) + 1
    m2_qwk = float(cohen_kappa_score(y_m2[idx_test], m2_pred, weights="quadratic"))

    m3_pred = m3.predict(X_test)
    m3_mae = float(mean_absolute_error(y_m3.iloc[idx_test].to_numpy(), m3_pred))

    m4 = ChallengeRecommender().fit(metadata_df)

    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(m1, output_dir / "m1_submission_predictor.pkl")
    joblib.dump(m2, output_dir / "m2_hint_model.pkl")
    joblib.dump(m3, output_dir / "m3_skill_scorer.pkl")
    joblib.dump(m4, output_dir / "m4_challenge_recommender.pkl")

    report = {
        "metrics": {
            "m1_accuracy": round(m1_acc, 6),
            "m2_quadratic_weighted_kappa": round(m2_qwk, 6),
            "m3_mae": round(m3_mae, 6),
        },
        "split": {
            "train_size": int(len(idx_train)),
            "test_size": int(len(idx_test)),
            "stratified_on": "target_level",
        },
        "sample_weighting": {
            "real_weight": 1.0,
            "synthetic_weight": synthetic_alpha,
        },
        "feature_columns": list(m2_features.columns),
        "m3_target_columns": list(y_m3.columns),
    }

    (output_dir / "training_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Train 4-model intelligence engine")
    parser.add_argument("--sessions", type=Path, default=Path("data/hybrid_sessions.parquet"))
    parser.add_argument("--metadata", type=Path, default=Path("data/challenges_metadata.parquet"))
    parser.add_argument("--output-dir", type=Path, default=Path("models/intelligence_engine"))
    parser.add_argument("--synthetic-alpha", type=float, default=0.3)
    args = parser.parse_args()

    report = train_pipeline(
        sessions_path=args.sessions,
        metadata_path=args.metadata,
        output_dir=args.output_dir,
        synthetic_alpha=args.synthetic_alpha,
    )

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
