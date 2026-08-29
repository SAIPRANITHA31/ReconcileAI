from __future__ import annotations

from pathlib import Path
from typing import Literal

import joblib
from pydantic import BaseModel, Field

MODEL_PATH = Path(__file__).resolve().parent / "exception_model.joblib"


class AIInvestigation(BaseModel):
    category: Literal[
        "missing_settlement",
        "missing_bank_credit",
        "fee_mismatch",
        "amount_mismatch",
        "duplicate",
        "reference_mismatch",
        "unknown",
    ]

    summary: str
    recommended_action: Literal[
        "request_settlement_details",
        "verify_bank_statement",
        "verify_gateway_fee",
        "human_review",
        "mark_duplicate",
        "no_action",
    ]

    confidence: float = Field(ge=0, le=1)
    evidence: list[str]
    requires_human_approval: bool = True


ACTION_MAP = {
    "missing_settlement": "request_settlement_details",
    "missing_bank_credit": "verify_bank_statement",
    "fee_mismatch": "verify_gateway_fee",
    "amount_mismatch": "human_review",
    "duplicate": "mark_duplicate",
    "reference_mismatch": "human_review",
    "unknown": "human_review",
}


SUMMARY_MAP = {
    "missing_settlement": "A successful payment appears to have no settlement record.",
    "missing_bank_credit": "A settlement appears to have no corresponding bank credit.",
    "fee_mismatch": "The charged gateway fee differs from the expected fee.",
    "amount_mismatch": "The received amount differs from the expected financial amount.",
    "duplicate": "Multiple records may represent the same financial transaction.",
    "reference_mismatch": "The bank and settlement references do not align reliably.",
    "unknown": "The available evidence is insufficient for automatic classification.",
}


def investigate_exception(record: dict) -> AIInvestigation:
    if not MODEL_PATH.exists():
        raise RuntimeError(
            "Local model not found. Run python scripts/train_exception_model.py"
        )

    reason = str(record.get("reason", "")).strip()

    if not reason:
        raise RuntimeError("The reconciliation record has no explanation")

    model = joblib.load(MODEL_PATH)
    probabilities = model.predict_proba([reason])[0]
    classes = model.classes_

    best_index = int(probabilities.argmax())
    category = str(classes[best_index])
    confidence = float(probabilities[best_index])

    # Low-confidence predictions are not trusted.
    if confidence < 0.60:
        category = "unknown"

    return AIInvestigation(
        category=category,
        summary=SUMMARY_MAP[category],
        recommended_action=ACTION_MAP[category],
        confidence=round(confidence, 4),
        evidence=[reason],
        requires_human_approval=True,
    )