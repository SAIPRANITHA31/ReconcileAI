from pathlib import Path

from backend.app.evaluation import evaluate
from backend.app.matching.engine import reconcile

ROOT = Path(__file__).resolve().parents[1]


def test_engine_has_no_false_positive_matches():
    results = reconcile(ROOT / "data" / "sample")
    metrics = evaluate(results, ROOT / "data" / "ground_truth" / "matches.csv")
    assert metrics["records_evaluated"] == 100
    assert metrics["false_positives"] == 0
    assert metrics["precision"] == 1.0


def test_engine_surfaces_exceptions():
    results = reconcile(ROOT / "data" / "sample")
    statuses = {result.status for result in results}
    assert {"matched", "review", "unresolved", "excluded"}.issubset(statuses)

