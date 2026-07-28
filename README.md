# Best B4U

Telegram commerce on the [uSwap](https://uswap.net) engine.

Run **a shop** (gift cards, Telegram Stars & Premium, Discord Nitro, Mullvad VPN, TF2 keys, prepaid cards), **a swap service** (any coin → any coin, 50+ currencies), or **both** — and optionally let anyone mint their own branded copy of it in under a minute.

No accounts, no KYC, no card on file: pick a product, send one crypto payment, get it delivered in the chat.

```
🏠 Home         →  🎁 Gift Cards · ✈️ Telegram · 🎮 Discord · 💳 Prepaid · 🛡 Mullvad · 🔑 TF2 · 🔄 Swap
🛍 Browse       →  category aisles with counts, search, price + discount on every button
⚙️ Configure    →  smart amount presets, "send it to me" shortcuts, min-deposit hints
💰 Pay          →  50+ coins, per-network deposit address, QR + one-tap copy
📦 Delivered    →  live status in place, codes spoiler-wrapped, saved under 🧾 My orders
```

Every screen is one anchored message edited in place — the chat never fills with menu spam. Buttons use Telegram's colored styles and uSwap's custom emoji packs when the bot is entitled to them.

## Three ways to run it

| Mode | Command | What you get |
|---|---|---|
| **Shop / swap bot** | `bun run start` | One bot you own, configured by env (`BOT_MODE=shop\|swap\|both`) |
| **Fleet** | `bun run fleet` | A factory bot (@SwapFather-style) that lets anyone mint their own branded bot, hosted by you |
| **Docker** | `docker compose up` | The fleet in a container, SQLite on a named volume |

## Quick start (single bot)

Requirements: [bun](https://bun.sh) ≥ 1.1.

```bash
git clone https://github.com/uSwapExchange/swapfather
cd swapfather
bun install

cp .env.example .env
#   TELEGRAM_BOT_TOKEN  — from @BotFather
#   USWAP_API_KEY       — partner.uswap.net → API Keys
#                         scopes: catalog:read, bridges:read, bridges:write,
#                                 intents:read, intents:write
#   BOT_MODE            — shop (default) | swap | both

bun run setup:telegram   # one-shot: localized commands + descriptions
bun run dev              # long-polling bot with hot reload
```

State lives in one SQLite file (`DATABASE_PATH`, default `./data/bestb4u.db`) — orders, sessions, language preferences, and (in fleet mode) tenants. No other infrastructure: the bot is a pure API client and needs no inbound ports.

## Features

- **The whole uSwap digital catalog, live.** Screens are rendered from `POST /v1/catalog/level`, so new brands and product families appear without code changes.
- **Aisle-first browsing.** Big categories open as a chooser with counts (`🎮 Gaming (5)`) instead of a wall of buttons; breadcrumbs (`🎁 Gift Cards › Gaming`) on every screen; server-side search.
- **Crypto→crypto swaps.** A config card: send/receive pair with a 🔁 flip, amount and payout address filled in any order, live quote when both are set. Memo-bearing chains (XRP, XLM, TON) prompt for a memo automatically.
- **Pay with anything uSwap routes** — BTC, ETH, SOL, USDC/USDT across 16 networks, XMR, LTC, TON and 50+ more; min-deposit shown before you type.
- **Price-locked quotes** with a live countdown, a spend ceiling bound to what the user approved, and silent re-quote + explicit re-confirmation if the market moves.
- **Order tracking** — background polling edits the deposit card in place through detected → converting → delivering → done; delivery codes arrive spoiler-wrapped and stay under 🧾 My orders.
- **Optional refund address** per order (sets the bridge's refund destination) so a failed swap self-recovers.
- **10 languages**, auto-detected from Telegram, switchable with `/language`.
- **Inline mode** — `@YourBot amazon` shares a product card with a buy button into any chat (enable once with `/setinline` in @BotFather).
- **Deep links** — `t.me/YourBot?start=gift-card`, or `?start=gc-amazon` to land on a brand.
- **Custom emoji + colored buttons** (Bot API 10.x) with automatic per-bot downgrade to unicode when the owner isn't entitled.

## Fleet mode (@SwapFather)

`bun run fleet` hosts a **factory bot** plus every bot minted through it. A tenant pastes a token from @BotFather, picks a brand, a type (shop / swap / both) and which categories to sell, and their bot is live — hosted by you, with no code and no API keys of their own.

Tenants earn a cut of every sale through uSwap's affiliate program (a creator code is registered for them and stamped on every quote). They never touch funds, keys, or credentials.

```bash
FATHER_BOT_TOKEN=   # the factory bot (@BotFather)
USWAP_API_KEY=      # your org key — all tenant orders run under it
FATHER_ORG_ID=      # org accepting affiliate registrations (tenant payouts)
FLEET_TOKEN_KEY=    # openssl rand -hex 32 — encrypts tenant tokens at rest
ADMIN_USER_IDS=     # fleet operators (/tenants)
bun run fleet
```

⚠️ **`FLEET_TOKEN_KEY` is not rotatable in place** — it decrypts every stored tenant bot token. Losing or changing it orphans the whole fleet. Back it up with your database.

Tenant payouts need self-registration enabled on the organization (uSwap dashboard → Affiliates → registration settings: enable + set a cap, or configure hCaptcha). Design, tenancy model and operator notes: [docs/b4ufather.md](./docs/b4ufather.md).

## Architecture

```
src/
  main.ts                entry: single-tenant bot (+ order poller)
  fleet.ts               entry: factory bot + all tenant bots in one process
  config.ts              env config (no secrets in code, ever)
  tenant.ts              Tenant model: brand, mode, catalog scope, payouts
  uswap/
    client.ts            typed uSwap Partner API client
    types.ts             wire types (catalog level, quotes, intents, delivery)
  bot/
    handlers.ts          update routing: commands, callbacks, text input
    flow.ts              purchase + swap state machines
    screens.ts           pure renderers: state → { text, keyboard }
    poller.ts            order status polling + delivery notifications
    catalog.ts           product families, labels, destination rules
    inline.ts            inline-mode product cards
    session.ts           per-(tenant,user) flow state
    keyboard.ts          inline keyboards (styles, copy buttons, icons)
    emoji.ts             uSwap custom emoji with unicode fallbacks
  father/
    father.ts            the factory bot: create wizard + manage screens
    affiliate.ts         affiliate registration / earnings
  fleet/
    manager.ts           spawns, stops and reloads tenant bots
  i18n/                  tiny i18n engine + one flat map per language
  lib/
    store.ts             SQLite schema + queries (multi-tenant)
    crypto.ts            AES-256-GCM for tokens at rest
    format.ts            raw↔human amounts (BigInt), preset ladders, escaping
    telegram-profile.ts  localized commands + descriptions
```

### Purchase pipeline (uSwap Partner API)

```
POST /v1/catalog/level                    browse: one call per screen
GET  /v1/catalog/assets?side=from|to      payment / receive coins
GET  /v1/catalog/networks/{chain}/assets  min-deposit bounds
POST /v1/quotes                           input_side "to" (products) / "from" (swaps)
POST /v1/bridges/open                     commit: echo the quote tuple byte-exact
GET  /v1/intents/{id}                     poll to completion
GET  /v1/bridges/{id}/digital-delivery    the vault: codes, accounts, actions
POST /v1/bridges/{id}/digital-delivery/actions
PATCH /v1/bridges/{id}/policies           optional refund destination
POST /v1/referrals/resolve                creator-code attribution
```

Invariants the code respects (learned the careful way):

- Quote drafts expire in ~5 minutes and live in memory server-side — on `quote_expired` / `stale_plan` / `quote_not_found` the bot re-quotes once and re-confirms if the price moved beyond the approved ceiling.
- The commit tuple (`draft_id`, `plan_id`, `leg_plan_ids` in order, `expires_at`, `request_hash`) is echoed byte-exact.
- Deposit addresses come only from the bridge's `ingress_endpoints`, matched to the chosen chain — never from a dry quote, never a fallback to another chain.
- Optional API fields are omitted, never sent as `null`.
- Display amounts come from the committed intent (commit re-quotes internally), not the draft.
- An expired intent that later receives funds is replaced server-side; the poller follows `replaced_by_intent_id`.
- `side=to` asset lists expand one row per network — aggregate by symbol before rendering.

### Custom emoji

uSwap publishes three public packs (owned by @uSwap_Bot):
[Assets](https://t.me/addemoji/uSwapAssets_by_uSwap_Bot) ·
[Networks](https://t.me/addemoji/uSwapNetworks_by_uSwap_Bot) ·
[Banners](https://t.me/addemoji/uSwapBanners_by_uSwap_Bot)

Telegram lets a bot send custom emoji (message entities and `icon_custom_emoji_id` button icons) when the **bot owner has Telegram Premium** or the bot holds a Fragment username. Rendering is optimistic; the first rejection (`ENTITY_TEXT_INVALID`) permanently downgrades **that bot** to curated unicode, so a self-hosted instance without Premium still looks intentional. Force plain unicode with `CUSTOM_EMOJI=0`.

## Configuration

| Variable | Mode | Purpose |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | single (required) | Your bot, from @BotFather |
| `USWAP_API_KEY` | both (required) | uSwap partner key |
| `USWAP_API_BASE` | both | Defaults to `https://partner-api.uswap.net` |
| `BOT_MODE` | single | `shop` (default), `swap`, or `both` |
| `BRAND_NAME` / `WELCOME_TEXT` | single | Override the bot's name / home line |
| `CREATOR_CODE` | single | Your uSwap creator code for attribution |
| `DATABASE_PATH` | both | SQLite file, default `./data/bestb4u.db` |
| `SUPPORT_HANDLE` | both | Contact shown to buyers |
| `CUSTOM_EMOJI` | both | `0` disables custom emoji entirely |
| `DEBUG` | both | `1` enables debug logging |
| `FATHER_BOT_TOKEN` | fleet (required) | The factory bot |
| `FATHER_ORG_ID` | fleet | Org accepting affiliate registrations |
| `FLEET_TOKEN_KEY` | fleet (required) | 32-byte hex; encrypts tenant tokens |
| `ADMIN_USER_IDS` | fleet | Comma-separated operator user ids |
| `MAX_BOTS_PER_OWNER` | fleet | Default 10 |
| `SWAPFATHER_BOT_TOKEN` | fleet | Optional second factory preset to swap-only |

## Adding a language

1. Copy `src/i18n/locales/en.ts` to `<code>.ts` and translate the values (keep HTML tags, `{placeholders}` and emoji intact).
2. Register it in `src/i18n/index.ts` (`locales` map + `SUPPORTED_LANGUAGES`).
3. Optionally add localized commands/descriptions in `src/lib/telegram-profile.ts`.

Missing keys fall back to English, so partial translations are safe to ship.

## Operational notes

- **Polling, not webhooks.** Orders are polled every 8s; webhook support (uSwap signs with HMAC-SHA256) is a welcome contribution for high-volume deployments.
- The bot talks only to `api.telegram.org` and your uSwap API base. The API key never leaves the server; buyers never see it.
- Fulfilment is uSwap's responsibility — if an order lands in a held/failed state the bot tells the buyer their funds are safe and points them at support.
- Back up `DATABASE_PATH` (and `FLEET_TOKEN_KEY` alongside it, in fleet mode).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the UX principles and API rules. Security issues: [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
