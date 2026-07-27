/**
 * A tenant is one branded shop bot. The flagship single-tenant bot
 * (src/main.ts) is tenant 0, configured from env; fleet tenants come from
 * the tenants table and are managed by @B4UFatherBot.
 */

export type TenantMode = "shop" | "swap" | "both";

export interface Tenant {
  id: number;
  /** What the bot offers: digital products, crypto swaps, or both. */
  mode: TenantMode;
  botId: number;
  botUsername: string;
  /** Plaintext token (decrypted at load; encrypted at rest for fleet rows). */
  botToken: string;
  ownerUserId: number | null;
  brandName: string;
  supportHandle: string | null;
  /** Enabled catalog family ids; null = the full digital catalog. */
  families: string[] | null;
  /** Affiliate creator code — resolved to a referral_token on every quote. */
  creatorCode: string | null;
  /** Affiliate self-service API token (plaintext at runtime). */
  affiliateToken: string | null;
  status: "active" | "paused" | "deleted";
}

/** True when the bot sells exactly one category — the bot IS that category. */
export function isNiche(tenant: Tenant): boolean {
  return tenant.families?.length === 1;
}

export function sellsProducts(tenant: Tenant): boolean {
  return tenant.mode !== "swap";
}

export function sellsSwaps(tenant: Tenant): boolean {
  return tenant.mode !== "shop";
}

export function defaultSupportHandle(): string {
  return process.env.SUPPORT_HANDLE ?? "@uSwapSupport";
}

/** Tenant 0 — the flagship bot, configured from env (single-tenant mode). */
export function flagshipTenant(botId: number, botUsername: string, botToken: string): Tenant {
  return {
    id: 0,
    mode: (process.env.BOT_MODE as TenantMode) || "shop",
    botId,
    botUsername,
    botToken,
    ownerUserId: null,
    brandName: process.env.BRAND_NAME ?? "Best B4U",
    supportHandle: defaultSupportHandle(),
    families: null,
    creatorCode: process.env.CREATOR_CODE ?? null,
    affiliateToken: null,
    status: "active",
  };
}
