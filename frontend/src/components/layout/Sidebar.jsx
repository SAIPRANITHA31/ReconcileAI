import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "../common/ThemeToggle.jsx";

const navigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Reconciliation",
    path: "/reconciliation",
    icon: RefreshCcw,
  },
  {
    label: "Recovery",
    path: "/recovery",
    icon: CircleDollarSign,
  },
  {
    label: "Payments",
    path: "/payments",
    icon: CreditCard,
  },
  {
    label: "Reviews",
    path: "/reviews",
    icon: ClipboardCheck,
  },
  {
    label: "Audit Trail",
    path: "/audit",
    icon: ShieldCheck,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "sidebar",
          collapsed ? "sidebar-collapsed" : "",
          mobileOpen ? "sidebar-mobile-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>

          {!collapsed && (
            <div className="brand-copy">
              <strong>ReconcileAI</strong>
              <span>AI Finance Controller</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link active"
                    : "sidebar-link"
                }
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} />

                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="system-card">
              <div className="system-row">
                <div className="system-indicator">
                  <span className="online-dot" />
                  <span>System operational</span>
                </div>

                <Activity size={16} />
              </div>

              <div className="api-row">
                <span>API</span>
                <strong>Connected</strong>
              </div>
            </div>
          )}

          {!collapsed && <ThemeToggle />}

          <div className="profile-card">
            <div className="profile-avatar">FT</div>

            {!collapsed && (
              <div className="profile-copy">
                <strong>Finance Team</strong>
                <span>Controller workspace</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-collapse"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {collapsed ? (
              <ChevronRight size={17} />
            ) : (
              <>
                <ChevronLeft size={17} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}