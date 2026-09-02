import {
  BrainCircuit,
  CheckCircle2,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getReconciliation,
  investigatePayment,
  submitReview,
} from "../services/api.js";

import StatusBadge from "../components/reconciliation/StatusBadge.jsx";
import ConfidenceIndicator from "../components/reconciliation/ConfidenceIndicator.jsx";

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

export default function ReviewsPage() {
  const [records, setRecords] = useState([]);
  const [investigations, setInvestigations] =
    useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [reviewNotes, setReviewNotes] =
    useState({});

  const [reviewMessages, setReviewMessages] =
    useState({});

  const [busyPaymentId, setBusyPaymentId] =
    useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getReconciliation();

      const actionableRecords = (
        response.records || []
      ).filter((record) =>
        ["review", "unresolved"].includes(
          record.status
        )
      );

      setRecords(actionableRecords);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to load review queue."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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

  async function handleInvestigate(paymentId) {
    setBusyPaymentId(paymentId);

    setReviewMessages((current) => ({
      ...current,
      [paymentId]: "",
    }));

    try {
      const response =
        await investigatePayment(paymentId);

      setInvestigations((current) => ({
        ...current,
        [paymentId]: response,
      }));
    } catch (requestError) {
      setReviewMessages((current) => ({
        ...current,
        [paymentId]:
          requestError.message ||
          "AI investigation failed.",
      }));
    } finally {
      setBusyPaymentId("");
    }
  }

  async function handleReview(
    paymentId,
    decision
  ) {
    const note =
      reviewNotes[paymentId]?.trim() || "";

    if (!note) {
      setReviewMessages((current) => ({
        ...current,
        [paymentId]:
          "Please enter a reviewer note before submitting.",
      }));

      return;
    }

    setBusyPaymentId(paymentId);

    setReviewMessages((current) => ({
      ...current,
      [paymentId]: "",
    }));

    try {
      await submitReview(
        paymentId,
        decision,
        note
      );

      setReviewMessages((current) => ({
        ...current,
        [paymentId]:
          `Recommendation ${decision} and recorded in the audit trail.`,
      }));

      setReviewNotes((current) => ({
        ...current,
        [paymentId]: "",
      }));
    } catch (requestError) {
      setReviewMessages((current) => ({
        ...current,
        [paymentId]:
          requestError.message ||
          "Unable to save reviewer decision.",
      }));
    } finally {
      setBusyPaymentId("");
    }
  }

  if (loading) {
    return (
      <section className="reviews-page">
        <div className="page-loading-state">
          <RefreshCcw
            size={18}
            className="loading-spin"
          />

          <span>
            Loading AI recommendations...
          </span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="reviews-page">
        <div className="page-error-state">
          <TriangleAlert size={22} />

          <h2>
            Unable to load review queue
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadReviews}
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        </div>
      </section>
    );
  }

  const reviewCount = records.filter(
    (record) => record.status === "review"
  ).length;

  const unresolvedCount = records.filter(
    (record) =>
      record.status === "unresolved"
  ).length;

  return (
    <section className="reviews-page">
      <div className="page-heading-block">
        <span className="eyebrow">
          Human-in-the-loop AI governance
        </span>

        <h2>AI Recommendations</h2>

        <p>
          Review and approve AI-generated reconciliation
          recommendations while keeping humans in control.
        </p>
      </div>

      <div className="reviews-summary-grid">
        <article className="review-summary-card">
          <span>Total Requires Review</span>
          <strong>{records.length}</strong>
        </article>

        <article className="review-summary-card">
          <span>Review Status</span>
          <strong>{reviewCount}</strong>
        </article>

        <article className="review-summary-card">
          <span>Unresolved</span>
          <strong>{unresolvedCount}</strong>
        </article>
      </div>

      <div className="reviews-toolbar">
        <div className="reviews-search">
          <Search size={16} />

          <input
            type="search"
            placeholder="Search payment or discrepancy..."
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
            All review items
          </option>

          <option value="review">
            Review
          </option>

          <option value="unresolved">
            Unresolved
          </option>
        </select>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="reviews-empty-state">
          <ShieldCheck size={28} />

          <h3>
            No recommendations require review
          </h3>

          <p>
            No records currently match your selected
            filters.
          </p>
        </div>
      ) : (
        <div className="review-queue">
          {filteredRecords.map((record) => {
            const investigation =
              investigations[record.payment_id];

            const ai =
              investigation?.ai_investigation;

            const message =
              reviewMessages[
                record.payment_id
              ];

            const note =
              reviewNotes[record.payment_id] ||
              "";

            const busy =
              busyPaymentId ===
              record.payment_id;

            return (
              <article
                className="review-item-card"
                key={record.payment_id}
              >
                <div className="review-item-header">
                  <div>
                    <div className="review-id-row">
                      <span className="payment-id review-payment-id">
                        {record.payment_id}
                      </span>

                      <StatusBadge
                        status={record.status}
                      />
                    </div>

                    <p>
                      {record.reason || "—"}
                    </p>
                  </div>

                  <div className="review-confidence">
                    <span>
                      Reconciliation confidence
                    </span>

                    <ConfidenceIndicator
                      value={record.confidence}
                    />
                  </div>
                </div>

                <div className="review-record-grid">
                  <div>
                    <span>Settlement</span>
                    <strong>
                      {record.settlement_id ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Bank Transaction
                    </span>

                    <strong>
                      {record.bank_txn_id ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <strong>
                      {formatLabel(
                        record.status
                      )}
                    </strong>
                  </div>
                </div>

                {!ai ? (
                  <div className="review-ai-launch">
                    <div>
                      <BrainCircuit size={17} />

                      <span>
                        AI investigation has not yet
                        been generated for this item.
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        handleInvestigate(
                          record.payment_id
                        )
                      }
                    >
                      <Sparkles size={15} />

                      {busy
                        ? "Analyzing..."
                        : "Analyze"}
                    </button>
                  </div>
                ) : (
                  <div className="review-ai-panel">
                    <div className="review-ai-heading">
                      <div>
                        <span className="panel-eyebrow">
                          AI Recommendation
                        </span>

                        <h3>
                          {formatLabel(
                            ai.recommended_action
                          )}
                        </h3>
                      </div>

                      <span className="ai-badge">
                        <Sparkles size={13} />
                        Local ML
                      </span>
                    </div>

                    <div className="review-ai-grid">
                      <div>
                        <span>
                          Classification
                        </span>

                        <strong>
                          {formatLabel(
                            ai.category
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          AI Confidence
                        </span>

                        <strong>
                          {(
                            Number(
                              ai.confidence ||
                                0
                            ) * 100
                          ).toFixed(2)}
                          %
                        </strong>
                      </div>
                    </div>

                    <div className="review-ai-summary">
                      <span>
                        Reason
                      </span>

                      <p>
                        {ai.summary ||
                          "—"}
                      </p>
                    </div>

                    <div className="review-ai-evidence">
                      <span>
                        Evidence
                      </span>

                      <ul>
                        {(ai.evidence ||
                          []).map(
                          (item) => (
                            <li key={item}>
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="review-human-control">
                      <ShieldCheck
                        size={15}
                      />

                      <span>
                        AI recommends; the finance
                        reviewer remains responsible
                        for the final decision.
                      </span>
                    </div>

                    <div className="review-input-section">
                      <label
                        htmlFor={`review-${record.payment_id}`}
                      >
                        Reviewer note
                      </label>

                      <textarea
                        id={`review-${record.payment_id}`}
                        rows="3"
                        maxLength={300}
                        value={note}
                        placeholder="Explain why you approve or reject this recommendation..."
                        onChange={(
                          event
                        ) =>
                          setReviewNotes(
                            (current) => ({
                              ...current,
                              [record.payment_id]:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />

                      <div className="review-note-footer">
                        <span>
                          {note.length}/300
                        </span>
                      </div>
                    </div>

                    <div className="review-card-actions">
                      <button
                        type="button"
                        className="approve-action"
                        disabled={busy}
                        onClick={() =>
                          handleReview(
                            record.payment_id,
                            "approved"
                          )
                        }
                      >
                        <CheckCircle2
                          size={15}
                        />
                        Approve
                      </button>

                      <button
                        type="button"
                        className="reject-action"
                        disabled={busy}
                        onClick={() =>
                          handleReview(
                            record.payment_id,
                            "rejected"
                          )
                        }
                      >
                        <XCircle
                          size={15}
                        />
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {message && (
                  <div className="review-card-message">
                    {message}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}