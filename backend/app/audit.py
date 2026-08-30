from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATABASE_PATH = ROOT / "data" / "reconcile_ai.db"


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_audit_database() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    with connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                payment_id TEXT NOT NULL,
                actor TEXT NOT NULL,
                decision TEXT NOT NULL,
                classification TEXT NOT NULL,
                recommended_action TEXT NOT NULL,
                model_confidence REAL NOT NULL,
                note TEXT NOT NULL
            )
            """
        )


def record_review(
    payment_id: str,
    decision: str,
    classification: str,
    recommended_action: str,
    model_confidence: float,
    note: str,
) -> dict:
    created_at = datetime.now(timezone.utc).isoformat()

    with connect() as connection:
        cursor = connection.execute(
            """
            INSERT INTO audit_events (
                created_at,
                payment_id,
                actor,
                decision,
                classification,
                recommended_action,
                model_confidence,
                note
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                created_at,
                payment_id,
                "finance_reviewer",
                decision,
                classification,
                recommended_action,
                model_confidence,
                note,
            ),
        )

        event_id = cursor.lastrowid

    return {
        "id": event_id,
        "created_at": created_at,
        "payment_id": payment_id,
        "actor": "finance_reviewer",
        "decision": decision,
        "classification": classification,
        "recommended_action": recommended_action,
        "model_confidence": model_confidence,
        "note": note,
    }


def get_audit_events() -> list[dict]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM audit_events
            ORDER BY id DESC
            """
        ).fetchall()

    return [dict(row) for row in rows]