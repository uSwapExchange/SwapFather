# Security

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Report privately to the uSwap team ([@uSwapSupport](https://t.me/uSwapSupport) on Telegram, or the contact on [uswap.net](https://uswap.net)) with steps to reproduce. We'll acknowledge and keep you posted on the fix.

## What this bot does and doesn't hold

- **It never holds funds.** Payments go to uSwap bridge deposit addresses; conversion and delivery happen on uSwap's engine. The bot only reads state and shows it.
- **It holds credentials**: your uSwap partner API key (env only) and, in fleet mode, tenant bot tokens and affiliate tokens encrypted at rest with AES-256-GCM under `FLEET_TOKEN_KEY`.
- **It holds order history** per Telegram user: what they bought, bridge/intent ids, deposit addresses. Delivery secrets (codes, accounts) are fetched from uSwap on demand and never persisted.

## Running it safely

- Keep `.env` out of version control (it is gitignored) and set secrets through your host's secret manager.
- `FLEET_TOKEN_KEY` **cannot be rotated in place** — it decrypts every stored tenant token. Generate it once (`openssl rand -hex 32`), back it up with your database, and treat losing it as losing the fleet.
- Give the uSwap API key the minimum scopes you need: `catalog:read`, `bridges:read`, `bridges:write`, `intents:read`, `intents:write`.
- Set `ADMIN_USER_IDS` to real operator accounts only — admins can pause, inspect and remove any tenant.
- Back up `DATABASE_PATH`; it is the only record of orders and tenants.
- Buyers interact in **private chats only** — the bot refuses group interaction by design, because delivery vaults contain redeemable secrets.

## Hosted-fleet considerations

If you run the factory bot for other people:

- Tenants configure presentation and catalog scope only. They get no API credentials and cannot change fees or routing.
- Enrollment rejects bot tokens that already have a webhook set, and caps bots per owner (`MAX_BOTS_PER_OWNER`).
- Every tenant has a kill switch (`/tenants` for admins; pause/remove for owners). `banned` is an operator-only state owners cannot undo.
- Wizard sessions may briefly hold in-flight secrets; they are stored encrypted and pruned after 24 hours.
