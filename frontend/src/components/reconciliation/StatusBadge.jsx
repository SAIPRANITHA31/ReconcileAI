function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTone(status) {
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

export default function StatusBadge({ status }) {
  return (
    <span
      className={`status-badge status-${getTone(status)}`}
    >
      {formatStatus(status)}
    </span>
  );
}