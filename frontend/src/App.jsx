import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [metrics, setMetrics] = useState(null);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

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

        const metricsData = await metricsResponse.json();
        const recordsData = await recordsResponse.json();

        setMetrics(metricsData);
        setRecords(recordsData.records);
      } catch (err) {
        setError(
          "Could not connect to the backend. Confirm that FastAPI is running on port 8000."
        );
      }
    }

    loadDashboard();
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!metrics) {
    return <div className="loading">Analyzing financial records...</div>;
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

      <section className="metric-grid">
        {cards.map((card) => (
          <article className="metric-card" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </section>

      <section className="table-section">
        <div className="section-heading">
          <div>
            <h2>Reconciliation results</h2>
            <p>AI-assisted analysis of payments and bank settlements</p>
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
              </tr>
            </thead>

            <tbody>
              {records.slice(0, 20).map((record) => (
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