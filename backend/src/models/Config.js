const mongoose = require("mongoose");

// An "option" belongs to a select-type question. Whichever calc-primitive
// keys are present on it (rate_per_sqft / multiplier / tear_off_per_sqft / flat_fee)
// determine how the calc engine folds it into the estimate. This is what keeps
// the calculation config-driven instead of switch-cased on question keys.
const OptionSchema = new mongoose.Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    rate_per_sqft: { type: Number },
    multiplier: { type: Number },
    tear_off_per_sqft: { type: Number },
    flat_fee: { type: Number },
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ["number", "select"], required: true },
    unit: { type: String },
    required: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    // Marks the single numeric question that drives per-sqft math (roof_area).
    role: { type: String, enum: ["quantity", null], default: null },
    min: { type: Number },
    max: { type: Number },
    options: { type: [OptionSchema], default: undefined },
  },
  { _id: false }
);

const ConfigSchema = new mongoose.Schema(
  {
    config_version: { type: Number, required: true },
    business: {
      name: String,
      region: String,
      currency: { type: String, default: "USD" },
    },
    questions: { type: [QuestionSchema], default: [] },
    modifiers: {
      waste_factor: { type: Number, default: 0 },
      permit_flat_fee: { type: Number, default: 0 },
      range_spread_pct: { type: Number, default: 0 },
    },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "configs" }
);

module.exports = mongoose.model("Config", ConfigSchema);
