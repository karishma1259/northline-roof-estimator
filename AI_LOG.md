# AI Log

> **Draft — personalize before submitting.** This file was scaffolded alongside the rest of the build in a single AI pair-programming session. Before you submit, you need to actually read through `backend/` and `frontend/`, run it yourself, and rewrite the bullets below to reflect what *you* did — what you kept as-is, what you changed, and anything you caught that was wrong. Round 2 is a live walkthrough of this exact codebase plus a live change you'll make yourself, so treat this file as true only once it actually is.

## Tools used

- Claude (Anthropic), used as the primary pair-programmer for architecture, backend implementation, frontend implementation, and this documentation.

## What AI was used for

- Designing the config-driven schema (questions/options carrying generic calc primitives — `rate_per_sqft`, `tear_off_per_sqft`, `multiplier`, `flat_fee` — instead of hardcoded per-question logic).
- Writing the Express API, Mongoose models, and the calculation engine in `backend/src/utils/calculate.js`.
- Writing the React estimator flow and owner panel, including the config editor UI.
- Drafting `DECISIONS.md`, `README.md`, and this file.

## A specific instance where the AI's output was wrong or weak

_(Replace this with something real from your own review pass. One honest example is worth more than a polished paragraph.)_

Example of the kind of thing to look for: the seed data has `pitch.medium.multiplier` as the string `"1.12"` instead of a number, which would silently break the calc engine's `runningMultiplier *= Number(selected.multiplier)` if not caught. Check whether this was actually caught and fixed correctly in `backend/src/utils/seed.js`, and whether the fix is documented — or find your own example (e.g., a validation edge case, an accessibility gap in the estimator, a weak error message) and describe what you changed and why.

## What I wrote or substantially reworked myself

_(Fill this in honestly. Examples of the kind of thing that belongs here: rewording the estimator's copy, changing the calc formula's assumptions, adding/removing a validation rule, restructuring a component, fixing a bug you found while testing locally.)_

## Verification performed

- Ran the calc engine against several hand-checked inputs before trusting it (see terminal output during the build for the specific test cases and results).
- Ran `npm run build` on the frontend and confirmed it compiles cleanly.
- _(Add: did you deploy it and click through the whole flow yourself? Did you test the owner panel end-to-end — log in, edit a price, confirm it shows up on the live estimator? That's the verification that actually matters for this brief.)_
