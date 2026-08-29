from __future__ import annotations

from collections import Counter
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.app.evaluation import evaluate
from backend.app.matching.engine import reconcile

from backend.app.agents.investigator import investigate_exception

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "sample"
TRUTH_PATH = ROOT / "data" / "ground_truth" / "matches.csv"

app = FastAPI(
    title="ReconcileAI API",
    version="0.1.0",
    description="Explainable payment and settlement reconciliation for finance teams.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def current_results():
    return reconcile(DATA_DIR)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "reconcile-ai"}


@app.get("/api/reconciliation")
def reconciliation() -> dict:
    results = current_results()
    return {
        "summary": dict(Counter(item.status for item in results)),
        "records": [item.to_dict() for item in results],
    }


@app.get("/api/reconciliation/{payment_id}")
def reconciliation_detail(payment_id: str) -> dict:
    result = next((item for item in current_results() if item.payment_id == payment_id), None)
    if result is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return result.to_dict()


@app.get("/api/metrics")
def metrics() -> dict:
    return evaluate(current_results(), TRUTH_PATH)

@app.post("/api/investigate/{payment_id}")
def investigate(payment_id: str) -> dict:
    result = next(
        (
            item
            for item in current_results()
            if item.payment_id == payment_id
        ),
        None,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Payment not found",
        )

    if result.status not in {"review", "unresolved"}:
        raise HTTPException(
            status_code=400,
            detail="Only review or unresolved records can be investigated",
        )

    try:
        investigation = investigate_exception(result.to_dict())

        return {
            "payment_id": payment_id,
            "reconciliation": result.to_dict(),
            "ai_investigation": investigation.model_dump(),
            "policy": {
                "automatic_financial_action": False,
                "human_approval_required": True,
            },
        }

    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"AI investigation unavailable: {error}",
        ) from error