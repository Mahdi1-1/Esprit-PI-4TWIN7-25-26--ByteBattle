from __future__ import annotations

import argparse
import hashlib
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


DIFFICULTY_MAP = {
    0: 800,
    1: 900,
    2: 1300,
    3: 1700,
    4: 2100,
    5: 2500,
}


@dataclass
class ChallengeMeta:
    challenge_id: str
    challenge_name: str
    difficulty: int
    cf_rating: int
    tags: list[str]
    code_lines: int


def _stable_id(name: str) -> str:
    return hashlib.sha1(name.encode("utf-8")).hexdigest()


def _extract_challenges(max_problems: int, seed: int) -> list[ChallengeMeta]:
    from datasets import load_dataset

    ds = load_dataset(
        "deepmind/code_contests",
        split="train",
        streaming=True,
        trust_remote_code=True,
    )

    challenges: list[ChallengeMeta] = []
    seen: set[str] = set()
    rng = np.random.default_rng(seed)

    for record in ds:
        if max_problems and len(challenges) >= max_problems:
            break

        name = str(record.get("name", "")).strip()
        if not name or name in seen:
            continue

        seen.add(name)
        difficulty_enum = int(record.get("difficulty", 0) or 0)
        cf_rating = int(record.get("cf_rating") or DIFFICULTY_MAP.get(difficulty_enum, 1000))
        cf_rating = int(np.clip(cf_rating, 700, 3500))

        tags_raw = record.get("cf_tags", []) or []
        tags = [str(t).strip() for t in tags_raw if isinstance(t, str) and str(t).strip()]

        solutions = record.get("solutions", {}) or {}
        sol_codes = solutions.get("solution", []) if isinstance(solutions, dict) else []
        if sol_codes:
            shortest = min(sol_codes, key=lambda code: len(str(code)))
            code_lines = max(1, len(str(shortest).splitlines()))
        else:
            code_lines = int(rng.integers(20, 180))

        challenges.append(
            ChallengeMeta(
                challenge_id=_stable_id(name),
                challenge_name=name,
                difficulty=difficulty_enum,
                cf_rating=cf_rating,
                tags=tags,
                code_lines=code_lines,
            )
        )

    return challenges


def _irt_success_probability(theta: float, beta: float) -> float:
    return 1.0 / (1.0 + math.exp(-(theta - beta)))


def _difficulty_to_beta(cf_rating: int) -> float:
    return (cf_rating - 1500.0) / 400.0


def _target_level(success: bool, minutes_stuck: float, attempts_count: int, gap: float) -> int:
    score = 0.0
    score += max(0.0, gap) * 1.1
    score += max(0.0, minutes_stuck - 10.0) / 18.0
    score += max(0, attempts_count - 1) * 0.55
    if not success:
        score += 1.1

    if score < 1.2:
        return 1
    if score < 2.2:
        return 2
    if score < 3.2:
        return 3
    if score < 4.3:
        return 4
    return 5


def _sample_last_hint_level(target_level: int, rng: np.random.Generator) -> int:
    low = max(0, target_level - 2)
    high = max(low + 1, target_level)
    return int(rng.integers(low, high + 1))


