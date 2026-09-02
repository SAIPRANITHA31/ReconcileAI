import {
  CreditCard,
  Eye,
  RefreshCcw,
  Search,
  TriangleAlert,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { getReconciliation } from "../services/api.js";

import StatusBadge from "../components/reconciliation/StatusBadge.jsx";
import ConfidenceIndicator from "../components/reconciliation/ConfidenceIndicator.jsx";

export default function PaymentsPage() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await getReconciliation();

      setRecords(response.records || []);
      setSummary(response.summary || {});
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to load payments."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return records.filter((record) => {
      if (
        statusFilter !== "all" &&
        record.status !== statusFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        record.payment_id,
        record.settlement_id,
        record.bank_txn_id,
        record.status,
        record.reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [
    records,
    search,
    statusFilter,
  ]);

  if (loading) {
    return (
      <section className="payments-page">
        <div className="page-loading-state">
          <RefreshCcw
            size={18}
            className="loading-spin"
          />

          <span>Loading payments...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="payments-page">
        <div className="page-error-state">
          <TriangleAlert size={22} />

          <h2>
            Unable to load payments
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadPayments}
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="payments-page">
      <div className="payments-heading-row">
        <div className="page-heading-block">
          <span className="eyebrow">
            Payment operations
          </span>

          <h2>Payments</h2>

          <p>
            Review payment reconciliation status,
            linked settlement records, and bank
            transaction references.
          </p>
        </div>

        <button
          type="button"
          className="payments-refresh-button"
          onClick={loadPayments}
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      <div className="payments-summary-grid">
        <article className="payments-summary-card">
          <span>Total Payments</span>

          <strong>{records.length}</strong>
        </article>

        <article className="payments-summary-card">
          <span>Matched</span>

          <strong>
            {summary.matched ??
              records.filter(
                (record) =>
                  record.status ===
                  "matched"
              ).length}
          </strong>
        </article>

        <article className="payments-summary-card">
          <span>Review</span>

          <strong>
            {summary.review ??
              records.filter(
                (record) =>
                  record.status ===
                  "review"
              ).length}
          </strong>
        </article>

        <article className="payments-summary-card">
          <span>Unresolved</span>

          <strong>
            {summary.unresolved ??
              records.filter(
                (record) =>
                  record.status ===
                  "unresolved"
              ).length}
          </strong>
        </article>
      </div>

      <div className="payments-toolbar">
        <div className="payments-search">
          <Search size={16} />

          <input
            type="search"
            placeholder="Search payment, settlement, bank transaction..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All statuses
          </option>

          <option value="matched">
            Matched
          </option>

          <option value="review">
            Review
          </option>

          <option value="unresolved">
            Unresolved
          </option>

          <option value="excluded">
            Excluded
          </option>
        </select>
      </div>

      <article className="payments-table-card">
        <div className="payments-table-heading">
          <div>
            <div className="payments-heading-icon">
              <CreditCard size={17} />
            </div>

            <div>
              <h3>Payment Records</h3>

              <span>
                {filteredRecords.length} payment
                {filteredRecords.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="payments-empty-state">
            <CreditCard size={26} />

            <h3>No payments found</h3>

            <p>
              No payment records match your
              current search or filter.
            </p>
          </div>
        ) : (
          <div className="payments-table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Settlement ID</th>
                  <th>
                    Bank Transaction
                  </th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Reason</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map(
                  (record) => (
                    <tr
                      key={record.payment_id}
                      onClick={() =>
                        navigate(
                          `/reconciliation/${record.payment_id}`
                        )
                      }
                    >
                      <td>
                        <span className="payment-id">
                          {record.payment_id}
                        </span>
                      </td>

                      <td>
                        {record.settlement_id ||
                          "—"}
                      </td>

                      <td>
                        {record.bank_txn_id ||
                          "—"}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            record.status
                          }
                        />
                      </td>

                      <td>
                        <ConfidenceIndicator
                          value={
                            record.confidence
                          }
                        />
                      </td>

                      <td className="payments-reason">
                        {record.reason || "—"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="payments-view-button"
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            navigate(
                              `/reconciliation/${record.payment_id}`
                            );
                          }}
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}