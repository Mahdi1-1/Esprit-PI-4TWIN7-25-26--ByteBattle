from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd


SKILL_ORDER = [
    "algo",
    "data_structures",
    "dynamic_programming",
    "graphs",
    "debugging",
    "clean_code",
    "speed",
]


@dataclass
class SessionTelemetry:
    user_id: str
    challenge_id: str
    challenge_name: str
    difficulty: int
    cf_rating: int
    minutes_stuck: float
    attempts_count: int
    last_hint_level: int
    challenge_tags: list[str]
    code_lines: int = 40


class IntelligenceOrchestrator:
    def __init__(self, model_dir: Path) -> None:
        # Compatibility layer for joblib artifacts saved with legacy module path "recommender".
        try:
            import pipeline.recommender as recommender_module

            sys.modules.setdefault("recommender", recommender_module)
        except ModuleNotFoundError:
            pass

        self.model_dir = model_dir
        self.m1 = joblib.load(model_dir / "m1_submission_predictor.pkl")
        self.m2 = joblib.load(model_dir / "m2_hint_model.pkl")
        self.m3 = joblib.load(model_dir / "m3_skill_scorer.pkl")
        self.m4 = joblib.load(model_dir / "m4_challenge_recommender.pkl")

    def _to_features(self, telemetry: SessionTelemetry) -> pd.DataFrame:
        return pd.DataFrame(
            [
                {
                    "cf_rating": float(telemetry.cf_rating),
                    "minutes_stuck": float(telemetry.minutes_stuck),
                    "attempts_count": float(telemetry.attempts_count),
                    "last_hint_level": float(telemetry.last_hint_level),
                    "difficulty": float(telemetry.difficulty),
                    "code_lines": float(telemetry.code_lines),
                    "tags_text": " ".join(telemetry.challenge_tags),
                }
            ]
        )

    def submit(self, telemetry: SessionTelemetry) -> dict[str, Any]:
        X = self._to_features(telemetry)

        proba = self.m1.predict_proba(X)[0]
        needs_help_prob = float(proba[1]) if len(proba) > 1 else float(proba[0])
        needs_help = bool(needs_help_prob >= 0.5)

        hint_level = 1
        hint_confidence = None
        if needs_help:
            level_probs = self.m2.predict_proba(X)[0]
            level_idx = int(np.argmax(level_probs))
            hint_level = level_idx + 1
            hint_confidence = float(level_probs[level_idx])

        return {
            "user_id": telemetry.user_id,
            "challenge_id": telemetry.challenge_id,
            "needs_help": needs_help,
            "needs_help_probability": needs_help_prob,
            "recommended_hint_level": int(hint_level),
            "hint_confidence": hint_confidence,
            "source": "intelligence_engine",
        }

    def get_hint(self, telemetry: SessionTelemetry, force_level: int | None = None) -> dict[str, Any]:
        submit_result = self.submit(telemetry)
        level = int(force_level if force_level is not None else submit_result["recommended_hint_level"])
        level = max(1, min(5, level))

        style_map = {
            1: "concept",
            2: "strategy",
            3: "pseudocode",
            4: "partial_snippet",
            5: "near_solution",
        }

        intensity_map = {
            1: "low",
            2: "medium",
            3: "medium",
            4: "high",
            5: "high",
        }

        timing = "now" if telemetry.attempts_count >= 2 or telemetry.minutes_stuck >= 10 else "wait"

        return {
            "user_id": telemetry.user_id,
            "challenge_id": telemetry.challenge_id,
            "level": level,
            "hint_style": style_map[level],
            "hint_intensity": intensity_map[level],
            "hint_timing": timing,
            "decision": submit_result,
        }

    def profile(
        self,
        telemetry: SessionTelemetry,
        current_skills: dict[str, float],
        top_k: int = 5,
    ) -> dict[str, Any]:
        X = self._to_features(telemetry)
        skill_delta = self.m3.predict(X)[0]

        updated_skills: dict[str, float] = {}
        for idx, name in enumerate(SKILL_ORDER):
            cur = float(current_skills.get(name, 0.0))
            nxt = cur + float(skill_delta[idx])
            updated_skills[name] = float(np.clip(nxt, 0.0, 100.0))

        weakest = sorted(updated_skills.items(), key=lambda kv: kv[1])[:3]
        weakest_tags = [w[0].replace("_", " ") for w in weakest]

        avg_skill = float(np.mean(list(updated_skills.values()))) if updated_skills else 0.0
        user_skill_rating = float(800.0 + avg_skill * 22.0)

        recommendations = self.m4.recommend(
            user_skill_score=user_skill_rating,
            weak_tags=weakest_tags,
            top_k=top_k,
        )

        return {
            "user_id": telemetry.user_id,
            "updated_skills": updated_skills,
            "weakest_tags": weakest_tags,
            "recommended_challenges": recommendations,
        }

    def predict_level_compat(self, telemetry: SessionTelemetry) -> dict[str, Any]:
        hint = self.get_hint(telemetry)
        return {
            "predicted_level": hint["level"],
            "model_used": "M1+M2",
            "hint_style": hint["hint_style"],
            "hint_intensity": hint["hint_intensity"],
            "hint_timing": hint["hint_timing"],
            "confidence": hint["decision"].get("hint_confidence"),
        }
