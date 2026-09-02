const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      "Unable to complete the request.";

    throw new Error(message);
  }

  return data;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function checkHealth() {
  return request("/health");
}

export function getMetrics() {
  return request("/api/metrics");
}

export function getReconciliation() {
  return request("/api/reconciliation");
}

export function getReconciliationById(paymentId) {
  return request(
    `/api/reconciliation/${encodeURIComponent(paymentId)}`
  );
}

export function investigatePayment(paymentId) {
  return request(
    `/api/investigate/${encodeURIComponent(paymentId)}`,
    {
      method: "POST",
    }
  );
}

export function submitReview(paymentId, decision, note) {
  return request(
    `/api/review/${encodeURIComponent(paymentId)}`,
    {
      method: "POST",
      body: JSON.stringify({
        decision,
        note,
      }),
    }
  );
}

export function getAuditEvents() {
  return request("/api/audit");
}