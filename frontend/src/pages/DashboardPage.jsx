import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import MetricCard from "../components/dashboard/MetricCard.jsx";

import {
  checkHealth,
  getMetrics,
  getReconciliation,
} from "../services/api.js";

function formatPercent(value) {
  if (typeof value !== "number") {
    return "—";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusTone(status) {
  switch (status) {
    case "matched":
      return "success";

    case "review":
      return "warning";

    case "unresolved":
      return "danger";

    case "excluded":
      return "muted";

    default:
      return "neutral";
  }
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton-line skeleton-heading" />

      <div className="dashboard-kpi-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="skeleton-card"
            key={index}
          >
            <div className="skeleton-line skeleton-small" />
            <div className="skeleton-line skeleton-value" />
            <div className="skeleton-line skeleton-medium" />
          </div>
        ))}
      </div>

      <div className="dashboard-chart-grid">
        <div className="skeleton-panel" />
        <div className="skeleton-panel" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [records, setRecords] = useState([]);
  const [health, setHealth] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        metricsResponse,
        reconciliationResponse,
        healthResponse,
      ] = await Promise.all([
        getMetrics(),
        getReconciliation(),
        checkHealth(),
      ]);

      setMetrics(metricsResponse);
      setRecords(reconciliationResponse.records || []);
      setHealth(healthResponse);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to connect to ReconcileAI API."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const derived = useMemo(() => {
    const total = records.length;

    const matched = records.filter(
      (record) => record.status === "matched"
    ).length;

    const unresolved = records.filter(
      (record) => record.status === "unresolved"
    ).length;

    const review = records.filter(
      (record) => record.status === "review"
    ).length;

    const excluded = records.filter(
      (record) => record.status === "excluded"
    ).length;

    const actionable = unresolved + review;

    const averageConfidence =
      total > 0
        ? records.reduce(
            (sum, record) =>
              sum + Number(record.confidence || 0),
            0
          ) / total
        : 0;

    const matchRate = total > 0 ? matched / total : 0;

    return {
      total,
      matched,
      unresolved,
      review,
      excluded,
      actionable,
      averageConfidence,
      matchRate,
    };
  }, [records]);

  const statusData = useMemo(() => {
    return [
      {
        name: "Matched",
        value: derived.matched,
        color: "var(--olive-primary)",
      },
      {
        name: "Review",
        value: derived.review,
        color: "var(--warning)",
      },
      {
        name: "Unresolved",
        value: derived.unresolved,
        color: "var(--danger)",
      },
      {
        name: "Excluded",
        value: derived.excluded,
        color: "var(--text-tertiary)",
      },
    ].filter((item) => item.value > 0);
  }, [derived]);

  const confidenceData = useMemo(() => {
    const groups = [
      {
        range: "90–100%",
        min: 0.9,
        max: 1.01,
        count: 0,
      },
      {
        range: "80–90%",
        min: 0.8,
        max: 0.9,
        count: 0,
      },
      {
        range: "70–80%",
        min: 0.7,
        max: 0.8,
        count: 0,
      },
      {
        range: "<70%",
        min: 0,
        max: 0.7,
        count: 0,
      },
    ];

    records.forEach((record) => {
      const confidence = Number(record.confidence || 0);

      const group = groups.find(
        (item) =>
          confidence >= item.min &&
          confidence < item.max
      );

      if (group) {
        group.count += 1;
      }
    });

    return groups;
  }, [records]);

  const performanceData = useMemo(() => {
    if (!metrics) {
      return [];
    }

    return [
      {
        metric: "Precision",
        value: Number(metrics.precision || 0) * 100,
      },
      {
        metric: "Recall",
        value: Number(metrics.recall || 0) * 100,
      },
      {
        metric: "F1 Score",
        value: Number(metrics.f1 || 0) * 100,
      },
    ];
  }, [metrics]);

  const insights = useMemo(() => {
    const items = [];

    if (derived.actionable > 0) {
      items.push(
        `${derived.actionable} payment${
          derived.actionable === 1 ? "" : "s"
        } currently require finance-team attention.`
      );
    }

    if (derived.unresolved > 0) {
      items.push(
        `${derived.unresolved} reconciliation record${
          derived.unresolved === 1 ? " is" : "s are"
        } unresolved.`
      );
    }

    if (derived.total > 0) {
      items.push(
        `Average reconciliation confidence is ${formatPercent(
          derived.averageConfidence
        )}.`
      );
    }

    if (metrics) {
      items.push(
        `Current reconciliation F1 score is ${formatPercent(
          metrics.f1
        )}.`
      );
    }

    return items;
  }, [derived, metrics]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <section className="dashboard-error-state">
        <div className="error-state-icon">
          <TriangleAlert size={22} />
        </div>

        <h2>Unable to load financial intelligence</h2>

        <p>{error}</p>

        <button
          type="button"
          onClick={loadDashboard}
        >
          <RefreshCcw size={16} />
          Retry connection
        </button>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">
            Financial intelligence overview
          </span>

          <h2>Good morning, Finance Team</h2>

          <p>
            Here's your reconciliation overview.
          </p>
        </div>

        <div className="dashboard-service-status">
          <span className="online-dot" />

          <div>
            <strong>
              {health?.status === "ok"
                ? "ReconcileAI operational"
                : "API status unavailable"}
            </strong>

            <span>
              Live reconciliation engine connected
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-kpi-grid">
        <MetricCard
          label="Total Records"
          value={derived.total}
          description="Payments evaluated by reconciliation"
          icon={Activity}
        />

        <MetricCard
          label="Matched"
          value={derived.matched}
          description={`${formatPercent(
            derived.matchRate
          )} match rate`}
          icon={CheckCircle2}
          tone="success"
        />

        <MetricCard
          label="Needs Attention"
          value={derived.actionable}
          description={`${derived.review} review · ${derived.unresolved} unresolved`}
          icon={TriangleAlert}
          tone={
            derived.actionable > 0
              ? "warning"
              : "success"
          }
        />

        <MetricCard
          label="AI Confidence"
          value={formatPercent(
            derived.averageConfidence
          )}
          description="Average reconciliation confidence"
          icon={BrainCircuit}
        />

        <MetricCard
          label="Precision"
          value={formatPercent(metrics?.precision)}
          description="Correctness of predicted matches"
          icon={ShieldCheck}
          tone="success"
        />

        <MetricCard
          label="F1 Score"
          value={formatPercent(metrics?.f1)}
          description="Balanced reconciliation performance"
          icon={Sparkles}
        />
      </div>

      <div className="dashboard-chart-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="panel-eyebrow">
                Current distribution
              </span>

              <h3>Reconciliation Status</h3>
            </div>

            <span className="panel-count">
              {derived.total} records
            </span>
          </div>

          {statusData.length === 0 ? (
            <div className="chart-empty-state">
              No reconciliation records available.
            </div>
          ) : (
            <div className="status-chart-layout">
              <div className="chart-container donut-container">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {statusData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background:
                          "var(--surface-primary)",
                        border:
                          "1px solid var(--border-primary)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="donut-center">
                  <strong>{derived.total}</strong>
                  <span>Total</span>
                </div>
              </div>

              <div className="status-legend">
                {statusData.map((item) => (
                  <div
                    className="status-legend-row"
                    key={item.name}
                  >
                    <div>
                      <span
                        className="legend-dot"
                        style={{
                          background: item.color,
                        }}
                      />

                      <span>{item.name}</span>
                    </div>

                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="panel-eyebrow">
                Model certainty
              </span>

              <h3>Confidence Distribution</h3>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={confidenceData}>
                <CartesianGrid
                  stroke="var(--border-primary)"
                  vertical={false}
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="range"
                  tick={{
                    fill: "var(--text-tertiary)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fill: "var(--text-tertiary)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  cursor={{
                    fill: "var(--surface-hover)",
                  }}
                  contentStyle={{
                    background:
                      "var(--surface-primary)",
                    border:
                      "1px solid var(--border-primary)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                  }}
                />

                <Bar
                  dataKey="count"
                  name="Records"
                  fill="var(--olive-primary)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className="dashboard-secondary-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="panel-eyebrow">
                Evaluation metrics
              </span>

              <h3>Reconciliation Performance</h3>
            </div>
          </div>

          <div className="performance-list">
            {performanceData.map((item) => (
              <div
                className="performance-row"
                key={item.metric}
              >
                <div className="performance-label">
                  <span>{item.metric}</span>

                  <strong>
                    {item.value.toFixed(1)}%
                  </strong>
                </div>

                <div className="performance-track">
                  <span
                    style={{
                      width: `${Math.min(
                        item.value,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="performance-details">
            <div>
              <span>True positives</span>
              <strong>
                {metrics?.true_positives ?? "—"}
              </strong>
            </div>

            <div>
              <span>False positives</span>
              <strong>
                {metrics?.false_positives ?? "—"}
              </strong>
            </div>

            <div>
              <span>False negatives</span>
              <strong>
                {metrics?.false_negatives ?? "—"}
              </strong>
            </div>
          </div>
        </article>

        <article className="dashboard-panel ai-insights-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="panel-eyebrow">
                AI insight
              </span>

              <h3>What Needs Attention</h3>
            </div>

            <Sparkles
              size={18}
              className="insight-heading-icon"
            />
          </div>

          {insights.length === 0 ? (
            <div className="chart-empty-state">
              No actionable insights available.
            </div>
          ) : (
            <div className="insight-list">
              {insights.map((insight, index) => (
                <div
                  className="insight-item"
                  key={insight}
                >
                  <span>{index + 1}</span>

                  <p>{insight}</p>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      <article className="dashboard-panel activity-panel">
        <div className="dashboard-panel-heading">
          <div>
            <span className="panel-eyebrow">
              Current reconciliation activity
            </span>

            <h3>Payment Reconciliation</h3>
          </div>

          <button
            type="button"
            className="text-action"
            onClick={() =>
              navigate("/reconciliation")
            }
          >
            View all
          </button>
        </div>

        {records.length === 0 ? (
          <div className="chart-empty-state">
            No reconciliation activity available.
          </div>
        ) : (
          <div className="dashboard-activity-table-wrapper">
            <table className="dashboard-activity-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Settlement</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Explanation</th>
                </tr>
              </thead>

              <tbody>
                {records.slice(0, 8).map((record) => (
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
                      <span
                        className={`status-badge status-${getStatusTone(
                          record.status
                        )}`}
                      >
                        {formatStatus(record.status)}
                      </span>
                    </td>

                    <td>
                      <div className="confidence-cell">
                        <span>
                          {formatPercent(
                            Number(
                              record.confidence || 0
                            )
                          )}
                        </span>

                        <div className="confidence-mini-track">
                          <span
                            style={{
                              width: `${Math.round(
                                Number(
                                  record.confidence || 0
                                ) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="reason-cell">
                      {record.reason || "—"}
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