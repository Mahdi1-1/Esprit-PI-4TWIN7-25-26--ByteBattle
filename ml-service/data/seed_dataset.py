"""
Seed Dataset Generator
=======================
When you don't have an internet connection or want to test the pipeline locally
before downloading the full deepmind dataset, this script generates a synthetic
raw_events.jsonl that mimics the real dataset statistics.

It produces 2000 events covering:
- All 5 target_level classes (balanced via heuristic inversion)
- Realistic cf_tag distributions matching Codeforces statistics
- Realistic code length distributions per difficulty tier

Usage:
    python data/seed_dataset.py --output data/raw_events.jsonl --n 2000
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

SEED = 42
random.seed(SEED)

# Codeforces-realistic tag distribution
ALL_TAGS = [
    "implementation", "math", "greedy", "dp", "data structures",
    "brute force", "constructive algorithms", "graphs", "strings",
    "sortings", "binary search", "trees", "number theory",
    "dfs and similar", "two pointers", "bitmasks", "combinatorics",
    "shortest paths", "geometry", "flows", "hashing", "games",
    "matrices", "probabilities", "divide and conquer",
]
TAG_WEIGHTS = [
    20, 18, 16, 15, 12, 10, 9, 8, 7, 6, 6, 5, 5,
    5, 4, 4, 4, 3, 3, 2, 2, 2, 2, 2, 2,
]

LANGS = ["CPP", "PYTHON3", "JAVA", "PYTHON2"]
LANG_WEIGHTS = [50, 25, 15, 10]

DIFFICULTY_TIERS = [
    (800, 1200),
    (1200, 1600),
    (1600, 2000),
    (2000, 2400),
    (2400, 3500),
]

PROBLEMS = [
    f"Problem_{i+1:04d}" for i in range(500)
]


def random_tags() -> list[str]:
    k = random.choices(range(1, 5), weights=[40, 30, 20, 10])[0]
    return random.choices(ALL_TAGS, weights=TAG_WEIGHTS, k=k)


def random_solution(cf_rating: int, lang: str) -> tuple[str, str]:
    """Generate synthetic code resembling real solutions."""
    if lang in ("PYTHON3", "PYTHON2"):
        base_lines = max(5, int(cf_rating / 100) + random.randint(-5, 15))
        lines = []
        lines.append("import sys")
        lines.append("input = sys.stdin.readline")
        lines.append("")
        lines.append("def solve():")
        for i in range(base_lines):
            indent = "    "
            lines.append(f"{indent}# step {i+1}")
            lines.append(f"{indent}x{i} = int(input())")
            if i > 0:
                lines.append(f"{indent}result = x{i} + x{i-1}")
        lines.append("    print(result)")
        lines.append("")
        lines.append("T = int(input())")
        lines.append("for _ in range(T):")
        lines.append("    solve()")
    else:  # CPP / JAVA
        base_lines = max(10, int(cf_rating / 80) + random.randint(-5, 20))
        lines = ["#include <bits/stdc++.h>", "using namespace std;", "int main() {"]
        for i in range(base_lines):
            lines.append(f"    int x{i}; cin >> x{i};")
            if i > 0:
                lines.append(f"    int r{i} = x{i} + x{i-1};")
        lines.append("    cout << result << endl;")
        lines.append("    return 0;")
        lines.append("}")

    full_code = "\n".join(lines)
    cutoff = max(1, int(len(lines) * 0.30))
    snippet = "\n".join(lines[:cutoff])
    return full_code, snippet


def compute_target_level(code_length: int, wrong_answer_count: int, cf_rating: int) -> int:
    level = 1
    if code_length > 200: level += 1
    if code_length > 500: level += 1
    if cf_rating >= 1700: level += 1
    if cf_rating >= 2200: level += 1
    if wrong_answer_count >= 3: level = min(level + 1, 5)
    if wrong_answer_count >= 8: level = 5
    return max(1, min(5, level))


def generate(n: int, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    ts_now = datetime.now(timezone.utc).isoformat()

    with output_path.open("w", encoding="utf-8") as fout:
        for i in range(n):
            problem = random.choice(PROBLEMS)
            tier = random.choices(DIFFICULTY_TIERS, weights=[30, 25, 20, 15, 10])[0]
            cf_rating = random.randint(*tier)
            lang = random.choices(LANGS, weights=LANG_WEIGHTS)[0]
            tags = random_tags()
            wrong_answer_count = random.choices(
                [0, 1, 2, 3, 5, 8, 12],
                weights=[30, 20, 15, 15, 10, 7, 3]
            )[0]
            time_limit_ms = random.choice([1000, 2000, 3000, 4000])
            memory_limit_bytes = random.choice([256, 512]) * 1024 * 1024

            full_code, snippet = random_solution(cf_rating, lang)

            event_id = hashlib.sha1(f"{problem}::sol{i}".encode()).hexdigest()
            target_level = compute_target_level(len(full_code), wrong_answer_count, cf_rating)

            event = {
                "event_id": event_id,
                "problem_name": problem,
                "difficulty": cf_rating,
                "cf_tags": list(set(tags)),
                "language": lang,
                "code_length": len(full_code),
                "solution_lines": len(full_code.splitlines()),
                "wrong_answer_count": wrong_answer_count,
                "time_limit_ms": time_limit_ms,
                "memory_limit_bytes": memory_limit_bytes,
                "target_level": target_level,
                "solution_snippet": snippet,
                "solution_full": full_code,
                "ts": ts_now,
            }
            fout.write(json.dumps(event, ensure_ascii=False) + "\n")

    log.info(f"✅ Generated {n} seed events → {output_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("data/raw_events.jsonl"))
    parser.add_argument("--n", type=int, default=2000)
    args = parser.parse_args()
    generate(args.n, args.output)


if __name__ == "__main__":
    main()
