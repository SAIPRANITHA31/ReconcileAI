import {
  Activity,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  RefreshCcw,
  ShieldCheck,
  Target,
  TriangleAlert,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

import {
  getMetrics,
  getReconciliation,
} from "../services/api.js";

function formatPercent(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return `${(Number(value) * 100).toFixed(2)}%`;
}

function formatReason(reason) {
  if (!reason) {
    return "No reason provided";
  }

  return reason
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

const STATUS_COLORS = {
  matched: "#9dbb52",
  review: "#d5a84b",
  unresolved: "#c86161",
  excluded: "#73786b",
};

export default function AnalyticsPage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [metrics, setMetrics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        reconciliationResponse,
        metricsResponse,
      ] = await Promise.all([
        getReconciliation(),
        getMetrics(),
      ]);

      setRecords(
        reconciliationResponse.records || []
      );

      setSummary(
        reconciliationResponse.summary || {}
      );

      setMetrics(metricsResponse || {});
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const statusData = useMemo(
    () => [
      {
        name: "Matched",
        key: "matched",
        value:
          summary.matched ??
          records.filter(
            (record) =>
              record.status === "matched"
          ).length,
      },
      {
        name: "Review",
        key: "review",
        value:
          summary.review ??
          records.filter(
            (record) =>
              record.status === "review"
          ).length,
      },
      {
        name: "Unresolved",
        key: "unresolved",
        value:
          summary.unresolved ??
          records.filter(
            (record) =>
              record.status === "unresolved"
          ).length,
      },
      {
        name: "Excluded",
        key: "excluded",
        value:
          summary.excluded ??
          records.filter(
            (record) =>
              record.status === "excluded"
          ).length,
      },
    ],
    [records, summary]
  );

  const confidenceData = useMemo(() => {
    const buckets = {
      high: 0,
      medium: 0,
      low: 0,
    };

    records.forEach((record) => {
      const confidence =
        Number(record.confidence) || 0;

      if (confidence >= 0.9) {
        buckets.high += 1;
      } else if (confidence >= 0.7) {
        buckets.medium += 1;
      } else {
        buckets.low += 1;
      }
    });

    return [
      {
        name: "High ≥90%",
        value: buckets.high,
      },
      {
        name: "Medium 70–89%",
        value: buckets.medium,
      },
      {
        name: "Low <70%",
        value: buckets.low,
      },
    ];
  }, [records]);

  const reasonData = useMemo(() => {
    const counts = {};

    records.forEach((record) => {
      if (record.status === "matched") {
        return;
      }

      const reason =
        record.reason ||
        "No reason provided";

      counts[reason] =
        (counts[reason] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([reason, count]) => ({
        reason: formatReason(reason),
        count,
      }))
      .sort(
        (first, second) =>
          second.count - first.count
      )
      .slice(0, 6);
  }, [records]);

  const attentionCount =
    (summary.review ??
      records.filter(
        (record) =>
          record.status === "review"
      ).length) +
    (summary.unresolved ??
      records.filter(
        (record) =>
          record.status === "unresolved"
      ).length);

  if (loading) {
    return (
      <section className="analytics-page">
        <div className="page-loading-state">
          <RefreshCcw
            size={18}
            className="loading-spin"
          />

          <span>
            Loading reconciliation analytics...
          </span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="analytics-page">
        <div className="page-error-state">
          <TriangleAlert size={22} />

          <h2>
            Unable to load analytics
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadAnalytics}
          >
            <RefreshCcw size={16} />
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="analytics-page">
      <div className="analytics-heading-row">
        <div className="page-heading-block">
          <span className="eyebrow">
            Reconciliation intelligence
          </span>

          <h2>Analytics</h2>

          <p>
            Operational reconciliation performance
            and model evaluation based on actual
            processed records.
          </p>
        </div>

        <button
          type="button"
          className="analytics-refresh-button"
          onClick={loadAnalytics}
        >
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>

      <div className="analytics-kpi-grid">
        <article className="analytics-kpi-card">
          <div className="analytics-kpi-icon">
            <Target size={17} />
          </div>

          <span>Precision</span>

          <strong>
            {formatPercent(
              metrics?.precision
            )}
          </strong>

          <p>
            Accuracy of predicted matches.
          </p>
        </article>

        <article className="analytics-kpi-card">
          <div className="analytics-kpi-icon">
            <Activity size={17} />
          </div>

          <span>Recall</span>

          <strong>
            {formatPercent(metrics?.recall)}
          </strong>

          <p>
            Coverage of true matches.
          </p>
        </article>

        <article className="analytics-kpi-card">
          <div className="analytics-kpi-icon">
            <BrainCircuit size={17} />
          </div>

          <span>F1 Score</span>

          <strong>
            {formatPercent(
              metrics?.f1 ??
                metrics?.f1_score
            )}
          </strong>

          <p>
            Balance between precision and recall.
          </p>
        </article>

        <article className="analytics-kpi-card">
          <div className="analytics-kpi-icon">
            <ShieldCheck size={17} />
          </div>

          <span>Records Evaluated</span>

          <strong>
            {metrics?.records_evaluated ??
              metrics?.total_records ??
              "—"}
          </strong>

          <p>
            Records used for model evaluation.
          </p>
        </article>
      </div>

      <div className="analytics-operational-grid">
        <article className="analytics-mini-card">
          <span>Total Records</span>

          <strong>{records.length}</strong>
        </article>

        <article className="analytics-mini-card">
          <span>Matched</span>

          <strong>
            {summary.matched ??
              statusData[0].value}
          </strong>
        </article>

        <article className="analytics-mini-card">
          <span>Needs Attention</span>

          <strong>{attentionCount}</strong>
        </article>

        <article className="analytics-mini-card">
          <span>Excluded</span>

          <strong>
            {summary.excluded ??
              statusData[3].value}
          </strong>
        </article>
      </div>

      <div className="analytics-main-grid">
        <article className="analytics-chart-card">
          <div className="analytics-card-heading">
            <div>
              <span className="panel-eyebrow">
                Reconciliation outcomes
              </span>

              <h3>Status Distribution</h3>
            </div>

            <BarChart3 size={17} />
          </div>

          <div className="analytics-chart-body">
            <ResponsiveContainer
              width="100%"
              height={250}
            >
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {statusData.map(
                    (entry) => (
                      <Cell
                        key={entry.key}
                        fill={
                          STATUS_COLORS[
                            entry.key
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="analytics-legend">
            {statusData.map((item) => (
              <div key={item.key}>
                <span
                  className="analytics-legend-dot"
                  style={{
                    background:
                      STATUS_COLORS[
                        item.key
                      ],
                  }}
                />

                <span>{item.name}</span>

                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-chart-card">
          <div className="analytics-card-heading">
            <div>
              <span className="panel-eyebrow">
                Model certainty
              </span>

              <h3>
                Confidence Distribution
              </h3>
            </div>

            <BrainCircuit size={17} />
          </div>

          <div className="analytics-chart-body">
            <ResponsiveContainer
              width="100%"
              height={250}
            >
              <BarChart
                data={confidenceData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.15}
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 9,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 9,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Bar
                  dataKey="value"
                  fill="#9dbb52"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="analytics-chart-card analytics-reasons-card">
        <div className="analytics-card-heading">
          <div>
            <span className="panel-eyebrow">
              Exception intelligence
            </span>

            <h3>
              Top Reconciliation Issues
            </h3>
          </div>

          <TriangleAlert size={17} />
        </div>

        {reasonData.length === 0 ? (
          <div className="analytics-empty">
            <CheckCircle2 size={23} />

            <h4>
              No reconciliation issues
            </h4>

            <p>
              No exception reasons are currently
              available.
            </p>
          </div>
        ) : (
          <div className="analytics-reason-chart">
            <ResponsiveContainer
              width="100%"
              height={280}
            >
              <BarChart
                data={reasonData}
                layout="vertical"
                margin={{
                  top: 10,
                  right: 25,
                  left: 25,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  opacity={0.15}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{
                    fontSize: 9,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="reason"
                  width={170}
                  tick={{
                    fontSize: 8,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  fill="#9dbb52"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>
    </section>
  );
}