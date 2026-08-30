from pathlib import Path

from fastapi.testclient import TestClient

import backend.app.audit as audit
from backend.app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "reconcile-ai"


def test_reconciliation_batch_and_metrics():
    batch_response = client.get("/api/reconciliation")
    metrics_response = client.get("/api/metrics")

    assert batch_response.status_code == 200
    assert metrics_response.status_code == 200

    batch_data = batch_response.json()
    metrics_data = metrics_response.json()

    assert len(batch_data["records"]) == 100
    assert metrics_data["records_evaluated"] == 100
    assert metrics_data["precision"] == 1.0


def test_unknown_payment_is_404():
    response = client.get(
        "/api/reconciliation/PAY-NOT-FOUND"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Payment not found"


def test_matched_payment_cannot_be_investigated():
    response = client.post(
        "/api/investigate/PAY0001"
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Only review or unresolved records can be investigated"
    )


def test_unresolved_payment_can_be_investigated():
    response = client.post(
        "/api/investigate/PAY0009"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["payment_id"] == "PAY0009"
    assert (
        data["ai_investigation"]["category"]
        == "missing_settlement"
    )
    assert (
        data["ai_investigation"][
            "requires_human_approval"
        ]
        is True
    )
    assert (
        data["policy"]["automatic_financial_action"]
        is False
    )


def test_review_is_persisted_in_audit_trail(
    tmp_path: Path,
    monkeypatch,
):
    test_database = tmp_path / "test_audit.db"

    monkeypatch.setattr(
        audit,
        "DATABASE_PATH",
        test_database,
    )

    audit.initialize_audit_database()

    review_response = client.post(
        "/api/review/PAY0009",
        json={
            "decision": "approved",
            "note": "Test reviewer approved the recommendation.",
        },
    )

    assert review_response.status_code == 200

    review_data = review_response.json()

    assert (
        review_data["source_financial_record_modified"]
        is False
    )
    assert (
        review_data["event"]["decision"]
        == "approved"
    )
    assert (
        review_data["event"]["classification"]
        == "missing_settlement"
    )

    audit_response = client.get("/api/audit")

    assert audit_response.status_code == 200

    audit_data = audit_response.json()

    assert audit_data["total_events"] == 1
    assert (
        audit_data["events"][0]["payment_id"]
        == "PAY0009"
    )


def test_matched_payment_cannot_be_reviewed():
    response = client.post(
        "/api/review/PAY0001",
        json={
            "decision": "approved",
            "note": "This action must be rejected by policy.",
        },
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "This record does not require human review"
    )