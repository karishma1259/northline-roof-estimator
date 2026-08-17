import React from "react";

/**
 * Renders whatever the server says the question is. No question key is
 * ever referenced by name here -- only `type` ("number" | "select") drives
 * what gets rendered. This is what lets Dale add or remove a question in
 * the owner panel without a front-end code change.
 */
export default function QuestionField({ question, value, onChange, error }) {
  if (question.type === "number") {
    return (
      <div className="field-row">
        <div className="number-input-wrap">
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            value={value ?? ""}
            min={question.min}
            max={question.max}
            placeholder={question.min !== undefined ? `e.g. ${question.min}` : "Enter a number"}
            onChange={(e) => onChange(e.target.value)}
          />
          {question.unit && <span className="unit">{question.unit}</span>}
        </div>
        {(question.min !== undefined || question.max !== undefined) && (
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8 }}>
            {question.min !== undefined && question.max !== undefined
              ? `Between ${question.min} and ${question.max} ${question.unit || ""}`
              : null}
          </div>
        )}
        {error && <div className="field-error">{error}</div>}
      </div>
    );
  }

  if (question.type === "select") {
    return (
      <div className="field-row">
        <div className="option-list">
          {(question.options || []).map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={"option-btn" + (value === opt.value ? " selected" : "")}
              onClick={() => onChange(opt.value)}
            >
              <span>{opt.label}</span>
              <span className="check" />
            </button>
          ))}
        </div>
        {error && <div className="field-error">{error}</div>}
      </div>
    );
  }

  return <div className="field-error">Unsupported question type: {question.type}</div>;
}
