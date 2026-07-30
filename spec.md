# Affiliate category fees

## Status

Implemented and verified on 2026-07-29. This specification covers:

- the uSwap Partner API and shared quote/affiliate services in
  `/home/lukee/dev/uswap-v4-mono`;
- the organization dashboard at `partner.uswap.net`;
- the affiliate self-service dashboard at `affiliate.uswap.net`;
- the affiliate management and customer quote screens in
  `/home/lukee/dev/best-b4u`.

## Goal

Let an affiliate choose the customer-facing creator fee for each category they
sell, up to a final total of 15%, while keeping fee selection, quote math,
execution, and payout allocation under uSwap's server-side control.

This is a price markup. For an exact-output product purchase, uSwap grosses up
the amount the buyer sends so the product still receives its required amount.
For an exact-input crypto swap, the fee is diverted from the funded amount and
the quoted output reflects the remainder.

## Product decisions

1. A category setting is the **total customer fee**, not an affiliate payout
   percentage and not an extra fee added on top of the configured value.
2. The final creator fee is capped at `1500` basis points (15%).
3. A category without an affiliate override inherits the affiliate's existing
   effective fee, currently 0.75%.
4. An override accepts `1` through `1500` basis points (0.01% through 15%).
   Removing an override restores inheritance. A zero-fee mode is not included
   in the first version.
5. The existing platform-floor and organization/affiliate split continue to
   allocate the chosen total fee. Affiliates cannot modify those policies.
   With the current 20% platform floor and a 100% affiliate partner share:
   - a 10% customer fee pays 8% of notional to the affiliate and 2% to uSwap;
   - a 15% customer fee pays 12% of notional to the affiliate and 3% to uSwap.
6. The confirmation screen discloses the fee as a shop/service fee, including
   its percentage and USD amount. It does not expose uSwap branding.
7. The feature is strictly opt-in per category. Existing affiliates, tenants,
   buyers, API clients, and stored split policies do not change unless the
   authenticated affiliate explicitly creates an override.

## Fee categories

The Partner API owns category identity. Initial categories are:

| ID | Display name | Destination scope |
| --- | --- | --- |
| `swap` | Crypto swaps | Crypto destination assets |
| `telegram` | Telegram | Telegram products |
| `discord` | Discord | Discord products |
| `gift-card` | Gift Cards | Gift-card products |
| `prepaid-card` | Prepaid Cards | Prepaid-card products |
| `mullvad` | Mullvad VPN | Mullvad products |
| `tf2-keys` | TF2 Keys | Clover TF2-key products |

The server maps a canonical `destination_asset_v1` to a category using the
catalog's canonical parent asset, including the existing TF2/Clover alias. New
supported top-level product families can be added to the server taxonomy
without changing quote request bodies.

SwapFather may filter the management list to categories enabled for that
tenant, but hiding a category does not delete its saved override. A tenant that
later re-enables a category gets its previous fee back.

## Trust boundary and quote flow

SwapFather never sends a fee percentage or category in a quote request.

1. SwapFather sends the existing referral token and canonical source and
   destination assets.
2. The Partner API authenticates the organization, resolves the referral token,
   and derives the category from `destination_asset_v1`.
3. The affiliate-fee service loads the category override or inherited default.
4. The service applies the global 15% cap and the existing platform,
   organization, and affiliate allocation policy.
5. The resolved category and fee plan are snapshotted into the quote.
6. Existing quote gross-up/haircut, fee diversion, execution, accrual, and
   payout code consumes that trusted snapshot.

A fee change affects new quotes immediately. Existing quote drafts retain the
fee the buyer saw until the draft expires. Requoting after expiry uses the
latest setting and must pass SwapFather's existing price re-confirmation check.

No public quote, bridge-open, or intent endpoint accepts client-supplied
`fee_bps`, `fee_category`, or allocation fields.

## Data model

Add `affiliate_category_fee_configs`:

- `id`;
- `organization_id`;
- `affiliate_id`;
- `category_id`;
- `total_fee_bps`;
- `updated_by_affiliate_token_id` where available;
- `created_at`;
- `updated_at`.

Constraints:

- foreign keys to organization and affiliate;
- unique `(affiliate_id, category_id)`;
- affiliate must belong to the stored organization;
- `total_fee_bps BETWEEN 1 AND 1500`;
- `category_id` must be accepted by the application taxonomy before writes.

The database constraint, request schema, resolver, and quote engine each enforce
the 15% ceiling. The resolver remains authoritative even if a malformed row is
inserted outside the API.

The quote's trusted affiliate fee snapshot gains `fee_category`. Earnings rows
also record the category so support and future category reporting can explain
how a fee was selected. Existing rows remain nullable/legacy.

## Configuration

Keep the existing `AFFILIATE_FEE_CAP_BPS` behavior and production value
untouched. It remains the inherited/default split ceiling (currently 75 bps).

Add a separate `AFFILIATE_CATEGORY_FEE_CAP_BPS`, defaulting to 1500 bps. Only
an explicit affiliate category override may use this wider ceiling. The quote
engine validates resolved plans against the wider execution ceiling, while
existing organization/default split mutation continues to use the existing
75-bps policy unless separately changed in the future.

Existing affiliate and organization split rows keep their current values, and
no environment mutation is required to preserve current buyer prices.

## Partner API

Affiliate self-service authentication uses the existing
`uswp_aff_...` bearer token.

### List fee settings

`GET /v1/affiliate/category-fees`

Returns every supported category with:

- category ID and display name;
- configured override or `null`;
- inherited fee;
- effective customer fee;
- effective platform, organization, and affiliate bps;
- global maximum;
- whether the category is currently available in the catalog.

### Set one category

`PUT /v1/affiliate/category-fees/{category_id}`

