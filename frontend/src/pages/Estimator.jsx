import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import RooflineProgress from "../components/RooflineProgress.jsx";
import QuestionField from "../components/QuestionField.jsx";

const STAGE = { LOADING: "loading", LOAD_ERROR: "load_error", QUESTIONS: "questions", CONTACT: "contact", SUBMITTING: "submitting", RESULT: "result" };

export default function Estimator() {
  const [stage, setStage] = useState(STAGE.LOADING);
  const [config, setConfig] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [fieldError, setFieldError] = useState("");

  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [contactErrors, setContactErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getPublicConfig()
      .then((data) => {
        if (cancelled) return;
        if (!data.questions || data.questions.length === 0) {
          setLoadError("There are no questions configured yet. Please check back soon.");
          setStage(STAGE.LOAD_ERROR);
          return;
        }
        setConfig(data);
        setStage(STAGE.QUESTIONS);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err.message || "Could not load the estimator.");
        setStage(STAGE.LOAD_ERROR);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (stage === STAGE.LOADING) {
    return (
      <div className="estimator-page">
        <div className="estimator-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="skeleton-line" style={{ width: "40%" }} />
          <div className="skeleton-line" style={{ width: "80%", height: 26 }} />
          <div className="skeleton-line" style={{ width: "100%", height: 48 }} />
          <div className="skeleton-line" style={{ width: "100%", height: 48 }} />
        </div>
      </div>
    );
  }

  if (stage === STAGE.LOAD_ERROR) {
    return (
      <div className="estimator-page">
        <div className="estimator-card">
          <div className="banner-error">{loadError}</div>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const questions = config.questions;
  const totalSteps = questions.length + 1; // + contact step
  const question = questions[stepIndex];

  function validateCurrentQuestion() {
    const value = answers[question.key];
    const isMissing = value === undefined || value === null || value === "";
    if (question.required && isMissing) return "Please answer this one to continue.";
    if (question.type === "number" && !isMissing) {
      const num = Number(value);
      if (Number.isNaN(num)) return "Please enter a valid number.";
      if (question.min !== undefined && num < question.min) return `Must be at least ${question.min}.`;
      if (question.max !== undefined && num > question.max) return `Must be at most ${question.max}.`;
    }
    return "";
  }

  function goNext() {
    const err = validateCurrentQuestion();
    if (err) {
      setFieldError(err);
      return;
    }
    setFieldError("");
    if (stepIndex < questions.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setStage(STAGE.CONTACT);
    }
  }

  function goBack() {
    setFieldError("");
    if (stage === STAGE.CONTACT) {
      setStage(STAGE.QUESTIONS);
      return;
    }
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  function validateContact() {
    const errs = {};
    if (!contact.name.trim()) errs.name = "Name is required.";
    if (!contact.phone.trim()) errs.phone = "Phone is required.";
    if (contact.email && !/^\S+@\S+\.\S+$/.test(contact.email)) errs.email = "That email doesn't look right.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateContact();
    setContactErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitError("");
    setStage(STAGE.SUBMITTING);
    try {
      const data = await api.submitEstimate({ ...contact, answers });
      setResult(data);
      setStage(STAGE.RESULT);
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
      setStage(STAGE.CONTACT);
    }
  }

  return (
    <div className="estimator-page">
      <header className="estimator-header">
        <div>
          <div className="brand-eyebrow">{config.business?.region || ""}</div>
          <div className="brand">{config.business?.name || "Roof Estimator"}</div>
        </div>
      </header>

      <div className="estimator-card">
        {stage !== STAGE.RESULT && (
          <RooflineProgress total={totalSteps} current={stage === STAGE.CONTACT || stage === STAGE.SUBMITTING ? questions.length : stepIndex} />
        )}

        {(stage === STAGE.QUESTIONS) && (
          <>
            <div className="step-label">
              Step {stepIndex + 1} of {totalSteps}
            </div>
            <div className="question-label">{question.label}</div>
            <QuestionField
              question={question}
              value={answers[question.key]}
              onChange={(val) => {
                setAnswers((a) => ({ ...a, [question.key]: val }));
                setFieldError("");
              }}
              error={fieldError}
            />
            <div className="nav-row">
              <button className="btn btn-ghost" onClick={goBack} disabled={stepIndex === 0} style={{ visibility: stepIndex === 0 ? "hidden" : "visible" }}>
                ← Back
              </button>
              <button className="btn btn-primary" onClick={goNext}>
                Continue
              </button>
            </div>
          </>
        )}

        {(stage === STAGE.CONTACT || stage === STAGE.SUBMITTING) && (
          <form onSubmit={handleSubmit}>
            <div className="step-label">
              Step {totalSteps} of {totalSteps}
            </div>
            <div className="question-label">Where should we send your estimate?</div>

            {submitError && <div className="banner-error">{submitError}</div>}

            <div className="contact-form">
              <div>
                <input
                  className="text-input"
                  placeholder="Full name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  autoFocus
                />
                {contactErrors.name && <div className="field-error">{contactErrors.name}</div>}
              </div>
              <div>
                <input
                  className="text-input"
                  placeholder="Phone number"
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />
                {contactErrors.phone && <div className="field-error">{contactErrors.phone}</div>}
              </div>
              <div>
                <input
                  className="text-input"
                  placeholder="Email (optional)"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                />
                {contactErrors.email && <div className="field-error">{contactErrors.email}</div>}
              </div>
            </div>

            <div className="nav-row">
              <button type="button" className="btn btn-ghost" onClick={goBack} disabled={stage === STAGE.SUBMITTING}>
                ← Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={stage === STAGE.SUBMITTING}>
                {stage === STAGE.SUBMITTING ? "Calculating…" : "Get my estimate"}
              </button>
            </div>
          </form>
        )}

        {stage === STAGE.RESULT && result && (
          <div className="result-card">
            <div className="result-eyebrow">Your estimate</div>
            <div className="result-range mono">
              ${result.estimate_low.toLocaleString()} – ${result.estimate_high.toLocaleString()}
            </div>
            <p className="result-note">
              This is a preliminary range based on what you told us. {config.business?.name || "We"} will follow up with you shortly at{" "}
              {contact.phone} to confirm details and firm up the number.
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Start a new estimate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
