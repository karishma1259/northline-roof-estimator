const express = require("express");
const Config = require("../models/Config");
const Lead = require("../models/Lead");
const { calculateEstimate, ValidationError } = require("../utils/calculate");

const router = express.Router();

// Strips calc primitives (rate_per_sqft, multiplier, tear_off_per_sqft, flat_fee)
// out of options before they ever reach the browser. The homeowner sees
// labels and values only -- the pricing logic never leaves the server.
function sanitizeConfigForPublic(config) {
  const activeQuestions = (config.questions || [])
    .filter((q) => q.active)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((q) => ({
      key: q.key,
      label: q.label,
      type: q.type,
      unit: q.unit,
      required: q.required,
      min: q.min,
      max: q.max,
      options: q.options
        ? q.options.map((o) => ({ value: o.value, label: o.label }))
        : undefined,
    }));

  return {
    config_version: config.config_version,
    business: config.business,
    questions: activeQuestions,
  };
}

// GET /api/config -- what the estimator form renders itself from.
router.get("/config", async (req, res) => {
  const config = await Config.findOne().sort({ config_version: -1 }).lean();
  if (!config) return res.status(503).json({ error: "Estimator is not configured yet." });
  res.json(sanitizeConfigForPublic(config));
});

// POST /api/estimate -- server calculates from the live config, stores the lead.
router.post("/estimate", async (req, res) => {
  const { name, phone, email, answers } = req.body || {};

  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone are required." });
  }
  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ error: "Answers are required." });
  }

  const config = await Config.findOne().sort({ config_version: -1 }).lean();
  if (!config) return res.status(503).json({ error: "Estimator is not configured yet." });

  try {
    const { estimate_low, estimate_high } = calculateEstimate(config, answers);

    const lead = await Lead.create({
      config_version: config.config_version,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : undefined,
      answers,
      estimate_low,
      estimate_high,
    });

    res.status(201).json({
      lead_id: lead._id,
      estimate_low,
      estimate_high,
      currency: config.business?.currency || "USD",
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message, field: err.field });
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong calculating your estimate." });
  }
});

module.exports = router;
