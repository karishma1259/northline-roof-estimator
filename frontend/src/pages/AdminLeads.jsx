import React, { useEffect, useState } from "react";
import { api } from "../api.js";

function formatAnswers(answers) {
  return Object.entries(answers || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("  ·  ");
}

function toCsv(leads) {
  const cols = ["captured_at", "name", "phone", "email", "estimate_low", "estimate_high", "answers"];
  const rows = leads.map((l) =>
    cols
      .map((c) => {
        const val = c === "answers" ? JSON.stringify(l.answers) : l[c];
        return `"${String(val ?? "").replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [cols.join(","), ...rows].join("\n");
}

export default function AdminLeads({ token }) {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getLeads(token)
      .then(setLeads)
      .catch((err) => setError(err.message || "Could not load leads."));
  }, [token]);

  function downloadCsv() {
    const csv = toCsv(leads || []);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "northline-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">Everyone who's completed the estimator, newest first.</p>
        </div>
        {leads && leads.length > 0 && (
          <button className="small-btn" onClick={downloadCsv}>
            Export CSV
          </button>
        )}
      </div>

      {error && <div className="banner-error">{error}</div>}

      {!leads && !error && (
        <div className="panel">
          <div className="skeleton-line" style={{ width: "60%", marginBottom: 10 }} />
          <div className="skeleton-line" style={{ width: "90%" }} />
        </div>
      )}

      {leads && leads.length === 0 && (
        <div className="panel">No leads yet. Once someone completes the estimator, they'll show up here.</div>
      )}

      {leads && leads.length > 0 && (
        <div className="panel" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Estimate</th>
                <th>Answers</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id}>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>
                    {new Date(lead.captured_at).toLocaleDateString()}
                  </td>
                  <td>
                    {lead.name}
                    {lead.email && <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{lead.email}</div>}
                  </td>
                  <td className="mono">{lead.phone}</td>
                  <td className="mono">
                    ${Number(lead.estimate_low).toLocaleString()}–${Number(lead.estimate_high).toLocaleString()}
                  </td>
                  <td style={{ fontSize: 13, color: "var(--ink-soft)" }}>{formatAnswers(lead.answers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
