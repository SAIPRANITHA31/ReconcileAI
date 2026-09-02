import {
  ArrowDownUp,
  Filter,
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

import ConfidenceIndicator from "../components/reconciliation/ConfidenceIndicator.jsx";
import StatusBadge from "../components/reconciliation/StatusBadge.jsx";

import {
  getReconciliation,
} from "../services/api.js";

const confidenceFilters = [
  {
    value: "all",
    label: "All confidence",
  },
  {
    value: "high",
    label: "90% and above",
  },
  {
    value: "medium",
    label: "70%–89%",
  },
  {
    value: "low",
    label: "Below 70%",
  },
];

export default function ReconciliationPage() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [confidenceFilter, setConfidenceFilter] =
    useState("all");

  const [sortField, setSortField] =
    useState("payment_id");
  const [sortDirection, setSortDirection] =
    useState("asc");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getReconciliation();

      setRecords(response.records || []);
      setSummary(response.summary || {});
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to load reconciliation data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const statuses = useMemo(() => {
    return Array.from(
      new Set(records.map((record) => record.status))
    ).filter(Boolean);
  }, [records]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    let result = [...records];

    if (normalizedSearch) {
      result = result.filter((record) => {
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
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (record) =>
          record.status === statusFilter
      );
    }

    if (confidenceFilter !== "all") {
      result = result.filter((record) => {
        const confidence = Number(
          record.confidence || 0
        );

        if (confidenceFilter === "high") {
          return confidence >= 0.9;
        }

        if (confidenceFilter === "medium") {
          return (
            confidence >= 0.7 &&
            confidence < 0.9
          );
        }

        return confidence < 0.7;
      });
    }

    result.sort((left, right) => {
      let leftValue = left[sortField];
      let rightValue = right[sortField];

      if (sortField === "confidence") {
        leftValue = Number(leftValue || 0);
        rightValue = Number(rightValue || 0);
      } else {
        leftValue = String(
          leftValue || ""
        ).toLowerCase();

        rightValue = String(
          rightValue || ""
        ).toLowerCase();
      }

      if (leftValue < rightValue) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (leftValue > rightValue) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });

    return result;
  }, [
    records,
    search,
    statusFilter,
    confidenceFilter,
    sortField,
    sortDirection,
  ]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );

      return;
    }

    setSortField(field);
    setSortDirection("asc");
  }

  if (loading) {
    return (
      <section className="reconciliation-page">
        <div className="page-loading-state">
          <RefreshCcw
            size={18}
            className="loading-spin"
          />

          <span>
            Loading reconciliation data...
          </span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="reconciliation-page">
        <div className="page-error-state">
          <TriangleAlert size={22} />

          <h2>
            Unable to connect to ReconcileAI API
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadRecords}
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="reconciliation-page">
      <div className="page-heading-block">
        <span className="eyebrow">
          AI-assisted analysis
        </span>

        <h2>Reconciliation</h2>

        <p>
          Payment, settlement, and bank transaction
          matching with explainable confidence.
        </p>
      </div>

      <div className="reconciliation-summary-grid">
        <div className="summary-mini-card">
          <span>Total</span>
          <strong>{records.length}</strong>
        </div>

        <div className="summary-mini-card">
          <span>Matched</span>
          <strong>
            {summary.matched || 0}
          </strong>
        </div>

        <div className="summary-mini-card">
          <span>Review</span>
          <strong>
            {summary.review || 0}
          </strong>
        </div>

        <div className="summary-mini-card">
          <span>Unresolved</span>
          <strong>
            {summary.unresolved || 0}
          </strong>
        </div>

        <div className="summary-mini-card">
          <span>Excluded</span>
          <strong>
            {summary.excluded || 0}
          </strong>
        </div>
      </div>

      <div className="reconciliation-toolbar">
        <div className="reconciliation-search">
          <Search size={16} />

          <input
            type="search"
            placeholder="Search payment, settlement, bank txn..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="filter-group">
          <Filter size={15} />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">
              All statuses
            </option>

            {statuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status
                  .replaceAll("_", " ")
                  .replace(
                    /\b\w/g,
                    (letter) =>
                      letter.toUpperCase()
                  )}
              </option>
            ))}
          </select>

          <select
            value={confidenceFilter}
            onChange={(event) =>
              setConfidenceFilter(
                event.target.value
              )
            }
          >
            {confidenceFilters.map((filter) => (
              <option
                key={filter.value}
                value={filter.value}
              >
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <article className="reconciliation-table-panel">
        <div className="table-panel-heading">
          <div>
            <h3>Reconciliation Records</h3>

            <span>
              {filteredRecords.length} of{" "}
              {records.length} records
            </span>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="table-empty-state">
            No reconciliation records match the
            selected filters.
          </div>
        ) : (
          <div className="reconciliation-table-wrapper">
            <table className="reconciliation-table">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      onClick={() =>
                        handleSort("payment_id")
                      }
                    >
                      Payment ID
                      <ArrowDownUp size={12} />
                    </button>
                  </th>

                  <th>Settlement ID</th>

                  <th>Bank Transaction</th>

                  <th>
                    <button
                      type="button"
                      onClick={() =>
                        handleSort("status")
                      }
                    >
                      Status
                      <ArrowDownUp size={12} />
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      onClick={() =>
                        handleSort("confidence")
                      }
                    >
                      Confidence
                      <ArrowDownUp size={12} />
                    </button>
                  </th>

                  <th>Issue / Explanation</th>

                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
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
                      {record.settlement_id || "—"}
                    </td>

                    <td>
                      {record.bank_txn_id || "—"}
                    </td>

                    <td>
                      <StatusBadge
                        status={record.status}
                      />
                    </td>

                    <td>
                      <ConfidenceIndicator
                        value={record.confidence}
                      />
                    </td>

                    <td className="reconciliation-reason">
                      {record.reason || "—"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="row-view-button"
                        onClick={(event) => {
                          event.stopPropagation();

                          navigate(
                            `/reconciliation/${record.payment_id}`
                          );
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}   