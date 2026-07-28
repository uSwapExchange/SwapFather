/**
 * Fleet manager — spawns and stops the tenant shop bots inside one process.
 * Each bot runs its own long-poll loop; fine into the hundreds of tenants
 * (the upgrade path beyond that is a single webhook endpoint, see spec).
 */

import { Bot, type Api } from "grammy";
import { registerHandlers } from "../bot/handlers.ts";
import { registerInline } from "../bot/inline.ts";
import type { Tenant } from "../tenant.ts";
import { defaultSupportHandle } from "../tenant.ts";
import { decryptSecret } from "../lib/crypto.ts";
import { logger } from "../lib/logger.ts";
import type { TenantRow } from "../lib/store.ts";

export function rowToTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    mode: (row.mode as Tenant["mode"]) || "shop",
    botId: row.bot_id,
    botUsername: row.bot_username,
    botToken: decryptSecret(row.bot_token_enc),
    ownerUserId: row.owner_user_id,
    brandName: row.brand_name,
    welcomeText: row.welcome_text,
    supportHandle: row.support_handle ?? defaultSupportHandle(),
    families: row.families ? (JSON.parse(row.families) as string[]) : null,
    creatorCode: row.creator_code,
    affiliateToken: row.affiliate_token_enc ? decryptSecret(row.affiliate_token_enc) : null,
    status: row.status as Tenant["status"],
  };
}

interface Running {
  bot: Bot;
  tenant: Tenant;
}

export class Fleet {
  private running = new Map<number, Running>();

  apiFor(tenantId: number): Api | undefined {
    return this.running.get(tenantId)?.bot.api;
  }

  isRunning(tenantId: number): boolean {
    return this.running.has(tenantId);
  }

  async spawn(tenant: Tenant): Promise<void> {
    if (this.running.has(tenant.id)) await this.stop(tenant.id);
    const bot = new Bot(tenant.botToken);
    registerHandlers(bot, tenant);
    registerInline(bot, tenant);
    bot.catch((err) => {
      logger.error("tenant bot error", {
        tenantId: tenant.id,
        bot: tenant.botUsername,
        err: String(err.error),
      });
    });
    this.running.set(tenant.id, { bot, tenant });
    void bot
      .start({
        allowed_updates: ["message", "callback_query", "inline_query"],
        onStart: () =>
          logger.info("tenant bot polling", {
            tenantId: tenant.id,
            bot: tenant.botUsername,
          }),
      })
      .catch((err) => {
        logger.error("tenant bot polling died", {
          tenantId: tenant.id,
          bot: tenant.botUsername,
          err: String(err),
        });
        this.running.delete(tenant.id);
      });
  }

  async stop(tenantId: number): Promise<void> {
    const entry = this.running.get(tenantId);
    if (!entry) return;
    this.running.delete(tenantId);
    await entry.bot.stop().catch(() => {});
    logger.info("tenant bot stopped", { tenantId });
  }
}
