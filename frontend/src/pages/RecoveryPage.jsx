import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  RefreshCcw,
  Search,
  ShieldAlert,
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

function getRecoveryPriority(record) {
  if (record.status === "unresolved") {
    return "high";
  }

  const confidence =
    Number(record.confidence) || 0;

  if (confidence < 0.7) {
    return "high";
  }

  if (confidence < 0.9) {
    return "medium";
  }

  return "normal";
}

function formatPriority(priority) {
  return priority
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function RecoveryPage() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] =
    useState("all");

  const loadRecovery = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await getReconciliation();

      const recoverable = (
        response.records || []
      ).filter((record) =>
        ["review", "unresolved"].includes(
          record.status
        )
      );

      setRecords(recoverable);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to load recovery queue."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecovery();
  }, [loadRecovery]);

  const enrichedRecords = useMemo(
    () =>
      records.map((record) => ({
        ...record,
        recoveryPriority:
          getRecoveryPriority(record),
      })),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return enrichedRecords.filter(
      (record) => {
        if (
          priorityFilter !== "all" &&
          record.recoveryPriority !==
            priorityFilter
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
          record.recoveryPriority,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(
          normalizedSearch
        );
      }
    );
  }, [
    enrichedRecords,
    search,
    priorityFilter,
  ]);

  const highPriorityCount =
    enrichedRecords.filter(
      (record) =>
        record.recoveryPriority === "high"
    ).length;

  const unresolvedCount =
    enrichedRecords.filter(
      (record) =>
        record.status === "unresolved"
    ).length;

  const reviewCount =
    enrichedRecords.filter(
      (record) => record.status === "review"
    ).length;

  if (loading) {
    return (
      <section className="recovery-page">
        <div className="page-loading-state">
          <RefreshCcw
            size={18}
            className="loading-spin"
          />

          <span>
            Loading recovery queue...
          </span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="recovery-page">
        <div className="page-error-state">
          <TriangleAlert size={22} />

          <h2>
            Unable to load recovery queue
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadRecovery}
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="recovery-page">
      <div className="recovery-heading-row">
        <div className="page-heading-block">
          <span className="eyebrow">
            Exception recovery operations
          </span>

          <h2>Recovery Center</h2>

          <p>
            Prioritize reconciliation exceptions
            requiring finance-team investigation
            and resolution.
          </p>
        </div>

        <button
          type="button"
          className="recovery-refresh-button"
          onClick={loadRecovery}
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      <div className="recovery-summary-grid">
        <article className="recovery-summary-card">
          <div className="recovery-summary-icon">
            <CircleDollarSign size={17} />
          </div>

          <span>Recovery Candidates</span>

          <strong>{records.length}</strong>

          <p>
            Exceptions requiring operational
            attention.
          </p>
        </article>

        <article className="recovery-summary-card">
          <div className="recovery-summary-icon">
            <ShieldAlert size={17} />
          </div>

          <span>High Priority</span>

          <strong>{highPriorityCount}</strong>

          <p>
            Unresolved or low-confidence cases.
          </p>
        </article>

        <article className="recovery-summary-card">
          <div className="recovery-summary-icon">
            <AlertTriangle size={17} />
          </div>

          <span>Unresolved</span>

          <strong>{unresolvedCount}</strong>

          <p>
            Records without a confident match.
          </p>
        </article>

        <article className="recovery-summary-card">
          <div className="recovery-summary-icon">
            <RefreshCcw size={17} />
          </div>

          <span>Awaiting Review</span>

          <strong>{reviewCount}</strong>

          <p>
            Records queued for human review.
          </p>
        </article>
      </div>

      <div className="recovery-info-banner">
        <ShieldAlert size={17} />

        <div>
          <strong>
            Financial recovery amounts unavailable
          </strong>

          <p>
            The current reconciliation API does not
            expose payment amounts, so ReconcileAI
            does not fabricate recoverable monetary
            values.
          </p>
        </div>
      </div>

      <div className="recovery-toolbar">
        <div className="recovery-search">
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
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All priorities
          </option>

          <option value="high">
            High priority
          </option>

          <option value="medium">
            Medium priority
          </option>

          <option value="normal">
            Normal priority
          </option>
        </select>
      </div>

      <article className="recovery-table-card">
        <div className="recovery-table-heading">
          <div>
            <div className="recovery-heading-icon">
              <ShieldAlert size={17} />
            </div>

            <div>
              <h3>
                Exception Recovery Queue
              </h3>

              <span>
                {filteredRecords.length} case
                {filteredRecords.length === 1
                  ? ""
                  : "s"}{" "}
                requiring attention
              </span>
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="recovery-empty-state">
            <ShieldAlert size={27} />

            <h3>
              No recovery cases found
            </h3>

            <p>
              No reconciliation exceptions match
              the selected filters.
            </p>
          </div>
        ) : (
          <div className="recovery-table-wrapper">
            <table className="recovery-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Payment</th>
                  <th>Settlement</th>
                  <th>
                    Bank Transaction
                  </th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Discrepancy</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map(
                  (record) => (
                    <tr
                      key={record.payment_id}
                    >
                      <td>
                        <span
                          className={`recovery-priority priority-${record.recoveryPriority}`}
                        >
                          {formatPriority(
                            record.recoveryPriority
                          )}
                        </span>
                      </td>

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

                      <td className="recovery-reason">
                        {record.reason || "—"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="recovery-open-button"
                          onClick={() =>
                            navigate(
                              `/reconciliation/${record.payment_id}`
                            )
                          }
                        >
                          Investigate
                          <ArrowRight
                            size={13}
                          />
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