Body:

```json
{ "total_fee_bps": 1000 }
```

The write is an upsert scoped to the authenticated affiliate.

### Restore inheritance

`DELETE /v1/affiliate/category-fees/{category_id}`

Deletes only that affiliate's override and returns the inherited effective
setting.

### Organization access

Existing organization administrators may read category settings when fetching
an affiliate for support. `partner.uswap.net` displays each override, inherited
value, effective customer fee, and effective allocation. The first version does
not let an administrator silently replace an affiliate's chosen category fee or
impose a separate organization cap; the platform-wide 15% cap and existing
allocation policy are the guardrails.

## Affiliate dashboard UX

`affiliate.uswap.net` is the canonical web management surface for category
fees. It adds a fee-management section that:

- lists every supported category and its current effective percentage;
- distinguishes inherited values from affiliate overrides;
- explains that the setting raises the buyer's price;
- shows the affiliate's effective earnings rate after the existing allocation;
- accepts percentages with up to two decimal places, capped at 15%;
- saves one category without changing any other category;
- restores inheritance with a `Use default` action;
- refreshes authoritative values from the Partner API after each change.

The dashboard never edits the affiliate/organization split or platform floor.

## Partner dashboard UX

`partner.uswap.net` adds a read-only category-fee panel to affiliate detail and
support views. It shows:

- category name;
- inherited or overridden status;
- effective customer fee;
- platform, organization, and affiliate allocation rates.

Organization operators continue to manage the existing split policy in its
current controls. Category fee values remain owned by the affiliate.

## SwapFather management UX

For a tenant with an affiliate self-service token, the management screen adds a
`📈 Customer fees` button.

The category-fee screen:

- shows only categories relevant to the tenant's mode and catalog selection;
- displays inherited settings as `Default · 0.75%`;
- displays overrides as, for example, `Telegram · 12%`;
- explains that the percentage raises the buyer's quoted price;
- explains the estimated affiliate share after the current allocation policy;
- lets the owner enter a percentage with up to two decimal places;
- rejects values below 0.01% or above 15% before calling the API;
- offers `Use default` to delete an override;
- refreshes from the Partner API after every mutation.

The API remains the source of truth. SwapFather does not add fee columns to its
SQLite tenant table.

Tenants without an affiliate token keep their current payout-setup prompt and
cannot access fee management.

## Buyer quote UX

SwapFather retains `creator_fee` from the Partner API quote response. On the
final confirmation screen it shows:

```text
Shop fee: $6.00 (12%)
```

The displayed send total already includes the fee where gross-up is required.
The line uses neutral tenant-facing wording and never names uSwap. The buyer
must re-confirm if a re-quote changes the total beyond the existing ceiling.

## Validation and errors

- Unknown category: `404 affiliate_fee_category_not_found`.
- Fee outside 1–1500 bps: `422 affiliate_category_fee_invalid`.
- Missing/invalid affiliate token: existing affiliate authentication errors.
- Disabled affiliate/system: existing disabled/not-found behavior.
- A malformed stored override never reaches the quote engine; resolution fails
  closed with a policy error.
- A category that is temporarily absent from the live catalog remains readable
  and resettable but cannot be newly assigned to an arbitrary destination.

## Compatibility

- Existing referrals and quotes without category overrides behave exactly as
  they do now.
- Deploying the migration and applications creates no overrides and changes no
  effective fee. A category changes only after an authenticated affiliate
  submits a successful write for that category.
- Existing Partner API clients need no quote request changes.
- Existing quotes and earnings remain readable.
- SwapFather's cached referral token is safe because fee policy is resolved
  server-side for every new quote.
- The Partner and affiliate dashboards consume the same response schemas as
  SwapFather; none implements fee math locally.

## Observability

Structured quote logs include:

- affiliate ID;
- resolved category;
- override/inherited source;
- total fee bps.

Do not log referral tokens, affiliate access tokens, payout addresses, or buyer
destinations.

Add counters for category-fee reads, writes, resets, quote applications, and
policy rejections. Earnings/support views can filter or group by the stored fee
category in a later UI change.

## Tests

### Shared domain and API

- schema boundaries at 0, 1, 1500, and 1501 bps;
- authentication and cross-affiliate isolation;
- supported and unknown category IDs;
- set, update, list, and reset behavior;
- inherited default remains 75 bps after the hard cap becomes 1500;
- database constraints reject invalid rows.

### Category resolution

- every current product family maps to its expected category;
- CakePay/Moon gift cards and prepaid cards map through canonical catalog data;
- Clover's canonical TF2 asset maps to `tf2-keys`;
- crypto destinations map to `swap`;
- unsupported fiat/delivery shapes fail closed rather than accepting a
  caller-provided category.

### Quote and execution

- product exact-output quotes gross up at the category rate;
- crypto exact-input quotes haircut at the category rate;
- current split allocation remains exact at 10% and 15%;
- changing a category does not mutate an existing draft;
- a fresh quote uses the new value and receives a distinct request hash;
- executable plans and earnings preserve `fee_category`;
- 15.01% cannot enter the engine even through a malformed service input.

### SwapFather

- management list filters against tenant mode/families;
- percent parsing and basis-point conversion;
- mutation/reset API requests use the affiliate token;
- no affiliate token exposes no fee-management action;
- quote confirmation renders the customer fee without uSwap branding;
- re-quote price protection still requires confirmation when the fee changes.

## Explicitly out of scope

- Per-SKU, per-user, payment-coin, or volume-tier fees.
- Fees above 15%.
- Affiliate control over platform floor or organization/affiliate split.
- Retroactive changes to quotes, intents, or earnings.
- A zero-fee override.
- Organization-specific maximums or approval workflows.
- Automatically optimizing or recommending a fee.
