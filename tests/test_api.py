from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_reconciliation_batch_and_metrics():
    batch = client.get("/api/reconciliation")
    metrics = client.get("/api/metrics")
    assert batch.status_code == 200
    assert len(batch.json()["records"]) == 100
    assert metrics.json()["precision"] == 1.0


def test_unknown_payment_is_404():
    response = client.get("/api/reconciliation/PAY-NOT-FOUND")
    assert response.status_code == 404

