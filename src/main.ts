/**
 * Best B4U — entry point.
 * Long-polling grammY bot backed by the uSwap Partner API.
 */

import { Bot } from "grammy";
import { config } from "./config.ts";
import { logger } from "./lib/logger.ts";
import { registerHandlers } from "./bot/handlers.ts";
import { registerInline } from "./bot/inline.ts";
import { startPoller } from "./bot/poller.ts";
import { getFamilies } from "./bot/catalog.ts";

const bot = new Bot(config.telegramBotToken);

registerHandlers(bot);

bot.catch((err) => {
  logger.error("unhandled bot error", { err: String(err.error) });
});

// Warm the catalog cache so the first /start is instant.
getFamilies().catch((err) =>
  logger.warn("catalog warmup failed", { err: String(err) }),
);

startPoller(bot.api);

const me = await bot.api.getMe();
logger.info("starting", { username: me.username });

// Inline mode is a sharing surface (enable via @BotFather /setinline);
// registering the handler is harmless when it's disabled.
registerInline(bot, me.username);
if (!me.supports_inline_queries) {
  logger.info("inline mode disabled — enable with /setinline in @BotFather to allow sharing product cards");
}

await bot.start({
  allowed_updates: ["message", "callback_query", "inline_query"],
  onStart: () => logger.info("long polling started"),
});
