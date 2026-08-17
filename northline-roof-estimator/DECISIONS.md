# Decisions

## Assumptions made where the brief was silent

- **Owner login is a single shared account**, not per-user accounts for Dale and Marcus. The brief says the panel "can't be something where you need to be technical to use it" but never asks for multi-user access control. One username/password (in env vars) is enough to satisfy "behind a login" without building a user-management system nobody asked for.
- **Config updates are append-only, not in-place edits.** Saving a new price list inserts a new `Config` document with `config_version` incremented, rather than mutating the live one. This directly serves "it can't take the site down while I'm editing prices" — a reader either gets the last complete version or the new complete version, never a half-written one.
- **The public API never returns pricing data.** `/api/config` strips `rate_per_sqft`, `multiplier`, `tear_off_per_sqft`, and `flat_fee` off every option before sending it to the browser. Only the calculation endpoint (server-side) touches real numbers. This wasn't explicitly requested but is required by "a visitor should not be able to read your pricing logic."
- **A question's price effect is one of four generic primitives** (`rate_per_sqft`, `tear_off_per_sqft`, `multiplier`, `flat_fee`) rather than named business logic per question. This is the core design call: it's what lets Dale add a new select question in the owner panel and have it participate in pricing without a code change, satisfying "config-driven" for real instead of just for labels.
- **Range spread is a total width, split evenly** around the calculated total (12% spread = ±6%). The brief gives `range_spread_pct: 12` with no formula, so I picked the simplest reading a spreadsheet-minded owner like Dale would expect.
- **CSV export was pulled in from the stretch list** because it's small, low-risk, and directly answers "I need to be able to see the leads that come in" in the way an owner actually uses that data (in Excel, with Marcus).

## Calculation, in plain language

1. Take the roof size (the one number question marked as the "quantity" driver).
2. Multiply it by the material's price-per-sqft to get a base cost.
3. Multiply it by the tear-off rate (based on how many old layers exist) and add that on top.
4. Multiply the running total by the pitch multiplier, then by the stories multiplier.
5. Add 10% waste on top of that (configurable).
6. Add the flat permit fee.
7. That's the estimate. The low/high range is that total minus/plus half the configured spread percentage.

Every rate, multiplier, and fee in this chain is read from the database at request time — none of it is hardcoded in the calculation file itself; the file only encodes *which kind of math* each primitive does, not the values.

## What I deliberately did not build

- **Per-user owner accounts / roles.** Single shared login covers the brief; real RBAC is a week-two problem, not a 24-hour one.
- **Config version history / rollback UI.** I version every save internally (so nothing is ever half-written), but I didn't build a UI to browse or revert old versions — that's the first stretch goal and I ran out of runway before touching stretch goals.
- **Drag-and-drop question reordering.** Up/down buttons cover the real need (Marcus reordering four or five questions) without pulling in a DnD library.
- **Editing `business.name` / `business.region` from the panel.** These change essentially never; hardcoding them into the initial config document and leaving that to a direct DB edit was the right call for the time budget.
- **Webhook / CRM push on new lead.** Explicitly a stretch goal; not touched.

## Questionable things in the brief / seed data, and how I handled them

- **`pitch.medium.multiplier` was the string `"1.12"`** while every other multiplier was a number. Left as-is in the calc engine would silently break `*=` math. Cast to a number in the seed script, noted inline.
- **The `ld_0917` (Bill Tanner) seed lead references a config that doesn't exist** (`config_version: 1`) and answer keys (`chimney_count`, `gutter_replace`, `material: "slate_natural"`) that don't exist in the current question set. Rather than "fixing" this lead to match current config, I left it untouched — `Lead.answers` is stored schemaless specifically so old leads stay legible after the question set moves on, which is exactly the situation Dale described wanting to avoid manually reconciling.
- **The estimate figures on seed leads won't match this calculator's output**, and the brief says not to worry about that. I didn't try to reverse-engineer Dale's old formula from three data points.

## Questions I'd ask Dale before the real build

1. When you edit a price, should it only affect *new* leads, or do you also want to see what an old lead would cost under today's prices?
2. Do you and Marcus need separate logins for accountability (e.g., "who changed this price"), or is one shared login genuinely fine long-term?
3. What should happen to a lead's estimate if you edit prices mid-form, on a homeowner's phone, while they're filling it out?
4. Is there a real CRM (or just your phone) leads should end up in eventually? That decides whether the webhook stretch goal is worth building next.
5. Roughly how many questions do you expect to have in six months — five, or twenty? That changes whether the panel needs search/filter.

## What I'd do next with another week

- Build the config version history + rollback UI (stretch goal #1) — it's the natural next thing once versioning already exists internally.
- Add real tests around the calc engine's edge cases (zero-value options, all-optional questions, a question with no active options).
- Move the shared owner login to per-user accounts with an audit trail on config changes, since "who changed this price" is a question I'd expect Dale to ask within a month.
- Add basic analytics (completion rate per step) so Dale can see where homeowners drop off in the form.
