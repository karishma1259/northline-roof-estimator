# AI Log

## Tools used

- Claude (Anthropic) — used as the primary pair-programmer for architecture, backend implementation (Express API, Mongoose models, calculation engine), frontend implementation (React estimator + owner panel), deployment troubleshooting, and this documentation.

## What AI was used for

- Designing the config-driven schema (questions/options carrying generic calc primitives — `rate_per_sqft`, `tear_off_per_sqft`, `multiplier`, `flat_fee` — instead of hardcoded per-question logic).
- Writing the Express API, Mongoose models, and the calculation engine in `backend/src/utils/calculate.js`.
- Writing the React estimator flow and owner panel, including the config editor UI.
- Debugging deployment issues: a CORS wildcard bug (`CORS_ORIGIN=*` wasn't being handled correctly by the `cors` package when passed through `.split(",")`), and a client-side routing issue on Vercel (`/admin` returning 404 on direct navigation, fixed with a `vercel.json` SPA rewrite rule).
- Drafting `DECISIONS.md`, `README.md`, and this file.

## A specific instance where the AI's output was wrong or weak

The initial CORS configuration in `backend/src/server.js` read:
```js
origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*"
```
When `CORS_ORIGIN=*` was set (to unblock the frontend quickly during deployment), this code turned it into `["*"]` — an array containing a literal asterisk — instead of the wildcard string `"*"` the `cors` package expects. The browser then blocked every request with "No 'Access-Control-Allow-Origin' header is present," even though the env var looked correct. This was caught by checking the browser console (Network/Console tab) during a live deploy test, not by reading the code in isolation. The fix explicitly checks for the `"*"` case before falling back to the split-by-comma logic.

## What I wrote or substantially reworked myself

- Verified and corrected the deployed environment variables (`MONGODB_URI`, `OWNER_USERNAME`, `OWNER_PASSWORD`, `CORS_ORIGIN`) directly on Render and Vercel, including catching a mismatch where the owner panel login failed because two different backend deployments ended up with two different `OWNER_PASSWORD` values.
- Ran `npm run seed` against the live MongoDB Atlas database to load the seed config and seed leads, and verified the returned `/api/config` and `/api/health` responses directly in the browser.
- Diagnosed the CORS and SPA-routing production bugs described above by reading actual browser console errors rather than assuming the code was correct.

## Verification performed

- Ran the calc engine against the client's roof-area/material/pitch/layers/stories inputs and manually checked the resulting `estimate_low`/`estimate_high` math by hand.
- Deployed the full stack (MongoDB Atlas + Render backend + Vercel frontend) and clicked through the entire public estimator flow end-to-end on the live URL.
- Logged into the live owner panel with the real deployed credentials and confirmed the leads list (including the three seed leads) renders correctly.
- Confirmed `/api/config` returns only labels/options/limits and never returns `rate_per_sqft`, `multiplier`, `tear_off_per_sqft`, or `flat_fee` to the browser.
