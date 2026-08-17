/**
 * Config-driven estimate calculator.
 *
 * Nothing about *which* question means what is hardcoded here. Instead each
 * active question contributes to the estimate based on generic "calc
 * primitives" that live on the option the homeowner picked:
 *
 *   - rate_per_sqft     -> base cost = quantity * rate_per_sqft
 *   - tear_off_per_sqft -> additive cost = quantity * tear_off_per_sqft
 *   - multiplier        -> multiplies the running subtotal
 *   - flat_fee          -> adds a flat amount
 *
 * The "quantity" driving the per-sqft math is whichever active number
 * question has role: "quantity" (roof_area in the seed data). If Dale adds
 * a brand new select question in the owner panel with a `multiplier` on its
 * options, this engine picks it up automatically -- no code change needed.
 *
 * Modifiers (waste_factor, permit_flat_fee, range_spread_pct) are applied
 * the same way for every business, and also come entirely from config.
 */

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

function getActiveQuestions(config) {
  return (config.questions || [])
    .filter((q) => q.active)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/** Validates raw answers against the active question set. Throws ValidationError on first problem. */
function validateAnswers(config, answers) {
  const activeQuestions = getActiveQuestions(config);

  for (const q of activeQuestions) {
    const value = answers[q.key];
    const isMissing = value === undefined || value === null || value === "";

    if (q.required && isMissing) {
      throw new ValidationError(`"${q.label}" is required.`, q.key);
    }
    if (isMissing) continue; // optional and not provided, skip further checks

    if (q.type === "number") {
      const num = Number(value);
      if (Number.isNaN(num)) {
        throw new ValidationError(`"${q.label}" must be a number.`, q.key);
      }
      if (q.min !== undefined && num < q.min) {
        throw new ValidationError(`"${q.label}" must be at least ${q.min}.`, q.key);
      }
      if (q.max !== undefined && num > q.max) {
        throw new ValidationError(`"${q.label}" must be at most ${q.max}.`, q.key);
      }
    }

    if (q.type === "select") {
      const validValues = (q.options || []).map((o) => o.value);
      if (!validValues.includes(String(value))) {
        throw new ValidationError(`"${q.label}" has an invalid selection.`, q.key);
      }
    }
  }

  return activeQuestions;
}

function calculateEstimate(config, answers) {
  const activeQuestions = validateAnswers(config, answers);

  const quantityQuestion = activeQuestions.find((q) => q.type === "number" && q.role === "quantity");
  const quantity = quantityQuestion ? Number(answers[quantityQuestion.key]) : 0;

  let base = 0; // driven by rate_per_sqft (per unit of quantity)
  let additive = 0; // driven by tear_off_per_sqft (per unit of quantity) + flat_fee
  let runningMultiplier = 1; // product of all `multiplier` primitives

  for (const q of activeQuestions) {
    if (q.type !== "select") continue;
    const selected = (q.options || []).find((o) => o.value === String(answers[q.key]));
    if (!selected) continue;

    if (typeof selected.rate_per_sqft === "number") {
      base += quantity * selected.rate_per_sqft;
    }
    if (typeof selected.tear_off_per_sqft === "number") {
      additive += quantity * selected.tear_off_per_sqft;
    }
    if (selected.multiplier !== undefined && selected.multiplier !== null) {
      runningMultiplier *= Number(selected.multiplier);
    }
    if (typeof selected.flat_fee === "number") {
      additive += selected.flat_fee;
    }
  }

  const { waste_factor = 0, permit_flat_fee = 0, range_spread_pct = 0 } = config.modifiers || {};

  const subtotal = (base + additive) * runningMultiplier;
  const waste = subtotal * waste_factor;
  const total = subtotal + waste + permit_flat_fee;

  // range_spread_pct is treated as the *total* spread width; half applied
  // below the midpoint and half above it. See DECISIONS.md.
  const spreadFraction = range_spread_pct / 100 / 2;
  const estimate_low = Math.round(total * (1 - spreadFraction));
  const estimate_high = Math.round(total * (1 + spreadFraction));

  return {
    estimate_low,
    estimate_high,
    breakdown: {
      quantity,
      base: Math.round(base),
      additive: Math.round(additive),
      multiplier: runningMultiplier,
      subtotal: Math.round(subtotal),
      waste: Math.round(waste),
      permit_flat_fee,
      total: Math.round(total),
    },
  };
}

module.exports = { calculateEstimate, validateAnswers, getActiveQuestions, ValidationError };
