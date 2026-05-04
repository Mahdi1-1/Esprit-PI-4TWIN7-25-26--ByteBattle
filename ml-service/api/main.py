"""
Hint Server – FastAPI
======================
Serves progressive hints (5 levels) for problems from the deepmind dataset.
All inference is 100% local — no LLM calls.

Endpoints:
    GET  /health
    POST /predict-level   — predict what hint level a user needs
    POST /hint            — get full hint content for a given problem + level
    GET  /problem/{name}  — meta info for a problem
    GET  /problems        — list all indexed problem names
"""

from __future__ import annotations

import json
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from pipeline.model_utils import XGBoostWrapper
import __main__
setattr(__main__, 'XGBoostWrapper', XGBoostWrapper)

log = logging.getLogger("uvicorn.error")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent.parent
MODEL_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

FEATURES_PATH = DATA_DIR / "features.parquet"
if not FEATURES_PATH.exists():
    FEATURES_PATH = DATA_DIR / "features.csv"

MODEL_PATH = MODEL_DIR / "champion_model.pkl"
META_PATH = MODEL_DIR / "model_meta.json"

# Top tags (must match transform.py)
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

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ByteBattle Hint Service",
    description="Progressive 5-level hint system powered by deepmind/code_contests",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Model & data loading (lazy, cached)
# ---------------------------------------------------------------------------
@lru_cache(maxsize=1)
def load_model():
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model not found at {MODEL_PATH}. Run train.py first.")
    model = joblib.load(MODEL_PATH)
    meta = json.loads(META_PATH.read_text())
    log.info(f"✅ Loaded champion model: {meta['champion']}")
    return model, meta


@lru_cache(maxsize=1)
def load_problem_index() -> dict[str, dict]:
    """Loads features.parquet and indexes by problem_name."""
    if not FEATURES_PATH.exists():
        return {}

    if str(FEATURES_PATH).endswith(".parquet"):
        df = pd.read_parquet(FEATURES_PATH)
    else:
        df = pd.read_csv(FEATURES_PATH)

    index: dict[str, dict] = {}
    for _, row in df.iterrows():
        name = row.get("problem_name", "")
        if not name:
            continue
        if name not in index:
            # Keep the Python3 solution if available, else first
            index[name] = row.to_dict()
        elif row.get("language") in ("PYTHON3", "PYTHON2") and index[name].get("language") not in ("PYTHON3", "PYTHON2"):
            index[name] = row.to_dict()

    log.info(f"✅ Problem index loaded: {len(index)} problems")
    return index


# ---------------------------------------------------------------------------
# Hint text generators (100% local, rule-based on cf_tags)
# ---------------------------------------------------------------------------
def generate_hint_level1(cf_tags: list[str], problem_name: str) -> str:
    """Hint L1: Concept — identify the topic from tags."""
    if not cf_tags:
        return f"💡 Try to identify the key algorithmic concept for **{problem_name}**."
    tag_str = ", ".join(cf_tags[:3])
    return (
        f"💡 **Concept hint for '{problem_name}':**\n\n"
        f"This problem involves the following topics: **{tag_str}**.\n"
        f"Think about what data structures or algorithms typically solve problems tagged with these topics."
    )


def generate_hint_level2(cf_tags: list[str], difficulty: int) -> str:
    """Hint L2: Strategy — what approach to take."""
    approach_map = {
        "graphs": "Consider using BFS/DFS or a graph traversal approach. Build an adjacency list first.",
        "dp": "This calls for Dynamic Programming. Define your state carefully — what changes between subproblems?",
        "greedy": "A greedy strategy works here. Try to find a local decision rule that leads to a global optimum.",
        "math": "Focus on the mathematical properties. Look for patterns, modular arithmetic, or number theory.",
        "data structures": "Choose the right data structure (segment tree, heap, map) to efficiently track state.",
        "binary search": "The answer space is monotonic — binary search on the answer.",
        "strings": "Work with string hashing, KMP, or suffix arrays depending on the operations needed.",
        "two pointers": "Use two pointers to scan the array in O(n) without nested loops.",
        "constructive algorithms": "Build the answer incrementally — try to construct a valid solution step by step.",
        "implementation": "No clever trick needed — carefully simulate what the problem asks for.",
        "brute force": "The constraints are small enough — for each possibility, check if it satisfies the condition.",
    }

    for tag in cf_tags:
        if tag in approach_map:
            return f"🔍 **Strategy:**\n\n{approach_map[tag]}"

    diff_hint = "medium complexity" if difficulty < 1700 else "advanced technique"
    return f"🔍 **Strategy:** This requires a {diff_hint}. Break the problem into smaller subproblems."


