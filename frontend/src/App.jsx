import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppShell from "./components/layout/AppShell.jsx";

import DashboardPage from "./pages/DashboardPage.jsx";
import ReconciliationPage from "./pages/ReconciliationPage.jsx";
import PaymentDetailPage from "./pages/PaymentDetailPage.jsx";
import AuditPage from "./pages/AuditPage.jsx";
import ReviewsPage from "./pages/ReviewsPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";
import RecoveryPage from "./pages/RecoveryPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

import "./App.css";

function PlaceholderPage({ title, description }) {
  return (
    <section className="placeholder-page">
      <span className="eyebrow">
        ReconcileAI workspace
      </span>

      <h2>{title}</h2>

      <p>{description}</p>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          index
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/reconciliation"
          element={<ReconciliationPage />}
        />

        <Route
          path="/reconciliation/:paymentId"
          element={<PaymentDetailPage />}
        />

        <Route
  path="/recovery"
  element={<RecoveryPage />}
/>

        <Route
  path="/payments"
  element={<PaymentsPage />}
/>

        <Route
  path="/reviews"
  element={<ReviewsPage />}
/>

        <Route
  path="/audit"
  element={<AuditPage />}
/>

        <Route
  path="/analytics"
  element={<AnalyticsPage />}
/>

        <Route
  path="/settings"
  element={<SettingsPage />}
/>

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Route>
    </Routes>
  );
} 