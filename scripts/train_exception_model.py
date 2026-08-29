from __future__ import annotations

import json
import random
import sys
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

MODEL_PATH = ROOT / "backend" / "app" / "agents" / "exception_model.joblib"
METRICS_PATH = ROOT / "evaluation" / "local_ai_metrics.json"

random.seed(3101)

TEMPLATES = {
    "missing_settlement": [
        "successful payment {payment} has no settlement",
        "captured transaction {payment} is missing a settlement record",
        "no settlement found for successful payment {payment}",
        "payment {payment} succeeded but settlement is absent",
        "gateway payment {payment} has not been settled",
    ],
    "missing_bank_credit": [
        "settlement {settlement} has no corresponding bank credit",
        "no bank credit satisfies the amount and date guardrails",
        "bank credit is missing for settlement {settlement}",
        "settlement completed but bank deposit was not found",
        "expected bank credit for {settlement} is absent",
    ],
    "fee_mismatch": [
        "gateway fee differs from the expected two percent",
        "incorrect processing fee found for {payment}",
        "settlement fee does not match the expected gateway fee",
        "fee calculation mismatch for transaction {payment}",
        "charged gateway fee is higher than expected",
    ],
    "amount_mismatch": [
        "settlement and bank credit amounts do not match",
        "bank credit differs from expected net amount by {amount}",
        "incorrect settlement amount detected for {payment}",
        "financial amount mismatch between gateway and bank",
        "received amount is different from expected amount",
    ],
    "duplicate": [
        "duplicate payment id detected for {payment}",
        "multiple settlement rows claim one payment",
        "duplicate bank credit found for settlement {settlement}",
        "the same payment appears more than once",
        "multiple records contain the same transaction identifier",
    ],
    "reference_mismatch": [
        "bank reference does not match settlement identifier",
        "transaction reference is formatted differently",
        "settlement and bank descriptions have low similarity",
        "reference mismatch detected for {settlement}",
        "bank narration does not contain the settlement id",
    ],
    "unknown": [
        "insufficient evidence to determine the exception",
        "financial record requires manual investigation",
        "unable to classify reconciliation discrepancy",
        "transaction data is incomplete and ambiguous",
        "no reliable explanation can be determined",
    ],
}


def generate_training_data() -> tuple[list[str], list[str]]:
    texts: list[str] = []
    labels: list[str] = []

    for label, templates in TEMPLATES.items():
        for _ in range(100):
            template = random.choice(templates)
            text = template.format(
                payment=f"PAY{random.randint(1, 9999):04}",
                settlement=f"SETL{random.randint(1, 9999):04}",
                amount=f"INR {random.randint(1, 500)}",
            )

            texts.append(text)
            labels.append(label)

    return texts, labels


def main() -> None:
    texts, labels = generate_training_data()

    train_texts, test_texts, train_labels, test_labels = train_test_split(
        texts,
        labels,
        test_size=0.25,
        random_state=3101,
        stratify=labels,
    )

    pipeline = Pipeline(
        [
            (
                "vectorizer",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    min_df=1,
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1000,
                    random_state=3101,
                ),
            ),
        ]
    )

    pipeline.fit(train_texts, train_labels)
    predictions = pipeline.predict(test_texts)

    accuracy = accuracy_score(test_labels, predictions)
    labels_order = sorted(TEMPLATES.keys())

    metrics = {
        "training_records": len(train_texts),
        "test_records": len(test_texts),
        "accuracy": round(float(accuracy), 4),
        "labels": labels_order,
        "confusion_matrix": confusion_matrix(
            test_labels,
            predictions,
            labels=labels_order,
        ).tolist(),
        "classification_report": classification_report(
            test_labels,
            predictions,
            output_dict=True,
            zero_division=0,
        ),
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(pipeline, MODEL_PATH)
    METRICS_PATH.write_text(
        json.dumps(metrics, indent=2),
        encoding="utf-8",
    )

    print(f"Training records: {len(train_texts)}")
    print(f"Held-out test records: {len(test_texts)}")
    print(f"Accuracy: {accuracy:.2%}")
    print(f"Model saved to: {MODEL_PATH}")
    print(f"Metrics saved to: {METRICS_PATH}")


if __name__ == "__main__":
    main()