def generate_hint_level3(cf_tags: list[str]) -> str:
    """Hint L3: Pseudo-code — high-level algorithm outline."""
    pseudo_map = {
        "graphs": (
            "```\n1. Read N nodes and M edges\n2. Build adjacency list\n"
            "3. BFS/DFS from source\n4. Track visited[] to avoid cycles\n"
            "5. Process each node's neighbors\n6. Return result\n```"
        ),
        "dp": (
            "```\n1. Define dp[i] = best answer considering first i elements\n"
            "2. Base case: dp[0] = initial value\n"
            "3. Transition: dp[i] = max/min(dp[i-1] + ..., dp[i-k] + ...)\n"
            "4. Return dp[n]\n```"
        ),
        "greedy": (
            "```\n1. Sort input by [key criterion]\n"
            "2. For each element in sorted order:\n"
            "   - Make the locally optimal choice\n"
            "   - Update running answer\n"
            "3. Return final answer\n```"
        ),
        "binary search": (
            "```\nlo, hi = min_possible, max_possible\nwhile lo < hi:\n"
            "    mid = (lo + hi) // 2\n"
            "    if feasible(mid):\n        hi = mid\n    else:\n        lo = mid + 1\nreturn lo\n```"
        ),
        "two pointers": (
            "```\nleft, right = 0, 0\nwhile right < len(arr):\n"
            "    # expand right\n    right += 1\n"
            "    while condition_violated():\n        # shrink left\n        left += 1\n"
            "    update_answer()\nreturn answer\n```"
        ),
    }

    for tag in cf_tags:
        if tag in pseudo_map:
            return f"📋 **Pseudo-code:**\n\n{pseudo_map[tag]}"

    return (
        "📋 **Pseudo-code:**\n\n```\n"
        "1. Parse input\n2. Apply main logic\n"
        "3. Handle edge cases\n4. Output result\n```"
    )


def generate_hint_level4(snippet: str) -> str:
    """Hint L4: First 30% of a real solution."""
    if not snippet or not snippet.strip():
        return "🔧 **Code snippet unavailable** — no solution found in dataset for this problem."
    return (
        f"🔧 **Partial code (first 30%):**\n\n"
        f"```python\n{snippet}\n# ... (rest hidden — try completing it yourself!)\n```"
    )


def generate_hint_level5(full_solution: str) -> str:
    """Hint L5: Full solution."""
    if not full_solution or not full_solution.strip():
        return "📦 **Full solution unavailable** in dataset."
    return (
        f"📦 **Full solution:**\n\n"
        f"```python\n{full_solution}\n```"
    )


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class PredictRequest(BaseModel):
    problem_name: str = Field(..., description="Exact problem name from the dataset")
    language: str = Field(default="PYTHON3", description="Programming language used")
    code_length: int = Field(default=0, ge=0, description="Length of submitted code (chars)")
    wrong_answer_count: int = Field(default=0, ge=0, description="Number of failed attempts")
    difficulty_override: Optional[int] = Field(default=None, description="Override cf_rating if known")
    cf_tags_override: Optional[list[str]] = Field(default=None, description="Override tags for unknown problems")


class HintRequest(BaseModel):
    problem_name: str
    level: int = Field(..., ge=1, le=5, description="Hint level 1-5")
    language: str = Field(default="PYTHON3")
    cf_tags_override: Optional[list[str]] = Field(default=None)
    snippet_override: Optional[str] = Field(default=None)
    full_solution_override: Optional[str] = Field(default=None)


class PredictResponse(BaseModel):
    problem_name: str
    predicted_level: int
    confidence: Optional[float] = None
    model_used: str


class HintResponse(BaseModel):
    problem_name: str
    level: int
    hint_text: str
    cf_tags: list[str]
    difficulty: Optional[int] = None


