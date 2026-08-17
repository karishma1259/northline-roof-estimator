import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Estimator from "./pages/Estimator.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminLeads from "./pages/AdminLeads.jsx";
import AdminConfig from "./pages/AdminConfig.jsx";
import AdminLayout from "./components/AdminLayout.jsx";

const TOKEN_KEY = "northline_owner_token";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  const logout = () => setToken(null);

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Estimator />} />

        <Route
          path="/admin/login"
          element={token ? <Navigate to="/admin/leads" replace /> : <AdminLogin onLogin={setToken} />}
        />

        <Route
          path="/admin"
          element={token ? <AdminLayout onLogout={logout} /> : <Navigate to="/admin/login" replace />}
        >
          <Route index element={<Navigate to="leads" replace />} />
          <Route path="leads" element={<AdminLeads token={token} />} />
          <Route path="config" element={<AdminConfig token={token} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
