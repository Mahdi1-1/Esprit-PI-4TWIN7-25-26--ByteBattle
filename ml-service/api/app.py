from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from pipeline.orchestrator import IntelligenceOrchestrator, SessionTelemetry
except ModuleNotFoundError:
    from orchestrator import IntelligenceOrchestrator, SessionTelemetry


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models" / "intelligence_engine"


class SubmitRequest(BaseModel):
    user_id: str
    challenge_id: str
    challenge_name: str = ""
    difficulty: int = 2
    cf_rating: int = 1400
    minutes_stuck: float = Field(ge=0, default=0)
    attempts_count: int = Field(ge=0, default=0)
    last_hint_level: int = Field(ge=0, le=5, default=0)
    challenge_tags: list[str] = Field(default_factory=list)
    code_lines: int = Field(default=40, ge=1)


class GetHintRequest(SubmitRequest):
    force_level: int | None = Field(default=None, ge=1, le=5)


class ProfileRequest(SubmitRequest):
    current_skills: dict[str, float] = Field(default_factory=dict)
    top_k: int = Field(default=5, ge=1, le=20)


class PredictLevelCompatRequest(BaseModel):
    problem_name: str
    language: str = "PYTHON3"
    code_length: int = Field(default=0, ge=0)
    wrong_answer_count: int = Field(default=0, ge=0)
    difficulty_override: int | None = None
    cf_tags_override: list[str] | None = None


@lru_cache(maxsize=1)
def get_orchestrator() -> IntelligenceOrchestrator:
    if not MODEL_DIR.exists():
        raise RuntimeError(f"Model directory not found: {MODEL_DIR}")
    return IntelligenceOrchestrator(MODEL_DIR)


def _to_telemetry(payload: SubmitRequest) -> SessionTelemetry:
    return SessionTelemetry(
        user_id=payload.user_id,
        challenge_id=payload.challenge_id,
        challenge_name=payload.challenge_name,
        difficulty=payload.difficulty,
        cf_rating=payload.cf_rating,
        minutes_stuck=payload.minutes_stuck,
        attempts_count=payload.attempts_count,
        last_hint_level=payload.last_hint_level,
        challenge_tags=payload.challenge_tags,
        code_lines=payload.code_lines,
    )


app = FastAPI(
    title="ByteBattle Intelligence Engine",
    version="2.0.0",
    description="M1→M2→M3→M4 orchestration API",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ByteBattle Intelligence Engine"}


@app.post("/submit")
def submit(req: SubmitRequest) -> dict[str, Any]:
    try:
        orchestrator = get_orchestrator()
        return orchestrator.submit(_to_telemetry(req))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/get-hint")
def get_hint(req: GetHintRequest) -> dict[str, Any]:
    try:
        orchestrator = get_orchestrator()
        return orchestrator.get_hint(_to_telemetry(req), force_level=req.force_level)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/profile")
def profile(req: ProfileRequest) -> dict[str, Any]:
    try:
        orchestrator = get_orchestrator()
        return orchestrator.profile(
            telemetry=_to_telemetry(req),
            current_skills=req.current_skills,
            top_k=req.top_k,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/predict-level")
def predict_level_compat(req: PredictLevelCompatRequest) -> dict[str, Any]:
    try:
        orchestrator = get_orchestrator()
        telemetry = SessionTelemetry(
            user_id="compat-user",
            challenge_id=req.problem_name,
            challenge_name=req.problem_name,
            difficulty=2,
            cf_rating=req.difficulty_override or 1400,
            minutes_stuck=max(0.0, float(req.wrong_answer_count) * 4.0),
            attempts_count=req.wrong_answer_count,
            last_hint_level=0,
            challenge_tags=req.cf_tags_override or [],
            code_lines=max(1, int(req.code_length / 6) if req.code_length > 0 else 40),
        )
        return orchestrator.predict_level_compat(telemetry)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
