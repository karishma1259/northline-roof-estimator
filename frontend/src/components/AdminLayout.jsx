import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout({ onLogout }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="brand-eyebrow">Northline Roofing</div>
          <div className="brand">Owner Panel</div>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin/leads" className={({ isActive }) => "admin-nav-link" + (isActive ? " active" : "")}>
            Leads
          </NavLink>
          <NavLink to="/admin/config" className={({ isActive }) => "admin-nav-link" + (isActive ? " active" : "")}>
            Prices &amp; questions
          </NavLink>
          <button
            onClick={onLogout}
            className="admin-nav-link"
            style={{ background: "transparent", border: "none", width: "100%", textAlign: "left" }}
          >
            Log out
          </button>
        </nav>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
