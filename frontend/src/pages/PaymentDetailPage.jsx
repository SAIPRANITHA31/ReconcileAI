import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import ConfidenceIndicator from "../components/reconciliation/ConfidenceIndicator.jsx";
import StatusBadge from "../components/reconciliation/StatusBadge.jsx";

import {
  getReconciliationById,
  investigatePayment,
  submitReview,
} from "../services/api.js";

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

export default function PaymentDetailPage() {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [investigation, setInvestigation] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] =
    useState(false);

  const [error, setError] = useState("");

  const [reviewNote, setReviewNote] =
    useState("");

  const [reviewStatus, setReviewStatus] =
    useState("");

  const [reviewing, setReviewing] =
    useState(false);

  const loadRecord = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await getReconciliationById(paymentId);

      setRecord(response);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to load payment details."
      );
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  async function runInvestigation() {
    setInvestigating(true);
    setError("");
    setReviewStatus("");

    try {
      const response =
        await investigatePayment(paymentId);

      setInvestigation(response);
    } catch (requestError) {
      setError(
        requestError.message ||
          "AI investigation could not be completed."
      );
    } finally {
      setInvestigating(false);
    }
  }

  async function handleReview(decision) {
    if (!reviewNote.trim()) {
      setReviewStatus(
        "Please enter a reviewer note before submitting."
      );

      return;
    }

    setReviewing(true);
    setReviewStatus("");

    try {
      await submitReview(
        paymentId,
        decision,
        reviewNote.trim()
      );

      setReviewStatus(
        `Recommendation ${decision} and recorded in the audit trail.`
      );

      setReviewNote("");
    } catch (requestError) {
      setReviewStatus(
        requestError.message ||
          "Unable to record reviewer decision."
      );
    } finally {
      setReviewing(false);
    }
  }

  if (loading) {
    return (
      <section className="payment-detail-page">
        <div className="page-loading-state">
          <RefreshCcw
            size={18}
            className="loading-spin"
          />

          <span>
            Loading payment investigation...
          </span>
        </div>
      </section>
    );
  }

  if (error && !record) {
    return (
      <section className="payment-detail-page">
        <div className="page-error-state">
          <TriangleAlert size={22} />

          <h2>Unable to load payment</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadRecord}
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!record) {
    return null;
  }

  const canInvestigate = [
    "review",
    "unresolved",
  ].includes(record.status);

  return (
    <section className="payment-detail-page">
      <button
        type="button"
        className="back-link"
        onClick={() =>
          navigate("/reconciliation")
        }
      >
        <ArrowLeft size={15} />
        Back to reconciliation
      </button>

      <div className="payment-detail-header">
        <div>
          <span className="eyebrow">
            Payment investigation
          </span>

          <div className="payment-title-row">
            <h2>{record.payment_id}</h2>

            <StatusBadge
              status={record.status}
            />
          </div>

          <p>
            Explainable reconciliation evidence and
            human-reviewed AI recommendations.
          </p>
        </div>

        <div className="payment-confidence-card">
          <span>Reconciliation confidence</span>

          <strong>
            {Math.round(
              Number(record.confidence || 0) *
                100
            )}
            %
          </strong>

          <ConfidenceIndicator
            value={record.confidence}
          />
        </div>
      </div>

      {error && (
        <div className="detail-error-banner">
          <TriangleAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="payment-comparison-grid">
        <article className="comparison-card">
          <div className="comparison-card-heading">
            <span>Payment</span>
            <CheckCircle2 size={17} />
          </div>

          <dl>
            <div>
              <dt>Payment ID</dt>
              <dd>{record.payment_id}</dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge
                  status={record.status}
                />
              </dd>
            </div>

            <div>
              <dt>Amount</dt>
              <dd>—</dd>
            </div>

            <div>
              <dt>Date</dt>
              <dd>—</dd>
            </div>
          </dl>
        </article>

        <article className="comparison-card">
          <div className="comparison-card-heading">
            <span>Settlement</span>
            <ShieldCheck size={17} />
          </div>

          <dl>
            <div>
              <dt>Settlement ID</dt>
              <dd>
                {record.settlement_id || "—"}
              </dd>
            </div>

            <div>
              <dt>Amount</dt>
              <dd>—</dd>
            </div>

            <div>
              <dt>Date</dt>
              <dd>—</dd>
            </div>

            <div>
              <dt>Reference</dt>
              <dd>—</dd>
            </div>
          </dl>
        </article>

        <article className="comparison-card">
          <div className="comparison-card-heading">
            <span>Bank Transaction</span>
            <BrainCircuit size={17} />
          </div>

          <dl>
            <div>
              <dt>Transaction ID</dt>
              <dd>
                {record.bank_txn_id || "—"}
              </dd>
            </div>

            <div>
              <dt>Amount</dt>
              <dd>—</dd>
            </div>

            <div>
              <dt>Date</dt>
              <dd>—</dd>
            </div>

            <div>
              <dt>Reference</dt>
              <dd>—</dd>
            </div>
          </dl>
        </article>
      </div>

      <article className="reconciliation-explanation-card">
        <div className="section-icon-heading">
          <div className="section-icon">
            <ShieldCheck size={17} />
          </div>

          <div>
            <span>
              Reconciliation evidence
            </span>

            <h3>Why this result was produced</h3>
          </div>
        </div>

        <p>{record.reason || "—"}</p>
      </article>

      {!investigation && (
        <article className="ai-investigation-launch-card">
          <div>
            <span className="panel-eyebrow">
              AI Analysis
            </span>

            <h3>
              Investigate this reconciliation
            </h3>

            <p>
              ReconcileAI can classify the discrepancy,
              explain the evidence, and recommend the
              next finance action.
            </p>
          </div>

          {canInvestigate ? (
            <button
              type="button"
              onClick={runInvestigation}
              disabled={investigating}
            >
              <Sparkles size={16} />

              {investigating
                ? "Analyzing..."
                : "Run AI Investigation"}
            </button>
          ) : (
            <span className="investigation-not-required">
              Investigation not required
            </span>
          )}
        </article>
      )}

      {investigation && (
        <>
          <article className="ai-analysis-card">
            <div className="ai-analysis-header">
              <div>
                <span className="panel-eyebrow">
                  AI Analysis
                </span>

                <h3>
                  Explainable discrepancy analysis
                </h3>
              </div>

              <div className="ai-badge">
                <Sparkles size={14} />
                Local ML
              </div>
            </div>

            <div className="ai-analysis-metrics">
              <div>
                <span>Classification</span>
                <strong>
                  {formatLabel(
                    investigation
                      .ai_investigation
                      .category
                  )}
                </strong>
              </div>

              <div>
                <span>AI Confidence</span>
                <strong>
                  {(
                    investigation
                      .ai_investigation
                      .confidence * 100
                  ).toFixed(2)}
                  %
                </strong>
              </div>

              <div>
                <span>
                  Recommended Action
                </span>

                <strong>
                  {formatLabel(
                    investigation
                      .ai_investigation
                      .recommended_action
                  )}
                </strong>
              </div>
            </div>

            <div className="ai-summary-box">
              <h4>Analysis summary</h4>

              <p>
                {
                  investigation
                    .ai_investigation
                    .summary
                }
              </p>
            </div>

            <div className="ai-evidence-box">
              <h4>Evidence used</h4>

              <ul>
                {investigation
                  .ai_investigation
                  .evidence.map((item) => (
                    <li key={item}>
                      {item}
                    </li>
                  ))}
              </ul>
            </div>

            <div className="human-control-banner">
              <ShieldCheck size={16} />

              <span>
                AI recommendations never modify financial
                records automatically. Human approval is
                required.
              </span>
            </div>
          </article>

          <article className="recommendation-card">
            <div className="recommendation-header">
              <div>
                <span className="panel-eyebrow">
                  Human-in-the-loop review
                </span>

                <h3>Recommended Action</h3>
              </div>

              <strong>
                {formatLabel(
                  investigation
                    .ai_investigation
                    .recommended_action
                )}
              </strong>
            </div>

            <div className="review-note-section">
              <label htmlFor="review-note">
                Reviewer note
              </label>

              <textarea
                id="review-note"
                rows="4"
                maxLength={300}
                value={reviewNote}
                placeholder="Explain why you approve or reject this recommendation..."
                onChange={(event) =>
                  setReviewNote(
                    event.target.value
                  )
                }
              />

              <div className="review-character-count">
                {reviewNote.length}/300
              </div>
            </div>

            <div className="detail-review-actions">
              <button
                type="button"
                className="approve-action"
                disabled={reviewing}
                onClick={() =>
                  handleReview("approved")
                }
              >
                <CheckCircle2 size={16} />
                Approve
              </button>

              <button
                type="button"
                className="reject-action"
                disabled={reviewing}
                onClick={() =>
                  handleReview("rejected")
                }
              >
                <XCircle size={16} />
                Reject
              </button>
            </div>

            {reviewStatus && (
              <div className="review-status-message">
                {reviewStatus}
              </div>
            )}
          </article>
        </>
      )}
    </section>
  );
}