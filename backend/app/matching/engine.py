from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

import pandas as pd
from rapidfuzz.fuzz import ratio


@dataclass(frozen=True)
class MatchResult:
    payment_id: str
    settlement_id: Optional[str]
    bank_txn_id: Optional[str]
    status: str
    confidence: float
    reason: str

    def to_dict(self) -> dict:
        return asdict(self)


def _date_distance(left: str, right: str) -> int:
    return abs((datetime.fromisoformat(left) - datetime.fromisoformat(right)).days)


def _best_bank_candidate(settlement: pd.Series, bank: pd.DataFrame) -> tuple[Optional[pd.Series], float, str]:
    expected = float(settlement["net_amount"])
    candidates: list[tuple[float, pd.Series, str]] = []
    for _, row in bank.iterrows():
        amount_gap = abs(float(row["credit_amount"]) - expected)
        days = _date_distance(str(settlement["settled_at"]), str(row["credited_at"]))
        reference_score = ratio(str(settlement["settlement_id"]), str(row["reference"])) / 100

        if amount_gap <= 0.01 and days <= 3:
            score = 0.70 + 0.20 * reference_score + (0.10 if days <= 1 else 0.05)
            reason = f"net amount matches; {days}-day date gap; reference similarity {reference_score:.0%}"
            candidates.append((score, row, reason))
        elif amount_gap <= 5 and days <= 2 and reference_score >= 0.55:
            score = 0.55 + 0.20 * reference_score
            reason = f"small amount gap INR {amount_gap:.2f}; {days}-day date gap; similar reference"
            candidates.append((score, row, reason))

    if not candidates:
        return None, 0.0, "no bank credit satisfies amount and date guardrails"
    score, row, reason = max(candidates, key=lambda item: item[0])
    return row, min(score, 0.99), reason


def reconcile(data_dir: Path) -> list[MatchResult]:
    payments = pd.read_csv(data_dir / "payments.csv", dtype={"payment_id": str})
    settlements = pd.read_csv(data_dir / "settlements.csv", dtype={"payment_id": str})
    bank = pd.read_csv(data_dir / "bank_transactions.csv")

    results: list[MatchResult] = []
    duplicate_payments = set(payments.loc[payments.duplicated("payment_id", keep=False), "payment_id"])

    for _, payment in payments.drop_duplicates("payment_id").iterrows():
        payment_id = str(payment["payment_id"])
        if payment_id in duplicate_payments:
            results.append(MatchResult(payment_id, None, None, "review", 0.0, "duplicate payment ID detected"))
            continue
        if str(payment["status"]) == "refunded":
            results.append(MatchResult(payment_id, None, None, "excluded", 1.0, "refunded payment is not settlement-eligible"))
            continue

        rows = settlements[settlements["payment_id"] == payment_id]
        if rows.empty:
            results.append(MatchResult(payment_id, None, None, "unresolved", 0.0, "successful payment has no settlement"))
            continue
        if len(rows) > 1:
            results.append(MatchResult(payment_id, None, None, "review", 0.0, "multiple settlement rows claim one payment"))
            continue

        settlement = rows.iloc[0]
        expected_fee = round(float(payment["amount"]) * 0.02, 2)
        if abs(float(settlement["fee"]) - expected_fee) > 0.01:
            results.append(MatchResult(payment_id, str(settlement["settlement_id"]), None, "review", 0.35, "gateway fee differs from expected 2%"))
            continue

        candidate, confidence, evidence = _best_bank_candidate(settlement, bank)
        if candidate is None:
            results.append(MatchResult(payment_id, str(settlement["settlement_id"]), None, "unresolved", 0.0, evidence))
        elif confidence >= 0.90:
            results.append(MatchResult(payment_id, str(settlement["settlement_id"]), str(candidate["bank_txn_id"]), "matched", confidence, evidence))
        else:
            results.append(MatchResult(payment_id, str(settlement["settlement_id"]), str(candidate["bank_txn_id"]), "review", confidence, evidence))
    return results

