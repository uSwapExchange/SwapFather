# Best B4U

A Telegram bot for buying digital products with crypto — gift cards, Telegram Stars & Premium, Discord Nitro, Mullvad VPN time, prepaid cards and more. Powered by the [uSwap Partner API](https://partner-api.uswap.net/v1/openapi.json).

No accounts, no KYC, no card on file: pick a product, send one crypto payment, get your product delivered right in the chat.

## How it feels

```
🏠 Home            →  🎁 Gift Cards · ✈️ Telegram · 🎮 Discord · 💳 Prepaid · 🛡 Mullvad
🛍 Browse          →  category pills, search, price/discount on every button
⚙️ Configure       →  smart amount presets, "send to me" shortcuts
💰 Pay             →  50+ coins, per-network deposit address + QR + one-tap copy
📦 Delivered       →  live status updates, codes stored under 🧾 My orders forever
```

Every screen is one anchored message edited in place — the chat never fills with menu spam. Buttons use Telegram's colored styles (green confirm, red cancel, blue selection) and uSwap's custom emoji packs when available.

## Features

- **Full uSwap digital catalog, live** — the bot renders whatever `POST /v1/catalog/level` returns, so new brands/products appear without code changes (34+ US gift-card brands, Telegram Stars/Premium/Ads/+888 numbers, Discord Nitro/boosts/OG usernames, Mullvad, CakePay prepaid cards in 160+ countries).
- **Pay with anything uSwap routes** — BTC, ETH, SOL, USDC/USDT (16 networks), XMR, LTC, TON and 50+ more.
- **Price-locked quotes** with a live countdown; late payments still settle at market rate through uSwap's bridge policies.
- **Order tracking** — background polling pushes payment-detected / converting / delivering / done straight into the deposit card; delivery codes are spoiler-wrapped and one-tap copyable.
- **10 languages** out of the box (en, es, ru, zh, fr, de, pt, uk, fa, hi), auto-detected from Telegram, switchable with /language.
- **Custom emoji + colored buttons** (Bot API 10.x) with automatic downgrade to plain unicode when the bot owner has no Telegram Premium.
- **Deep links** — `t.me/YourBot?start=gift-card` opens the gift-card shelf directly.

## Quick start

Requirements: [bun](https://bun.sh) ≥ 1.1.

```bash
git clone https://github.com/uSwapExchange/best-b4u
cd best-b4u
bun install

cp .env.example .env
# fill in TELEGRAM_BOT_TOKEN (from @BotFather) and USWAP_API_KEY
# (partner.uswap.net → API Keys; scopes: catalog:read, bridges:read,
#  bridges:write, intents:read, intents:write)

bun run setup:telegram   # one-shot: localized commands + descriptions
bun run dev              # long-polling bot with hot reload
```

State lives in a single SQLite file (`DATABASE_PATH`, default `./data/bestb4u.db`) — orders, sessions and language preferences survive restarts. No other infrastructure is needed; the bot is a pure API client.

## Architecture

```
src/
  main.ts               entry point: grammY bot + order poller
  config.ts             env config (no secrets in code, ever)
  uswap/
    client.ts           thin typed client for the Partner API
    types.ts            wire types (catalog level, quotes, intents, delivery vault)
  bot/
    handlers.ts         update routing: commands, callbacks, text input
    flow.ts             purchase state machine (browse → amount → dest → pay → quote → open)
    screens.ts          pure renderers: state → { text, keyboard }
    poller.ts           order status polling + delivery notifications
    catalog.ts          product families, labels, destination rules
    session.ts          per-user flow state (SQLite-backed)
    keyboard.ts         inline keyboard primitives (styles, copy buttons, icons)
    emoji.ts            uSwap custom emoji with unicode fallbacks
    uswap-emoji-ids.json ids from the public uSwapAssets/Networks/Banners packs
  i18n/
    index.ts            tiny i18n engine ({placeholder} interpolation, en fallback)
    locales/*.ts        one flat string map per language
  lib/
    store.ts            SQLite schema + queries (users, sessions, orders)
    format.ts           raw↔human amounts (BigInt), preset ladders, HTML escaping
scripts/
  setup-telegram.ts     set localized bot commands + descriptions
```

### Purchase pipeline (uSwap Partner API)

```
POST /v1/catalog/level            browse: one call per screen, echoed segments descend
POST /v1/quotes                   input_side:"to" — "I want exactly N stars / $X of card"
POST /v1/bridges/open             commit: echo draft_id/plan_id/leg_plan_ids/expires_at/request_hash
                                  + source_amount_ceiling_raw guard + Idempotency-Key
GET  /v1/intents/{id}             poll: awaiting_deposit → matched → executing → delivering → completed
GET  /v1/bridges/{id}/digital-delivery   the vault: codes/accounts, spoiler-wrapped in chat
```

Key invariants the code respects (learned the careful way):

- Quote drafts expire in ~5 minutes and are held in memory server-side — on `quote_expired` / `stale_plan` / `quote_not_found` the bot silently re-quotes and retries once.
- The commit tuple (`draft_id`, `plan_id`, `leg_plan_ids` in order, `expires_at`, `request_hash`) is echoed byte-exact.
- Deposit addresses come only from the bridge's `ingress_endpoints` — never from a dry quote.
- Optional API fields are omitted, never sent as `null`.
- Display amounts come from the committed intent (commit re-quotes internally), not the draft.
- An expired intent that later receives funds is replaced server-side (`replaced_by_intent_id`); the poller follows the replacement automatically.

### Custom emoji

uSwap publishes three public custom-emoji packs (owned by @uSwap_Bot):
[uSwapAssets](https://t.me/addemoji/uSwapAssets_by_uSwap_Bot) ·
[uSwapNetworks](https://t.me/addemoji/uSwapNetworks_by_uSwap_Bot) ·
[uSwapBanners](https://t.me/addemoji/uSwapBanners_by_uSwap_Bot)

Telegram lets a bot send custom emoji (message entities and button icons) when the **bot owner has Telegram Premium** or the bot owns a Fragment username. The bot renders them optimistically and permanently downgrades to curated unicode the first time Telegram rejects a send — so a self-hosted instance without Premium still looks intentional. Force plain unicode with `CUSTOM_EMOJI=0`.

## Adding a language

1. Copy `src/i18n/locales/en.ts` to `<code>.ts`, translate the values (keep HTML tags, `{placeholders}` and emoji intact).
2. Register it in `src/i18n/index.ts` (`locales` map + `SUPPORTED_LANGUAGES`).
3. Optionally add localized commands/descriptions in `scripts/setup-telegram.ts`.

Missing keys fall back to English, so partial translations are safe.

## Operational notes

- **Polling, not webhooks.** Order status is polled every 8s per active order; webhook support (uSwap signs with HMAC-SHA256) is a welcome contribution for high-volume deployments.
- The bot only talks to `partner-api.uswap.net` and `api.telegram.org`. The uSwap API key never leaves the server; buyers never see it.
- `fulfillment` is uSwap's responsibility — if an order lands in a held/failed state the bot tells the user their funds are safe and to contact support.

## License

[MIT](./LICENSE)