# ---------------------------------------------------------------------------
# Feature vector builder
# ---------------------------------------------------------------------------
def build_feature_vector(
    difficulty: int,
    code_length: int,
    wrong_answer_count: int,
    language: str,
    cf_tags: list[str],
    time_limit_ms: int = 2000,
    memory_limit_bytes: int = 268435456,
) -> np.ndarray:
    import numpy as np

    features = []

    # Numeric
    features.append(min(difficulty, 3500) / 3500)
    features.append(np.log1p(code_length))
    features.append(np.log1p(0))  # solution_lines_log placeholder
    features.append(wrong_answer_count / (wrong_answer_count + 1))
    features.append(time_limit_ms / 1000)
    features.append(min(memory_limit_bytes / (1024 ** 2), 1024))

    # One-hot language
    for lang in TOP_LANGS:
        features.append(1.0 if language == lang else 0.0)

    # Multi-hot tags
    for tag in TOP_TAGS:
        features.append(1.0 if tag in cf_tags else 0.0)

    return np.array(features, dtype=np.float32).reshape(1, -1)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "service": "ByteBattle Hint Service"}


@app.get("/problems")
def list_problems():
    index = load_problem_index()
    return {"count": len(index), "problems": sorted(index.keys())[:500]}  # cap at 500


@app.get("/problem/{problem_name:path}")
def get_problem(problem_name: str):
    index = load_problem_index()
    if problem_name not in index:
        raise HTTPException(status_code=404, detail=f"Problem '{problem_name}' not found in index.")
    row = index[problem_name]
    return {
        "problem_name": problem_name,
        "difficulty": row.get("difficulty_norm", 0) * 3500,
        "language": row.get("language", "UNKNOWN"),
        "cf_tags": json.loads(row.get("cf_tags_raw", "[]")),
    }


@app.post("/predict-level", response_model=PredictResponse)
def predict_level(req: PredictRequest):
    model, meta = load_model()
    index = load_problem_index()

    row = index.get(req.problem_name, {})
    difficulty = req.difficulty_override if req.difficulty_override is not None else int(row.get("difficulty_norm", 0.3) * 3500)
    cf_tags = req.cf_tags_override if req.cf_tags_override is not None else json.loads(row.get("cf_tags_raw", "[]"))
    time_limit_ms = int(row.get("time_limit_s", 2.0) * 1000)
    memory_limit_bytes = int(row.get("memory_mb", 256) * 1024 * 1024)

    X = build_feature_vector(
        difficulty=difficulty,
        code_length=req.code_length,
        wrong_answer_count=req.wrong_answer_count,
        language=req.language,
        cf_tags=cf_tags,
        time_limit_ms=time_limit_ms,
        memory_limit_bytes=memory_limit_bytes,
    )

    try:
        pred = model.predict(X)[0]
        level = int(pred)
    except Exception as e:
        log.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Model prediction failed")

    # Confidence (predict_proba if available)
    confidence = None
    try:
        proba = model.predict_proba(X)[0]
        confidence = round(float(proba.max()), 3)
    except Exception:
        pass

    return PredictResponse(
        problem_name=req.problem_name,
        predicted_level=max(1, min(5, level)),
        confidence=confidence,
        model_used=meta["champion"],
    )


@app.post("/hint", response_model=HintResponse)
def get_hint(req: HintRequest):
    index = load_problem_index()

    row = index.get(req.problem_name, {})

    cf_tags = req.cf_tags_override if req.cf_tags_override is not None else json.loads(row.get("cf_tags_raw", "[]"))
    difficulty = int(row.get("difficulty_norm", 0.3) * 3500)
    snippet = req.snippet_override if req.snippet_override is not None else row.get("solution_snippet", "")
    full_solution = req.full_solution_override if req.full_solution_override is not None else row.get("solution_full", "")

    generators = {
        1: lambda: generate_hint_level1(cf_tags, req.problem_name),
        2: lambda: generate_hint_level2(cf_tags, difficulty),
        3: lambda: generate_hint_level3(cf_tags),
        4: lambda: generate_hint_level4(snippet),
        5: lambda: generate_hint_level5(full_solution),
    }

    hint_text = generators[req.level]()

    return HintResponse(
        problem_name=req.problem_name,
        level=req.level,
        hint_text=hint_text,
        cf_tags=cf_tags,
        difficulty=difficulty,
    )
