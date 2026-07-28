/**
 * Fleet entry point — hosts @B4UFatherBot plus every tenant shop bot in one
 * process. The flagship single-tenant bot also joins the fleet when
 * TELEGRAM_BOT_TOKEN is set. See docs/b4ufather.md.
 *
 *   bun run fleet
 */

import { Bot } from "grammy";
import { config } from "./config.ts";
import { logger } from "./lib/logger.ts";
import { listTenants, pruneStaleSessions } from "./lib/store.ts";
import { registerHandlers } from "./bot/handlers.ts";
import { registerInline } from "./bot/inline.ts";
import { startPoller } from "./bot/poller.ts";
import { getFamilies } from "./bot/catalog.ts";
import { flagshipTenant } from "./tenant.ts";
import { Fleet, rowToTenant } from "./fleet/manager.ts";
import { registerFather } from "./father/father.ts";

const fatherToken = process.env.FATHER_BOT_TOKEN;
if (!fatherToken) throw new Error("FATHER_BOT_TOKEN is required in fleet mode");
if (!process.env.FATHER_ORG_ID) {
  logger.warn("FATHER_ORG_ID not set — tenant payout setup will be unavailable");
}

const fleet = new Fleet();

// Flagship bot (tenant 0) joins the fleet when configured.
let flagship: Bot | null = null;
if (config.telegramBotToken) {
  flagship = new Bot(config.telegramBotToken);
  const me = await flagship.api.getMe();
  const tenant = flagshipTenant(me.id, me.username, config.telegramBotToken);
  registerHandlers(flagship, tenant);
  registerInline(flagship, tenant);
  flagship.catch((err) => logger.error("flagship bot error", { err: String(err.error) }));
  void flagship
    .start({
      allowed_updates: ["message", "callback_query", "inline_query"],
      onStart: () => logger.info("flagship bot polling", { username: me.username }),
    })
    .catch((err) => logger.error("flagship polling died", { err: String(err) }));
}

// Tenant bots.
for (const row of listTenants()) {
  if (row.status !== "active") continue;
  try {
    await fleet.spawn(rowToTenant(row));
  } catch (err) {
    logger.error("tenant spawn failed", { tenantId: row.id, err: String(err) });
  }
}

// Father bot.
const father = new Bot(fatherToken);
const fatherMe = await father.api.getMe();
registerFather(father, fleet, { title: fatherMe.first_name });
father.catch((err) => logger.error("father bot error", { err: String(err.error) }));

// Optional brand alias: @SwapFatherBot — same wizard, preset to swap mode.
const swapFatherToken = process.env.SWAPFATHER_BOT_TOKEN;
if (swapFatherToken) {
  const swapFather = new Bot(swapFatherToken);
  registerFather(swapFather, fleet, { presetMode: "swap" });
  swapFather.catch((err) =>
    logger.error("swapfather bot error", { err: String(err.error) }),
  );
  void swapFather
    .start({
      allowed_updates: ["message", "callback_query"],
      onStart: () => logger.info("swapfather bot polling"),
    })
    .catch((err) => logger.error("swapfather polling died", { err: String(err) }));
}

// One poller serves the whole fleet.
startPoller((tenantId) =>
  tenantId === 0 ? (flagship?.api ?? undefined) : fleet.apiFor(tenantId),
);

getFamilies().catch((err) => logger.warn("catalog warmup failed", { err: String(err) }));

// Wizard/shop sessions expire; stale rows can hold in-flight state.
pruneStaleSessions();
setInterval(() => pruneStaleSessions(), 6 * 60 * 60 * 1000);

logger.info("fleet starting", {
  father: fatherMe.username,
  tenants: listTenants().filter((t) => t.status === "active").length,
});

await father.start({
  allowed_updates: ["message", "callback_query"],
  onStart: () => logger.info("father bot polling"),
});
