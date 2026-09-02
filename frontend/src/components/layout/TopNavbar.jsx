import {
  Bell,
  Menu,
  Search,
} from "lucide-react";

import { useLocation } from "react-router-dom";

import ThemeToggle from "../common/ThemeToggle.jsx";

const pageNames = {
  "/dashboard": "Dashboard",
  "/reconciliation": "Reconciliation",
  "/recovery": "Recovery Center",
  "/payments": "Payments",
  "/reviews": "AI Recommendations",
  "/audit": "Audit Trail",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

function resolvePageTitle(pathname) {
  if (pathname.startsWith("/reconciliation/")) {
    return "Payment Investigation";
  }

  return pageNames[pathname] || "Dashboard";
}

export default function TopNavbar({ onOpenMobileMenu }) {
  const location = useLocation();

  const title = resolvePageTitle(location.pathname);

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="breadcrumb">
            ReconcileAI
            <span>/</span>
            {title}
          </div>

          <h1>{title}</h1>
        </div>
      </div>

      <div className="top-navbar-actions">
        <div className="navbar-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Search payments..."
            aria-label="Search payments"
          />

          <span className="search-shortcut">
            ⌘K
          </span>
        </div>

        <div className="navbar-theme">
          <ThemeToggle />
        </div>

        <button
          type="button"
          className="navbar-icon-button"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <button
          type="button"
          className="navbar-profile"
          aria-label="Open profile menu"
        >
          FT
        </button>
      </div>
    </header>
  );
}