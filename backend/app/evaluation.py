from __future__ import annotations

from pathlib import Path

import pandas as pd

from backend.app.matching.engine import MatchResult


def evaluate(results: list[MatchResult], truth_path: Path) -> dict:
    truth = pd.read_csv(truth_path).fillna("")
    predicted = {r.payment_id: (r.bank_txn_id or "") for r in results if r.status == "matched"}
    tp = fp = fn = 0
    for _, row in truth.iterrows():
        payment_id, actual = str(row["payment_id"]), str(row["bank_txn_id"])
        guess = predicted.get(payment_id, "")
        if guess and guess == actual:
            tp += 1
        elif guess and guess != actual:
            fp += 1
        elif actual and not guess:
            fn += 1
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    counts = pd.Series([r.status for r in results]).value_counts().to_dict()
    return {
        "records_evaluated": len(truth),
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "status_counts": counts,
    }

