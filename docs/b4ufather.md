# B4UFather — no-code whitelabel Best B4U bots

**Status: implemented** (see `src/fleet.ts`, `src/father/`, `src/tenant.ts`). This document is the design spec and the reference for how the fleet behaves.

## What it is

@B4UFatherBot is BotFather for shops. Anyone can mint their **own branded bot** that sells uSwap digital products — under their name, with exactly the catalog slice they want:

- a **Mullvad-only** VPN bot,
- a **Discord-only** Nitro/boost shop,
- a **gift-cards-only** storefront,
- or the whole catalog under their brand.

The tenant pastes a bot token from @BotFather, picks a brand name and categories, and their bot is live in under a minute. uSwap hosts the fleet; the tenant never touches funds, keys, or code.

## Why this shape

- **Same repo, two entrypoints.** Tenant bots are byte-for-byte the Best B4U UX — separate repos would mean a shared package and drift. `src/main.ts` stays the single-tenant self-host path (env-configured, no fleet code involved); `src/fleet.ts` is the hosted multi-tenant path.
- **Monetization rides the existing affiliate rails.** No new billing surface: each tenant is registered as a uSwap **affiliate** (`POST /v1/organizations/{org}/affiliate-registrations`), and every quote from their bot carries their resolved `referral_token`, so their creator-fee share accrues automatically and pays out to their NEAR/XMR address. All swaps execute under the uSwap org API key — tenants get **no API credentials** at all.
- **Zero custody, bounded abuse surface.** Tenants configure presentation and catalog scope only. They cannot set fees, touch routing, or see other tenants. Org-side affiliate registration settings (approval mode, cap) act as the fleet's admission throttle, and every tenant has a kill switch.

## Tenancy model

```
tenants (SQLite, fleet-owned)
  id                INTEGER PK
  bot_id            INTEGER UNIQUE        -- Telegram bot id
  bot_username      TEXT
  bot_token_enc     TEXT                  -- AES-256-GCM, key = FLEET_TOKEN_KEY
  owner_user_id     INTEGER               -- Telegram user who created it
  brand_name        TEXT
  support_handle    TEXT NULL
  families          TEXT NULL             -- JSON array of family ids; NULL = all
  creator_code      TEXT NULL             -- affiliate username; NULL = earnings not set up
  affiliate_token_enc TEXT NULL           -- uswp affiliate self-service key
  status            TEXT                  -- active | paused | deleted
```

`users`, `sessions`, `orders` gain a `tenant_id` column (0 = the flagship/single-tenant bot), so one process and one database serve the whole fleet.

A `Tenant` value is threaded through handler registration (closures — no globals):

| Config | Effect |
|---|---|
| `brand_name` | Replaces "Best B4U" in every screen and in the bot's localized descriptions/commands (`{brand}` i18n placeholder). |
| `families` | Filters the catalog. **Exactly one family ⇒ niche mode**: /start skips the shop grid and opens that category directly — the bot *is* a Mullvad bot, not a mall with one shop in it. |
| `support_handle` | Shown in /help and failure messages. |
| `creator_code` | Resolved to a TTL-bound `referral_token` (cached until expiry) and stamped on every quote + commit. |

Custom emoji / button icons degrade **per bot** (the rule is owner-has-Premium, and every tenant is a different owner): rendering always produces the rich version; the send layer strips `tg-emoji` + button icons for bots that Telegram has rejected once.

## @B4UFatherBot UX

Same one-anchored-message discipline as the shop bots. English-only v1.

```
/start → 🤖 Create my bot · 📋 My bots · 💰 Earnings · ❓ How it works

Create wizard:
 1. Token     — "Make a bot in @BotFather (/newbot), paste the token here."
                Validated live via getMe; rejects tokens already enrolled.
 2. Brand     — default = the bot's Telegram name; free-text override.
 3. Catalog   — [🛍 Everything] or multi-select toggles per family
                (✓ Gift Cards, ✗ Telegram, …) — the list is live from the
                catalog, so new uSwap families appear automatically.
 4. Support   — optional @handle shown to their buyers.
 5. Payout    — optional now, required to earn: NEAR account (required by
                the API) + optional XMR; picks a creator code (default:
                bot username), registers the affiliate, stores the
                self-service token. "Set up later" keeps the bot fully
                functional with no attribution.
 6. Live      — tenant row saved, bot spawned into the fleet, localized
                commands + "what can this bot do?" description pushed to
                the child bot with their brand.

My bots → per bot: ⏸ pause/▶ resume · ✏️ brand · 🗂 categories ·
          💬 support · 💰 payout/earnings (via /v1/affiliate/earnings) ·
          🗑 remove
```

Admin (`ADMIN_USER_IDS`): `/tenants` lists the fleet with order counts; any tenant can be paused from there — the kill switch.

## Runtime

- One process (`bun run fleet`), one long-poll loop per bot (father + tenants). Fine into the hundreds of tenants; the documented upgrade path beyond that is a single webhook endpoint multiplexed by token — grammY supports both, nothing in the tenant model changes.
- One shared order poller iterates all tenants' active orders with each tenant's own `Api` handle.
- Secrets: child bot tokens and affiliate tokens are AES-256-GCM encrypted at rest (`FLEET_TOKEN_KEY`, 64-hex-char env). The uSwap org key exists only in the fleet's env.
- Pausing stops the child bot's polling immediately; deleting also forgets the token.

## Environment (fleet mode)

```
FATHER_BOT_TOKEN=        # @B4UFatherBot token
USWAP_API_KEY=           # org key — all tenant swaps run under it
FATHER_ORG_ID=           # org accepting affiliate registrations
FLEET_TOKEN_KEY=         # 32-byte hex for token encryption at rest
DATABASE_PATH=./data/fleet.db
ADMIN_USER_IDS=          # fleet operators
SUPPORT_HANDLE=          # default support contact for tenants that set none
```

## Swap mode

Tenants choose a **type** in the wizard: 🛍 Shop, 🔄 Swap, or both (`tenants.mode`).
A swap bot is a whitelabel exchange: receive coin → payout address (+ memo on
memo-bearing chains) → pay coin → amount ("0.1" in the pay coin or "$100") →
live quote → deposit. It reuses the shop's pay picker, quote, deposit and
poller surfaces wholesale; the destination is a synthesized crypto "leaf"
instead of a product. Swap-only bots open straight into the receive picker —
the bot IS the exchange. @SwapFatherBot (env `SWAPFATHER_BOT_TOKEN`) is a brand
alias of the same factory with the wizard preset to swap mode.

## Explicitly out of scope (v1)

- Tenant-set markup/fees — splits are org policy, not tenant config.
- Tenant-provided org API keys (that's just self-hosting; the repo already supports it).
- Per-asset/per-pair disables below family granularity (families cover the niche-bot use case; pair-level toggles can follow if asked for).
- Father-bot localization.
