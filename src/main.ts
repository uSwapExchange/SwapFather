/**
 * Best B4U — single-tenant entry point (self-host path).
 * Long-polling grammY bot backed by the uSwap Partner API.
 *
 * For the hosted multi-tenant fleet (@B4UFatherBot + whitelabel bots) see
 * src/fleet.ts and docs/b4ufather.md.
 */

import { Bot } from "grammy";
import { config } from "./config.ts";
import { logger } from "./lib/logger.ts";
import { registerHandlers } from "./bot/handlers.ts";
import { registerInline } from "./bot/inline.ts";
import { startPoller } from "./bot/poller.ts";
import { getFamilies } from "./bot/catalog.ts";
import { flagshipTenant } from "./tenant.ts";

if (!config.telegramBotToken) {
  throw new Error("TELEGRAM_BOT_TOKEN is required in single-tenant mode");
}
const bot = new Bot(config.telegramBotToken);
const me = await bot.api.getMe();
const tenant = flagshipTenant(me.id, me.username, config.telegramBotToken);

registerHandlers(bot, tenant);

// Inline mode is a sharing surface (enable via @BotFather /setinline);
// registering the handler is harmless when it's disabled.
registerInline(bot, tenant);
if (!me.supports_inline_queries) {
  logger.info(
    "inline mode disabled — enable with /setinline in @BotFather to allow sharing product cards",
  );
}

bot.catch((err) => {
  logger.error("unhandled bot error", { err: String(err.error) });
});

// Warm the catalog cache so the first /start is instant.
getFamilies().catch((err) =>
  logger.warn("catalog warmup failed", { err: String(err) }),
);

startPoller((tenantId) => (tenantId === 0 ? bot.api : undefined));

logger.info("starting", { username: me.username });

await bot.start({
  allowed_updates: ["message", "callback_query", "inline_query"],
  onStart: () => logger.info("long polling started"),
});
