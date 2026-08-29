from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.app.evaluation import evaluate
from backend.app.matching.engine import reconcile


if __name__ == "__main__":
    results = reconcile(ROOT / "data" / "sample")
    metrics = evaluate(results, ROOT / "data" / "ground_truth" / "matches.csv")
    output = ROOT / "evaluation" / "results.json"
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))

