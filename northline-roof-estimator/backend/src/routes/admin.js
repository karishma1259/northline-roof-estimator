const express = require("express");
const jwt = require("jsonwebtoken");
const Config = require("../models/Config");
const Lead = require("../models/Lead");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// --- Login -----------------------------------------------------------
// Single owner account read from env vars. Not multi-user -- Dale and
// Marcus share one login. Good enough for "basic auth is fine" per the
// brief; documented as a scope call in DECISIONS.md.
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (username !== process.env.OWNER_USERNAME || password !== process.env.OWNER_PASSWORD) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
});

// --- Config (full, unsanitized) --------------------------------------
router.get("/config", requireAuth, async (req, res) => {
  const config = await Config.findOne().sort({ config_version: -1 }).lean();
  if (!config) return res.status(404).json({ error: "No config found." });
  res.json(config);
});

// Replaces the live config with a new version. We never mutate the existing
// document in place -- we insert a new one with config_version + 1. That
// way a half-written save can never leave the public estimator reading a
// broken/partial document; readers always see one complete version or the
// previous complete version, never something in between.
router.put("/config", requireAuth, async (req, res) => {
  const { business, questions, modifiers } = req.body || {};

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "At least one question is required." });
  }

  const keys = questions.map((q) => q.key);
  if (new Set(keys).size !== keys.length) {
    return res.status(400).json({ error: "Question keys must be unique." });
  }

  for (const q of questions) {
    if (!q.key || !q.label || !q.type) {
      return res.status(400).json({ error: "Each question needs a key, label, and type." });
    }
    if (q.type === "select" && (!Array.isArray(q.options) || q.options.length === 0)) {
      return res.status(400).json({ error: `"${q.label}" is a select question and needs at least one option.` });
    }
  }

  const current = await Config.findOne().sort({ config_version: -1 }).lean();
  const nextVersion = current ? current.config_version + 1 : 1;

  const updated = await Config.create({
    config_version: nextVersion,
    business: business || current?.business,
    questions,
    modifiers: modifiers || current?.modifiers,
    updated_at: new Date(),
  });

  res.json(updated);
});

// --- Leads -------------------------------------------------------------
router.get("/leads", requireAuth, async (req, res) => {
  const leads = await Lead.find().sort({ captured_at: -1 }).lean();
  res.json(leads);
});

module.exports = router;
