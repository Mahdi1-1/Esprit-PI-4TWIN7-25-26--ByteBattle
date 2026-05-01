from __future__ import annotations

import json
from typing import Any

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer


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


def tags_text(value: Any) -> str:
    tags = _safe_json_loads(value)
    return " ".join(tags)


class ChallengeRecommender:
    def __init__(self) -> None:
        self.challenge_df: pd.DataFrame | None = None
        self.vectorizer = TfidfVectorizer(token_pattern=r"[^,]+")
        self.tag_matrix = None

    def fit(self, challenge_df: pd.DataFrame) -> "ChallengeRecommender":
        df = challenge_df.drop_duplicates(subset=["challenge_id"]).copy()
        df["challenge_tags"] = df["challenge_tags"].fillna("[]")
        df["tags_text"] = df["challenge_tags"].apply(tags_text)
        self.tag_matrix = self.vectorizer.fit_transform(df["tags_text"])
        self.challenge_df = df.reset_index(drop=True)
        return self

    def recommend(
        self,
        user_skill_score: float,
        weak_tags: list[str],
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        if self.challenge_df is None or self.tag_matrix is None:
            return []

        target_rating = float(np.clip(user_skill_score * 1.15, 700, 3500))
        user_tag_text = " ".join(weak_tags) if weak_tags else "implementation"
        user_tag_vec = self.vectorizer.transform([user_tag_text])

        tag_scores = (self.tag_matrix @ user_tag_vec.T).toarray().ravel()
        rating_gap = np.abs(self.challenge_df["cf_rating"].to_numpy(dtype=float) - target_rating)
        rating_score = np.exp(-rating_gap / 350.0)

        final_score = 0.65 * tag_scores + 0.35 * rating_score
        best_idx = np.argsort(-final_score)[:top_k]

        results: list[dict[str, Any]] = []
        for idx in best_idx:
            row = self.challenge_df.iloc[int(idx)]
            results.append(
                {
                    "challenge_id": str(row["challenge_id"]),
                    "challenge_name": str(row.get("challenge_name", "")),
                    "cf_rating": int(row["cf_rating"]),
                    "score": float(final_score[int(idx)]),
                }
            )
        return results
