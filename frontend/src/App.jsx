import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [metrics, setMetrics] = useState(null);
  const [records, setRecords] = useState([]);
  const [investigation, setInvestigation] = useState(null);
  const [investigatingId, setInvestigatingId] = useState("");
  const [error, setError] = useState("");
  const investigationRef = useRef(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [metricsResponse, recordsResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/metrics"),
          fetch("http://127.0.0.1:8000/api/reconciliation"),
        ]);

        if (!metricsResponse.ok || !recordsResponse.ok) {
          throw new Error("Backend request failed");
        }

        setMetrics(await metricsResponse.json());

        const recordsData = await recordsResponse.json();
        setRecords(recordsData.records);
      } catch {
        setError(
          "Could not connect to the backend. Confirm that FastAPI is running."
        );
      }
    }

    loadDashboard();
  }, []);
  useEffect(() => {
  if (investigation) {
    investigationRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [investigation]);

  async function investigateRecord(paymentId) {
    setInvestigatingId(paymentId);
    setInvestigation(null);
    setError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/investigate/${paymentId}`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Investigation failed");
      }

      setInvestigation(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setInvestigatingId("");
    }
  }

  if (!metrics) {
    return (
      <div className={error ? "error-message" : "loading"}>
        {error || "Analyzing financial records..."}
      </div>
    );
  }

  const cards = [
    {
      label: "Records evaluated",
      value: metrics.records_evaluated,
    },
    {
      label: "Precision",
      value: `${(metrics.precision * 100).toFixed(2)}%`,
    },
    {
      label: "Recall",
      value: `${(metrics.recall * 100).toFixed(2)}%`,
    },
    {
      label: "F1 score",
      value: `${(metrics.f1 * 100).toFixed(2)}%`,
    },
  ];

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <p className="eyebrow">AI Finance Controller</p>
          <h1>ReconcileAI</h1>
          <p className="subtitle">
            Explainable payment and settlement reconciliation
          </p>
        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          Backend connected
        </div>
      </header>

      <section
       ref={investigationRef}
         className="investigation-panel">
        {cards.map((card) => (
          <article className="metric-card" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </section>

      {error && <div className="error-banner">{error}</div>}

      {investigation && (
        <section className="investigation-panel">
          <div className="investigation-heading">
            <div>
              <p className="eyebrow">Local ML investigation</p>
              <h2>{investigation.payment_id}</h2>
            </div>

            <span className="approval-badge">
              Human approval required
            </span>
          </div>

          <div className="investigation-grid">
            <div>
              <span>Classification</span>
              <strong>
                {investigation.ai_investigation.category.replaceAll("_", " ")}
              </strong>
            </div>

            <div>
              <span>ML confidence</span>
              <strong>
                {(
                  investigation.ai_investigation.confidence * 100
                ).toFixed(2)}
                %
              </strong>
            </div>

            <div>
              <span>Recommended action</span>
              <strong>
                {investigation.ai_investigation.recommended_action.replaceAll(
                  "_",
                  " "
                )}
              </strong>
            </div>
          </div>

          <div className="explanation-box">
            <h3>Investigation explanation</h3>
            <p>{investigation.ai_investigation.summary}</p>

            <h3>Evidence used</h3>
            <ul>
              {investigation.ai_investigation.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="policy-message">
            The model can recommend an action, but it cannot modify financial
            records or approve money-related decisions.
          </div>
        </section>
      )}

      <section className="table-section">
        <div className="section-heading">
          <div>
            <h2>Reconciliation results</h2>
            <p>AI-assisted analysis of payments and settlements</p>
          </div>

          <span>{records.length} records</span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Settlement ID</th>
                <th>Bank transaction</th>
                <th>Status</th>
                <th>Confidence</th>
                <th>Explanation</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr key={record.payment_id}>
                  <td className="identifier">{record.payment_id}</td>
                  <td>{record.settlement_id || "—"}</td>
                  <td>{record.bank_txn_id || "—"}</td>

                  <td>
                    <span className={`status ${record.status}`}>
                      {record.status}
                    </span>
                  </td>

                  <td>{Math.round(record.confidence * 100)}%</td>
                  <td>{record.reason}</td>

                  <td>
                    {["review", "unresolved"].includes(record.status) ? (
                      <button
                        className="investigate-button"
                        disabled={investigatingId === record.payment_id}
                        onClick={() =>
                          investigateRecord(record.payment_id)
                        }
                      >
                        {investigatingId === record.payment_id
                          ? "Analyzing..."
                          : "Investigate"}
                      </button>
                    ) : (
                      <span className="not-required">Not required</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default App;