import React, { useEffect, useState } from "react";
import { api } from "../api.js";

const CALC_TYPES = [
  { value: "none", label: "No price effect" },
  { value: "rate_per_sqft", label: "Price per sq ft (adds to base cost)" },
  { value: "tear_off_per_sqft", label: "Extra per sq ft (add-on cost)" },
  { value: "multiplier", label: "Multiplier (scales the whole estimate)" },
  { value: "flat_fee", label: "Flat fee (adds a fixed amount)" },
];

function detectCalcType(question) {
  const opt = (question.options || [])[0];
  if (!opt) return "none";
  for (const t of ["rate_per_sqft", "tear_off_per_sqft", "multiplier", "flat_fee"]) {
    if (opt[t] !== undefined) return t;
  }
  return "none";
}

function emptyOption(calcType) {
  const base = { value: "", label: "" };
  if (calcType !== "none") base[calcType] = calcType === "multiplier" ? 1 : 0;
  return base;
}

let uid = 0;
function newKey(prefix) {
  uid += 1;
  return `${prefix}_${Date.now()}_${uid}`;
}

export default function AdminConfig({ token }) {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api
      .getAdminConfig(token)
      .then(setConfig)
      .catch((err) => setError(err.message || "Could not load configuration."));
  }, [token]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  if (error) return <div className="banner-error">{error}</div>;
  if (!config) {
    return (
      <div className="panel">
        <div className="skeleton-line" style={{ width: "50%", marginBottom: 10 }} />
        <div className="skeleton-line" style={{ width: "80%" }} />
      </div>
    );
  }

  function updateQuestion(index, patch) {
    const questions = config.questions.map((q, i) => (i === index ? { ...q, ...patch } : q));
    setConfig({ ...config, questions });
  }

  function updateOption(qIndex, optIndex, patch) {
    const questions = config.questions.map((q, i) => {
      if (i !== qIndex) return q;
      const options = q.options.map((o, j) => (j === optIndex ? { ...o, ...patch } : o));
      return { ...q, options };
    });
    setConfig({ ...config, questions });
  }

  function setCalcType(qIndex, calcType) {
    const questions = config.questions.map((q, i) => {
      if (i !== qIndex) return q;
      const cleared = (q.options || []).map((o) => {
        const next = { value: o.value, label: o.label };
        if (calcType !== "none") next[calcType] = calcType === "multiplier" ? 1 : 0;
        return next;
      });
      return { ...q, options: cleared };
    });
    setConfig({ ...config, questions });
  }

  function addOption(qIndex) {
    const calcType = detectCalcType(config.questions[qIndex]);
    const questions = config.questions.map((q, i) =>
      i === qIndex ? { ...q, options: [...(q.options || []), emptyOption(calcType)] } : q
    );
    setConfig({ ...config, questions });
  }

  function removeOption(qIndex, optIndex) {
    const questions = config.questions.map((q, i) =>
      i === qIndex ? { ...q, options: q.options.filter((_, j) => j !== optIndex) } : q
    );
    setConfig({ ...config, questions });
  }

  function addQuestion(type) {
    const q =
      type === "number"
        ? { key: newKey("field"), label: "New question", type: "number", unit: "", required: true, active: true, min: 0, max: 10000, order: config.questions.length + 1 }
        : { key: newKey("field"), label: "New question", type: "select", required: true, active: true, order: config.questions.length + 1, options: [emptyOption("none")] };
    setConfig({ ...config, questions: [...config.questions, q] });
  }

  function removeQuestion(index) {
    if (!window.confirm("Remove this question? This cannot be undone once saved.")) return;
    setConfig({ ...config, questions: config.questions.filter((_, i) => i !== index) });
  }

  function move(index, dir) {
    const next = [...config.questions];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    next.forEach((q, i) => (q.order = i + 1));
    setConfig({ ...config, questions: next });
  }

  function updateModifier(key, value) {
    setConfig({ ...config, modifiers: { ...config.modifiers, [key]: Number(value) } });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const saved = await api.saveAdminConfig(token, config);
      setConfig(saved);
      setToast("Saved. Live on the estimator now.");
    } catch (err) {
      setError(err.message || "Could not save. Nothing on the live site changed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <h1 className="page-title">Prices &amp; questions</h1>
          <p className="page-subtitle">
            Changes go live on the estimator as soon as you save. Turn a question off instead of deleting it if you might want it back.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      {config.questions.map((q, qIndex) => {
        const calcType = q.type === "select" ? detectCalcType(q) : null;
        return (
          <div className="q-editor" key={q.key}>
            <div className="q-editor-head">
              <div style={{ flex: 1 }}>
                <label className="field-label">Question text</label>
                <input
                  className="inline-input"
                  value={q.label}
                  onChange={(e) => updateQuestion(qIndex, { label: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 18 }}>
                <span className={"badge" + (q.active ? "" : " off")}>{q.active ? "Live" : "Hidden"}</span>
                <button
                  className={"toggle" + (q.active ? " on" : "")}
                  onClick={() => updateQuestion(qIndex, { active: !q.active })}
                  aria-label="Toggle question on the estimator"
                  type="button"
                >
                  <span className="dot" />
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button className="small-btn" type="button" onClick={() => move(qIndex, -1)} disabled={qIndex === 0}>
                ↑ Move up
              </button>
              <button className="small-btn" type="button" onClick={() => move(qIndex, 1)} disabled={qIndex === config.questions.length - 1}>
                ↓ Move down
              </button>
              <button className="small-btn danger" type="button" onClick={() => removeQuestion(qIndex)}>
                Remove question
              </button>
            </div>

            {q.type === "number" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div>
                  <label className="field-label">Unit</label>
                  <input className="inline-input" value={q.unit || ""} onChange={(e) => updateQuestion(qIndex, { unit: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Minimum</label>
                  <input
                    className="inline-input"
                    type="number"
                    value={q.min ?? ""}
                    onChange={(e) => updateQuestion(qIndex, { min: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="field-label">Maximum</label>
                  <input
                    className="inline-input"
                    type="number"
                    value={q.max ?? ""}
                    onChange={(e) => updateQuestion(qIndex, { max: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                </div>
              </div>
            )}

            {q.type === "select" && (
              <>
                <div style={{ marginBottom: 10 }}>
                  <label className="field-label">How this question affects price</label>
                  <select className="inline-input" value={calcType} onChange={(e) => setCalcType(qIndex, e.target.value)}>
                    {CALC_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="field-label">Options homeowners can choose</label>
                {(q.options || []).map((opt, optIndex) => (
                  <div className="option-row" key={optIndex}>
                    <input
                      className="inline-input"
                      placeholder="Label shown to homeowner"
                      value={opt.label}
                      onChange={(e) => updateOption(qIndex, optIndex, { label: e.target.value })}
                    />
                    <input
                      className="inline-input"
                      placeholder="Internal value"
                      value={opt.value}
                      onChange={(e) => updateOption(qIndex, optIndex, { value: e.target.value })}
                    />
                    {calcType !== "none" ? (
                      <input
                        className="inline-input mono"
                        type="number"
                        step="0.01"
                        value={opt[calcType] ?? ""}
                        onChange={(e) => updateOption(qIndex, optIndex, { [calcType]: Number(e.target.value) })}
                      />
                    ) : (
                      <div />
                    )}
                    <button className="small-btn danger" type="button" onClick={() => removeOption(qIndex, optIndex)}>
                      Remove
                    </button>
                  </div>
                ))}
                <button className="small-btn" type="button" onClick={() => addOption(qIndex)}>
                  + Add option
                </button>
              </>
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button className="small-btn" type="button" onClick={() => addQuestion("number")}>
          + Add number question
        </button>
        <button className="small-btn" type="button" onClick={() => addQuestion("select")}>
          + Add multiple-choice question
        </button>
      </div>

      <div className="panel">
        <h3 style={{ marginBottom: 12, fontSize: 16 }}>Pricing modifiers</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label className="field-label">Waste factor</label>
            <input
              className="inline-input mono"
              type="number"
              step="0.01"
              value={config.modifiers?.waste_factor ?? 0}
              onChange={(e) => updateModifier("waste_factor", e.target.value)}
            />
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>e.g. 0.10 = 10% added for waste</div>
          </div>
          <div>
            <label className="field-label">Permit flat fee ($)</label>
            <input
              className="inline-input mono"
              type="number"
              value={config.modifiers?.permit_flat_fee ?? 0}
              onChange={(e) => updateModifier("permit_flat_fee", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Estimate range spread (%)</label>
            <input
              className="inline-input mono"
              type="number"
              value={config.modifiers?.range_spread_pct ?? 0}
              onChange={(e) => updateModifier("range_spread_pct", e.target.value)}
            />
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>e.g. 12 = ±6% around the total</div>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
