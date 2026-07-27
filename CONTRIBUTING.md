# Contributing

Thanks for helping make Best B4U better. A few ground rules keep the bot feeling like one product:

## Setup

```bash
bun install
cp .env.example .env   # your own test bot token + uSwap API key
bun run dev
```

`bun run typecheck` must pass before any PR.

## UX principles

1. **One anchored message.** Navigation edits the same message in place. New messages are reserved for order deposit cards and delivery receipts.
2. **A brand-new user must never wonder what to do.** Every screen states what's happening and offers obvious buttons. If a screen needs explaining, it needs redesigning.
3. **Buttons over typing.** Free-text input only where unavoidable (custom amounts, usernames, search) — and always with a button escape hatch.
4. **Color with meaning.** Green = commits money, red = destructive, blue = selected/recommended. Nothing else is colored.
5. **Never block on prettiness.** Custom emoji, styles, and `tg-time` all degrade to plain unicode automatically.

## Strings & i18n

- Every user-visible string lives in `src/i18n/locales/en.ts` — no literals in handlers or screens.
- Other locales fall back to English per key; partial translations are fine.
- Keep button labels short; Telegram truncates aggressively on small screens.

## uSwap API rules

See the invariants in the README (quote TTL, byte-exact commit tuple, ingress-only deposit addresses, omit-don't-null). If you touch `src/uswap/`, re-verify against the live OpenAPI spec:

```bash
curl https://partner-api.uswap.net/v1/openapi.json
```

## Security

- Never log delivery-vault contents, addresses+amounts together, or API keys.
- Secrets come from the environment only. `.env` is gitignored — keep it that way.
- Found a vulnerability? Please report privately to the uSwap team rather than opening an issue.
