from __future__ import annotations

import csv
import random
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SAMPLE = ROOT / "data" / "sample"
TRUTH = ROOT / "data" / "ground_truth"
random.seed(3101)


def write(name: Path, rows: list[dict]) -> None:
    name.parent.mkdir(parents=True, exist_ok=True)
    with name.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    orders, payments, settlements, bank, truth = [], [], [], [], []
    start = date(2026, 8, 1)
    for n in range(1, 101):
        order_id, payment_id, settlement_id = f"ORD{n:04}", f"PAY{n:04}", f"SETL{n:04}"
        amount = float(random.randrange(500, 20001))
        created = start + timedelta(days=n % 20)
        status = "refunded" if n in {17, 54, 88} else "captured"
        orders.append({"order_id": order_id, "customer_id": f"CUS{n % 29:03}", "amount": f"{amount:.2f}", "created_at": created.isoformat()})
        payments.append({"payment_id": payment_id, "order_id": order_id, "amount": f"{amount:.2f}", "status": status, "paid_at": created.isoformat()})

        if status == "refunded" or n in {9, 42, 79}:
            truth.append({"payment_id": payment_id, "bank_txn_id": "", "expected_case": "refunded" if status == "refunded" else "missing_settlement"})
            continue

        fee = round(amount * 0.02, 2)
        if n in {14, 61}:
            fee += 25
        net = round(amount - fee, 2)
        settled = created + timedelta(days=2)
        settlements.append({"settlement_id": settlement_id, "payment_id": payment_id, "gross_amount": f"{amount:.2f}", "fee": f"{fee:.2f}", "net_amount": f"{net:.2f}", "settled_at": settled.isoformat()})

        if n in {25, 73}:
            truth.append({"payment_id": payment_id, "bank_txn_id": "", "expected_case": "missing_bank_credit"})
            continue
        bank_id = f"BNK{n:04}"
        credited = settled + timedelta(days=1 if n % 7 else 2)
        reference = settlement_id if n % 5 else f"RZP-{settlement_id}-CR"
        credit = net + (3 if n in {33, 67} else 0)
        bank.append({"bank_txn_id": bank_id, "reference": reference, "credit_amount": f"{credit:.2f}", "credited_at": credited.isoformat()})
        expected = bank_id if n not in {14, 33, 61, 67} else ""
        truth.append({"payment_id": payment_id, "bank_txn_id": expected, "expected_case": "match" if expected else "financial_mismatch"})

    payments.append(dict(payments[30]))
    bank.append({"bank_txn_id": "BNK9998", "reference": "UNKNOWN-CREDIT", "credit_amount": "8123.00", "credited_at": "2026-08-22"})
    write(SAMPLE / "orders.csv", orders)
    write(SAMPLE / "payments.csv", payments)
    write(SAMPLE / "settlements.csv", settlements)
    write(SAMPLE / "bank_transactions.csv", bank)
    write(TRUTH / "matches.csv", truth)
    print(f"Generated {len(payments)} payment rows and {len(truth)} labelled cases")


if __name__ == "__main__":
    main()

