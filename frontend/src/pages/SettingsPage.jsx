import {
  Activity,
  CheckCircle2,
  Moon,
  RefreshCcw,
  Server,
  Settings,
  Sun,
  TriangleAlert,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  checkHealth,
  getApiBaseUrl,
} from "../services/api.js";

import { useTheme } from "../context/ThemeContext.jsx";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await checkHealth();
      setHealth(response);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to reach backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  return (
    <section className="settings-page">
      <div className="settings-heading-row">
        <div className="page-heading-block">
          <span className="eyebrow">
            Workspace configuration
          </span>

          <h2>Settings</h2>

          <p>
            Manage ReconcileAI appearance and review
            current system configuration.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* WORKSPACE CARD */}
        <article className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-icon">
              <Settings size={17} />
            </div>

            <div>
              <h3>Workspace</h3>

              <p>
                Product identity and environment.
              </p>
            </div>
          </div>

          <div className="settings-list">
            <div className="settings-row">
              <span>Product</span>

              <strong>ReconcileAI</strong>
            </div>

            <div className="settings-row">
              <span>Role</span>

              <strong>
                AI Finance Controller
              </strong>
            </div>

            <div className="settings-row">
              <span>Environment</span>

              <strong>
                {import.meta.env.PROD
                  ? "Production"
                  : "Development"}
              </strong>
            </div>
          </div>
        </article>

        {/* API CONNECTION CARD */}
        <article className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-icon">
              <Server size={17} />
            </div>

            <div>
              <h3>API Connection</h3>

              <p>
                Current backend connectivity.
              </p>
            </div>
          </div>

          <div className="settings-list">
            <div className="settings-row settings-url-row">
              <span>API Base URL</span>

              <strong>
                {getApiBaseUrl()}
              </strong>
            </div>

            <div className="settings-row">
              <span>Status</span>

              {loading ? (
                <span className="settings-status checking">
                  <RefreshCcw
                    size={13}
                    className="loading-spin"
                  />

                  Checking
                </span>
              ) : error ? (
                <span className="settings-status offline">
                  <TriangleAlert size={13} />

                  Offline
                </span>
              ) : (
                <span className="settings-status online">
                  <CheckCircle2 size={13} />

                  Operational
                </span>
              )}
            </div>

            {!loading && !error && (
              <>
                <div className="settings-row">
                  <span>Service</span>

                  <strong>
                    {health?.service || "—"}
                  </strong>
                </div>

                <div className="settings-row">
                  <span>Health</span>

                  <strong>
                    {health?.status || "—"}
                  </strong>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="settings-health-error">
              <TriangleAlert size={15} />

              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            className="settings-refresh-button"
            onClick={loadHealth}
          >
            <RefreshCcw size={14} />

            Recheck connection
          </button>
        </article>

        {/* APPEARANCE CARD */}
        <article className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-icon">
              {theme === "dark" ? (
                <Moon size={17} />
              ) : theme === "light" ? (
                <Sun size={17} />
              ) : (
                <RefreshCcw size={17} />
              )}
            </div>

            <div>
              <h3>Appearance</h3>

              <p>
                Choose your dashboard theme.
              </p>
            </div>
          </div>

          <div className="theme-choice-grid">
            {/* DARK OLIVE */}
            <button
              type="button"
              className={`theme-choice ${
                theme === "dark"
                  ? "theme-choice-active"
                  : ""
              }`}
              onClick={() =>
                setTheme("dark")
              }
            >
              <Moon size={18} />

              <div>
                <strong>Dark Olive</strong>

                <span>
                  Premium low-light fintech theme.
                </span>
              </div>
            </button>

            {/* LIGHT OLIVE */}
            <button
              type="button"
              className={`theme-choice ${
                theme === "light"
                  ? "theme-choice-active"
                  : ""
              }`}
              onClick={() =>
                setTheme("light")
              }
            >
              <Sun size={18} />

              <div>
                <strong>Light Olive</strong>

                <span>
                  Clean daylight workspace theme.
                </span>
              </div>
            </button>

            {/* SYSTEM THEME */}
            <button
              type="button"
              className={`theme-choice ${
                theme === "system"
                  ? "theme-choice-active"
                  : ""
              }`}
              onClick={() =>
                setTheme("system")
              }
            >
              <RefreshCcw size={18} />

              <div>
                <strong>System</strong>

                <span>
                  Follow your device appearance preference.
                </span>
              </div>
            </button>
          </div>
        </article>

        {/* SYSTEM INFORMATION CARD */}
        <article className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-icon">
              <Activity size={17} />
            </div>

            <div>
              <h3>
                System Information
              </h3>

              <p>
                Current frontend runtime details.
              </p>
            </div>
          </div>

          <div className="settings-list">
            <div className="settings-row">
              <span>Frontend</span>

              <strong>
                React + Vite
              </strong>
            </div>

            <div className="settings-row">
              <span>Backend</span>

              <strong>
                FastAPI
              </strong>
            </div>

            <div className="settings-row">
              <span>AI Workflow</span>

              <strong>
                Human-reviewed
              </strong>
            </div>

            <div className="settings-row">
              <span>Audit</span>

              <strong>
                Enabled
              </strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}