def _simulate_user_rows(
    challenges: list[ChallengeMeta],
    n_users: int,
    sessions_per_user: int,
    outlier_ratio: float,
    seed: int,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows: list[dict[str, Any]] = []

    user_skills = rng.normal(loc=0.0, scale=1.0, size=n_users)

    for user_idx in range(n_users):
        theta = float(user_skills[user_idx])
        user_id = f"u_{user_idx:06d}"

        for _ in range(sessions_per_user):
            challenge = challenges[int(rng.integers(0, len(challenges)))]
            beta = _difficulty_to_beta(challenge.cf_rating)
            p_success = _irt_success_probability(theta, beta)
            success = bool(rng.random() < p_success)

            gap = beta - theta

            minutes_mu = 9.0 + max(0.0, gap) * 18.0 + max(0, challenge.code_lines - 40) * 0.07
            minutes_sigma = max(3.0, minutes_mu * 0.35)
            minutes_stuck = float(rng.normal(minutes_mu, minutes_sigma))
            minutes_stuck = float(np.clip(minutes_stuck, 1.0, 240.0))

            attempts_mu = 1.4 + max(0.0, gap) * 2.0 + (0.8 if not success else 0.0)
            attempts_sigma = 0.7 + attempts_mu * 0.25
            attempts_count = int(np.round(rng.normal(attempts_mu, attempts_sigma)))
            attempts_count = int(np.clip(attempts_count, 1, 15))

            target_level = _target_level(success, minutes_stuck, attempts_count, gap)
            last_hint_level = _sample_last_hint_level(target_level, rng)

            rows.append(
                {
                    "user_id": user_id,
                    "challenge_id": challenge.challenge_id,
                    "challenge_name": challenge.challenge_name,
                    "difficulty": challenge.difficulty,
                    "cf_rating": challenge.cf_rating,
                    "code_lines": challenge.code_lines,
                    "challenge_tags": json.dumps(challenge.tags),
                    "minutes_stuck": float(round(minutes_stuck, 3)),
                    "attempts_count": attempts_count,
                    "last_hint_level": last_hint_level,
                    "is_synthetic": True,
                    "target_level": target_level,
                    "irt_theta": round(theta, 5),
                    "irt_beta": round(beta, 5),
                    "sim_success": int(success),
                }
            )

    df = pd.DataFrame(rows)

    outlier_count = int(len(df) * outlier_ratio)
    if outlier_count > 0:
        outlier_idx = rng.choice(df.index.to_numpy(), size=outlier_count, replace=False)
        for idx in outlier_idx:
            theta = float(df.at[idx, "irt_theta"])
            beta = float(df.at[idx, "irt_beta"])
            hard_gap = beta - theta

            if theta > 0.8:
                df.at[idx, "minutes_stuck"] = float(np.clip(rng.normal(58.0, 12.0), 20.0, 220.0))
                df.at[idx, "attempts_count"] = int(np.clip(int(rng.normal(8.5, 2.2)), 4, 15))
                df.at[idx, "target_level"] = int(rng.choice([4, 5], p=[0.35, 0.65]))
                df.at[idx, "sim_success"] = 0
            elif theta < -0.8 and hard_gap > 0.5:
                df.at[idx, "minutes_stuck"] = float(np.clip(rng.normal(6.0, 2.0), 1.0, 20.0))
                df.at[idx, "attempts_count"] = int(np.clip(int(rng.normal(1.2, 0.6)), 1, 4))
                df.at[idx, "target_level"] = int(rng.choice([1, 2], p=[0.7, 0.3]))
                df.at[idx, "sim_success"] = 1
            else:
                df.at[idx, "minutes_stuck"] = float(np.clip(rng.normal(35.0, 18.0), 2.0, 240.0))
                df.at[idx, "attempts_count"] = int(np.clip(int(rng.normal(5.5, 2.5)), 1, 15))
                df.at[idx, "target_level"] = int(np.clip(int(rng.normal(3.2, 1.4)), 1, 5))
                df.at[idx, "sim_success"] = int(rng.random() < 0.5)

    df["is_outlier"] = False
    if outlier_count > 0:
        df.loc[outlier_idx, "is_outlier"] = True

    return df


def generate_hybrid_data(
    output_path: Path,
    metadata_output_path: Path,
    max_problems: int,
    n_users: int,
    sessions_per_user: int,
    outlier_ratio: float,
    seed: int,
) -> tuple[Path, Path]:
    challenges = _extract_challenges(max_problems=max_problems, seed=seed)
    if not challenges:
        raise RuntimeError("No challenges extracted from deepmind/code_contests")

    metadata_rows = [
        {
            "challenge_id": c.challenge_id,
            "challenge_name": c.challenge_name,
            "difficulty": c.difficulty,
            "cf_rating": c.cf_rating,
            "code_lines": c.code_lines,
            "challenge_tags": json.dumps(c.tags),
        }
        for c in challenges
    ]
    metadata_df = pd.DataFrame(metadata_rows)

    hybrid_df = _simulate_user_rows(
        challenges=challenges,
        n_users=n_users,
        sessions_per_user=sessions_per_user,
        outlier_ratio=outlier_ratio,
        seed=seed,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_output_path.parent.mkdir(parents=True, exist_ok=True)

    hybrid_df.to_parquet(output_path, index=False)
    metadata_df.to_parquet(metadata_output_path, index=False)

    return output_path, metadata_output_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate IRT-based hybrid session data")
    parser.add_argument("--output", type=Path, default=Path("data/hybrid_sessions.parquet"))
    parser.add_argument("--metadata-output", type=Path, default=Path("data/challenges_metadata.parquet"))
    parser.add_argument("--max-problems", type=int, default=2500)
    parser.add_argument("--n-users", type=int, default=1200)
    parser.add_argument("--sessions-per-user", type=int, default=8)
    parser.add_argument("--outlier-ratio", type=float, default=0.10)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    output_path, metadata_path = generate_hybrid_data(
        output_path=args.output,
        metadata_output_path=args.metadata_output,
        max_problems=args.max_problems,
        n_users=args.n_users,
        sessions_per_user=args.sessions_per_user,
        outlier_ratio=args.outlier_ratio,
        seed=args.seed,
    )

    print(f"Saved hybrid sessions: {output_path}")
    print(f"Saved challenge metadata: {metadata_path}")


if __name__ == "__main__":
    main()
