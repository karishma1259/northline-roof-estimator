const mongoose = require("mongoose");

const LeadSchema = new mongoose.Schema(
  {
    captured_at: { type: Date, default: Date.now },
    config_version: { type: Number, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    // Free-form map of question key -> answer, exactly as submitted.
    // Kept schemaless on purpose: the question set changes over time,
    // and a lead must preserve whatever was asked when it was captured.
    answers: { type: mongoose.Schema.Types.Mixed, required: true },
    estimate_low: { type: Number, required: true },
    estimate_high: { type: Number, required: true },
  },
  { collection: "leads" }
);

module.exports = mongoose.model("Lead", LeadSchema);
