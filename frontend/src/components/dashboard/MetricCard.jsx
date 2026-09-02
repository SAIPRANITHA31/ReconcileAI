export default function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "default",
}) {
  return (
    <article className={`dashboard-metric-card tone-${tone}`}>
      <div className="metric-card-top">
        <span>{label}</span>

        {Icon && (
          <div className="metric-icon">
            <Icon size={17} />
          </div>
        )}
      </div>

      <strong className="metric-value">{value}</strong>

      <p>{description}</p>
    </article>
  );
}