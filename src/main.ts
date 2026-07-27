/**
 * Best B4U — entry point.
 * Long-polling grammY bot backed by the uSwap Partner API.
 */

import { Bot } from "grammy";
import { config } from "./config.ts";
import { logger } from "./lib/logger.ts";
import { registerHandlers } from "./bot/handlers.ts";
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

await bot.start({
  allowed_updates: ["message", "callback_query"],
  onStart: () => logger.info("long polling started"),
});
