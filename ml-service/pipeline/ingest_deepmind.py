"""
Step 1 – INGEST
================
Reads deepmind/code_contests (streaming) and transforms each record into
one or more raw_events (one per unique language solution) written as
newline-delimited JSON (JSONL) in append-only mode.

Usage:
    python pipeline/ingest_deepmind.py --max-problems 5000 --output data/raw_events.jsonl

The event schema (strict):
{
    "event_id":          str,        # sha1(problem_name + sol_idx)
    "problem_name":      str,
    "difficulty":        int,        # cf_rating or mapped from difficulty enum
    "cf_tags":           list[str],  # raw tag list
    "language":          str,        # "PYTHON3" | "CPP" | "JAVA" | ...
    "code_length":       int,        # len(solution code)
    "solution_lines":    int,        # line count of solution
    "wrong_answer_count":int,        # simulated from incorrect_solutions
    "time_limit_ms":     int,
    "memory_limit_bytes":int,
    "target_level":      int,        # 1-5, derived from heuristics
    "solution_snippet":  str,        # first 30% of the solution (for Hint L4)
    "solution_full":     str,        # full best solution (for Hint L5)
    "ts":                str         # ISO-8601
}
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from tqdm import tqdm

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
# difficulty enum → numeric rating proxy  (deepmind dataset uses 0-based enum)
_DIFFICULTY_MAP = {
    0: 800,    # UNKNOWN  → treat as easy
    1: 800,    # EASY
    2: 1300,   # MEDIUM
    3: 1700,   # HARD
    4: 2100,   # HARDER
    5: 2600,   # HARDEST
}

# language enum → human name
_LANG_MAP = {
    0: "UNKNOWN",
    1: "CPP",
    2: "PYTHON2",
    3: "PYTHON3",
    4: "JAVA",
}

# target_level heuristics (based on code length + wrong_answer_count)
#   Level 1 = Concept hint
#   Level 2 = Strategy hint
#   Level 3 = Pseudo-code
#   Level 4 = 30% snippet
#   Level 5 = Full solution
def _compute_target_level(
    code_length: int,
    wrong_answer_count: int,
    cf_rating: int,
) -> int:
    """
    Simulates the hint level a user would need based on:
    - How long the solution is (proxy for complexity)
    - How many wrong attempts exist (proxy for difficulty encountered)
    - The cf_rating of the problem
    """
    level = 1

    # Complexity signal: longer code → needs more guidance
    if code_length > 200:
        level += 1
    if code_length > 500:
        level += 1

    # Difficulty signal: hard problems → higher level needed
    if cf_rating >= 1700:
        level += 1
    if cf_rating >= 2200:
        level += 1  # push toward full solution

    # Wrong answer signal: more failures → need more help
    if wrong_answer_count >= 3:
        level = min(level + 1, 5)
    if wrong_answer_count >= 8:
        level = 5  # clearly stuck — show full solution

    return max(1, min(5, level))


def _snippet_30pct(code: str) -> str:
    """Returns the first 30% of lines of a solution."""
    lines = code.splitlines()
    cutoff = max(1, int(len(lines) * 0.30))
    return "\n".join(lines[:cutoff])


def _event_id(problem_name: str, sol_idx: int) -> str:
    raw = f"{problem_name}::sol{sol_idx}"
    return hashlib.sha1(raw.encode()).hexdigest()


def _parse_solutions(record: dict[str, Any]) -> list[dict]:
    """
    Extracts correct solutions and picks the best one per language.
    Returns list of dicts: {language, code, code_length, solution_lines}
    """
    solutions_struct = record.get("solutions", {})
    # HuggingFace dataset stores this as dict with keys 'solution' and 'language'
    # After streaming: solutions = {'solution': [...], 'language': [...]}
    solution_list = solutions_struct.get("solution", []) if isinstance(solutions_struct, dict) else []
    language_list = solutions_struct.get("language", []) if isinstance(solutions_struct, dict) else []

    # Group by language, keep shortest (often cleanest)
    by_lang: dict[str, str] = {}
    for code, lang_id in zip(solution_list, language_list):
        lang = _LANG_MAP.get(lang_id, "UNKNOWN")
        if lang not in by_lang or len(code) < len(by_lang[lang]):
            by_lang[lang] = code

    result = []
    for lang, code in by_lang.items():
        if not code.strip():
            continue
        result.append({
            "language": lang,
            "code": code,
            "code_length": len(code),
            "solution_lines": len(code.splitlines()),
        })
    return result


def _count_wrong_answers(record: dict[str, Any]) -> int:
    """Counts total incorrect solutions as proxy for difficulty."""
    inc = record.get("incorrect_solutions", {})
    if isinstance(inc, dict):
        return len(inc.get("solution", []))
    return 0


def _stream_records(max_problems: int) -> Iterator[dict]:
    """Lazy-loads deepmind/code_contests from HuggingFace hub."""
    from datasets import load_dataset  # deferred import
    log.info("Loading deepmind/code_contests (streaming=True, split=train)…")
    ds = load_dataset(
        "deepmind/code_contests",
        split="train",
        streaming=True,
        trust_remote_code=True,
    )
    count = 0
    for record in ds:
        if max_problems and count >= max_problems:
            break
        yield record
        count += 1


def ingest(max_problems: int, output_path: Path) -> int:
    """Main ingestion loop. Returns total events written."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    ts_now = datetime.now(timezone.utc).isoformat()

    written = 0
    skipped = 0

    with output_path.open("a", encoding="utf-8") as fout:
        for record in tqdm(_stream_records(max_problems), desc="Ingesting problems", unit="prob"):
            name = record.get("name", "")
            if not name:
                skipped += 1
                continue

            # --- Problem-level fields ---
            difficulty_enum = record.get("difficulty", 0)
            cf_rating = record.get("cf_rating") or _DIFFICULTY_MAP.get(difficulty_enum, 800)
            if not isinstance(cf_rating, int) or cf_rating <= 0:
                cf_rating = _DIFFICULTY_MAP.get(difficulty_enum, 800)

            cf_tags_raw = record.get("cf_tags", []) or []
            cf_tags = [t for t in cf_tags_raw if isinstance(t, str) and t.strip()]

            time_limit_ms = int((record.get("time_limit", {}) or {}).get("seconds", 2) * 1000)
            memory_limit_bytes = int(record.get("memory_limit_bytes", 256 * 1024 * 1024) or 0)
            wrong_answer_count = _count_wrong_answers(record)

            # --- Per-solution events ---
            solutions = _parse_solutions(record)

            # Pick the best solution overall (shortest Python, else shortest)
            best_solution = next(
                (s for s in sorted(solutions, key=lambda x: x["code_length"]) if s["language"] in ("PYTHON3", "PYTHON2")),
                (sorted(solutions, key=lambda x: x["code_length"])[0] if solutions else None),
            )

            if not solutions:
                skipped += 1
                continue

            for idx, sol in enumerate(solutions):
                target_level = _compute_target_level(
                    sol["code_length"], wrong_answer_count, cf_rating
                )

                event: dict[str, Any] = {
                    "event_id": _event_id(name, idx),
                    "problem_name": name,
                    "difficulty": cf_rating,
                    "cf_tags": cf_tags,
                    "language": sol["language"],
                    "code_length": sol["code_length"],
                    "solution_lines": sol["solution_lines"],
                    "wrong_answer_count": wrong_answer_count,
                    "time_limit_ms": time_limit_ms,
                    "memory_limit_bytes": memory_limit_bytes,
                    "target_level": target_level,
                    "solution_snippet": _snippet_30pct(sol["code"]),
                    "solution_full": best_solution["code"] if best_solution else sol["code"],
                    "ts": ts_now,
                }
                fout.write(json.dumps(event, ensure_ascii=False) + "\n")
                written += 1

    log.info(f"✅ Ingestion complete — wrote {written} events, skipped {skipped} records.")
    return written


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Ingest deepmind/code_contests → raw_events.jsonl")
    parser.add_argument("--max-problems", type=int, default=3000,
                        help="Max problems to load (0=all). Default: 3000")
    parser.add_argument("--output", type=Path,
                        default=Path("data/raw_events.jsonl"),
                        help="Output JSONL path (append-only)")
    args = parser.parse_args()
    ingest(args.max_problems, args.output)


if __name__ == "__main__":
    main()
