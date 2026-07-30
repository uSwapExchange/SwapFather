# Affiliate category fees implementation plan

This plan implements [spec.md](./spec.md) across the uSwap monorepo and
SwapFather. The user has confirmed the ownership model, strict opt-in
compatibility, all three management surfaces, and end-to-end execution.

## Step 1 — Lock contracts, taxonomy, and persistence

- Add shared category IDs, display metadata, request/response schemas, and
  types.
- Keep the existing inherited/default split cap (75 bps) untouched and add a
  separate category-override/execution cap (1500 bps); do not alter existing
  environment values, split rows, or effective defaults.
- Add the additive category-override table and nullable earnings category.
- Add a canonical destination classifier owned by the API/catalog layer.
- Test schema boundaries, migration constraints, aliases, product families,
  and crypto-to-`swap` classification.
- Commit in the uSwap monorepo.

## Step 2 — Resolve and snapshot category fees during quoting

- Extend referral fee resolution to accept the trusted destination asset.
- Load an affiliate override only for the derived category; otherwise retain
  the current inherited fee.
- Keep platform-floor and organization/affiliate allocation unchanged.
- Stamp category and override source into the private executable fee plan and
  category into the public creator-fee disclosure.
- Persist category on settled earnings.
- Pass the destination through every Partner API and runtime quote entry point,
  including bridge-scoped quotes.
- Test 10%/15% allocation, no-override compatibility, cap rejection, exact
  input/output quote behavior, immutable existing drafts, and earnings
  persistence.
- Commit in the uSwap monorepo.

## Step 3 — Add affiliate-owned API controls and organization read access

- Implement authenticated affiliate list, upsert, and reset endpoints.
- Implement organization-scoped read-only category settings for an affiliate.
- Keep organization mutation routes absent.
- Update endpoint contracts and generated OpenAPI metadata.
- Test authentication, cross-affiliate isolation, unknown categories,
  set/update/reset behavior, and route-contract parity.
- Commit in the uSwap monorepo.

## Step 4 — Add `affiliate.uswap.net` fee management

- Add a dedicated Fees navigation view using the affiliate self-service
  endpoints.
- Show inherited versus overridden values, buyer markup, and effective
  affiliate/platform/organization allocation.
- Validate percentages locally while treating API responses as authoritative.
- Provide save and `Use default` actions with clear loading/success/error
  states.
- Follow the existing dark, precise, operational uSwap dashboard system and
  preserve responsive/accessibility behavior.
- Typecheck and production-build the affiliate web app.
- Commit in the uSwap monorepo.

## Step 5 — Add `partner.uswap.net` read-only oversight

- Fetch category settings with affiliate detail.
- Add a read-only fee panel showing source, effective customer fee, and
  allocation.
- Make ownership explicit: affiliates set category fees; organization controls
  the existing split.
- Do not add organization fee mutation controls.
- Typecheck, test relevant view helpers, and production-build partner web.
- Commit in the uSwap monorepo.

## Step 6 — Add SwapFather management and buyer disclosure

- Add typed affiliate category-fee client methods.
- Add `Category fees` to tenant management for payout-enabled tenants.
- Filter categories to tenant mode/catalog without deleting hidden overrides.
- Parse percentages into basis points, save one category, and restore
  inheritance.
- Retain `creator_fee` from quote responses and show a neutral `Shop fee` on
  buyer confirmation without uSwap branding.
- Add focused client, parsing, filtering, and rendering tests.
- Run the full SwapFather test/typecheck suite.
- Commit spec, plan, and implementation in the SwapFather repository.

## Step 7 — Cross-repository compatibility and production rollout

- Run focused affiliate, quote-engine, contract, and UI tests.
- Run monorepo typechecks/builds for API contract, Partner API, partner web, and
  affiliate web.
- Verify clean diffs contain no unrelated user work and audit every fee-cap
  boundary.
- Push uSwap `staging` and SwapFather `main`.
- Deploy the Partner API, partner web, affiliate web, and SwapFather fleet.
- Confirm migrations complete, applications become healthy, existing
  Butterfly quotes remain at 0.75%, and an authenticated dedicated test
  affiliate override changes only its chosen category.
- Reset any validation override immediately after the production check.
