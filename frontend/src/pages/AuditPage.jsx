import {
  RefreshCcw,
  Search,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getAuditEvents } from "../services/api.js";

function formatLabel(value) {
  if (!value) {
    return "—";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function AuditPage() {
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] =
    useState("all");

  const loadAudit = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAuditEvents();

      setEvents(response.events || []);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to load audit trail."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesDecision =
        decisionFilter === "all" ||
        event.decision === decisionFilter;

      if (!matchesDecision) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        event.payment_id,
        event.decision,
        event.classification,
        event.recommended_action,
        event.note,
        event.actor,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [
    events,
    search,
    decisionFilter,
  ]);

  const approvedCount = useMemo(
    () =>
      events.filter(
        (event) =>
          event.decision === "approved"
      ).length,
    [events]
  );

  const rejectedCount = useMemo(
    () =>
      events.filter(
        (event) =>
          event.decision === "rejected"
      ).length,
    [events]
  );

  if (loading) {
    return (
      <section className="audit-page">
        <div className="page-loading-state">
          <RefreshCcw
            size={18}
            className="loading-spin"
          />

          <span>Loading audit trail...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="audit-page">
        <div className="page-error-state">
          <TriangleAlert size={22} />

          <h2>Unable to load audit trail</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadAudit}
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="audit-page">
      <div className="page-heading-block">
        <span className="eyebrow">
          Human-reviewed AI governance
        </span>

        <h2>Audit Trail</h2>

        <p>
          Immutable history of finance-team decisions
          made on AI reconciliation recommendations.
        </p>
      </div>

      <div className="audit-summary-grid">
        <article className="audit-summary-card">
          <span>Total Decisions</span>
          <strong>{events.length}</strong>
        </article>

        <article className="audit-summary-card">
          <span>Approved</span>
          <strong>{approvedCount}</strong>
        </article>

        <article className="audit-summary-card">
          <span>Rejected</span>
          <strong>{rejectedCount}</strong>
        </article>
      </div>

      <div className="audit-toolbar">
        <div className="audit-search">
          <Search size={16} />

          <input
            type="search"
            placeholder="Search payment, classification, reviewer note..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={decisionFilter}
          onChange={(event) =>
            setDecisionFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All decisions
          </option>

          <option value="approved">
            Approved
          </option>

          <option value="rejected">
            Rejected
          </option>
        </select>

        <button
          type="button"
          className="audit-refresh-button"
          onClick={loadAudit}
        >
          <RefreshCcw size={15} />
          Refresh
        </button>
      </div>

      <article className="audit-panel">
        <div className="audit-panel-heading">
          <div>
            <div className="audit-heading-icon">
              <ShieldCheck size={17} />
            </div>

            <div>
              <h3>
                Review Decision History
              </h3>

              <span>
                {filteredEvents.length} event
                {filteredEvents.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="audit-empty-state">
            <ShieldCheck size={26} />

            <h3>No audit events found</h3>

            <p>
              Human-reviewed AI decisions will appear
              here after a recommendation is approved
              or rejected.
            </p>
          </div>
        ) : (
          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Payment</th>
                  <th>Decision</th>
                  <th>Classification</th>
                  <th>
                    Recommended Action
                  </th>
                  <th>ML Confidence</th>
                  <th>Reviewer Note</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="audit-time">
                      {formatDate(
                        event.created_at
                      )}
                    </td>

                    <td>
                      <span className="payment-id">
                        {event.payment_id}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`audit-decision audit-${event.decision}`}
                      >
                        {formatLabel(
                          event.decision
                        )}
                      </span>
                    </td>

                    <td>
                      {formatLabel(
                        event.classification
                      )}
                    </td>

                    <td>
                      {formatLabel(
                        event.recommended_action
                      )}
                    </td>

                    <td>
                      {typeof event.model_confidence ===
                      "number"
                        ? `${(
                            event.model_confidence *
                            100
                          ).toFixed(2)}%`
                        : "—"}
                    </td>

                    <td className="audit-note">
                      {event.note || "—"}
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