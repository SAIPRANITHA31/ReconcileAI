export default function ConfidenceIndicator({
  value = 0,
}) {
  const normalized = Math.max(
    0,
    Math.min(Number(value) || 0, 1)
  );

  const percent = Math.round(normalized * 100);

  return (
    <div className="confidence-indicator">
      <span>{percent}%</span>

      <div className="confidence-track">
        <div
          className="confidence-fill"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}