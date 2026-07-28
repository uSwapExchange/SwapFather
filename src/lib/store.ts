/**
 * SQLite persistence (bun:sqlite) — multi-tenant.
 *
 * Tables:
 *  - users:    per-(tenant,user) preferences (language override) + last seen
 *  - sessions: per-(tenant,user) transient purchase flow state (JSON blob)
 *  - orders:   committed purchases → bridge/intent ids for status polling
 *  - tenants:  fleet-managed whitelabel bots (see docs/b4ufather.md)
 *
 * tenant_id 0 is the flagship single-tenant bot.
 */

import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "../config.ts";

mkdirSync(dirname(config.databasePath), { recursive: true });

export const db = new Database(config.databasePath);
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  tenant_id INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER NOT NULL,
  language TEXT,
  tg_language_code TEXT,
  username TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  tenant_id INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER NOT NULL,
  state TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL DEFAULT 0,
  user_id INTEGER NOT NULL,
  chat_id INTEGER NOT NULL,
  message_id INTEGER,
  bridge_id TEXT NOT NULL,
  intent_id TEXT NOT NULL,
  status TEXT NOT NULL,
  product_label TEXT NOT NULL,
  pay_label TEXT NOT NULL,
  deposit_address TEXT,
  deposit_memo TEXT,
  deposit_amount TEXT,
  deposit_asset TEXT,
  expires_at TEXT,
  pay_asset_v1 TEXT,
  refund_set INTEGER NOT NULL DEFAULT 0,
  qr_message_id INTEGER,
  delivered_notified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_active ON orders (status) WHERE status NOT IN ('completed','failed','refunded','cancelled','expired');
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (tenant_id, user_id, id DESC);

CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mode TEXT NOT NULL DEFAULT 'shop',
  bot_id INTEGER NOT NULL UNIQUE,
  bot_username TEXT NOT NULL,
  bot_token_enc TEXT NOT NULL,
  owner_user_id INTEGER NOT NULL,
  brand_name TEXT NOT NULL,
  welcome_text TEXT,
  support_handle TEXT,
  families TEXT,
  creator_code TEXT,
  affiliate_token_enc TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants (owner_user_id);

CREATE TABLE IF NOT EXISTS father_sessions (
  user_id INTEGER PRIMARY KEY,
  state TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);

// Column migrations for DBs created by older versions.
for (const ddl of [
  "ALTER TABLE tenants ADD COLUMN mode TEXT NOT NULL DEFAULT 'shop'",
  "ALTER TABLE orders ADD COLUMN pay_asset_v1 TEXT",
  "ALTER TABLE orders ADD COLUMN refund_set INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE tenants ADD COLUMN welcome_text TEXT",
]) {
  try {
    db.exec(ddl);
  } catch {
    // column already exists
  }
}

export interface UserRow {
  tenant_id: number;
  user_id: number;
  language: string | null;
  tg_language_code: string | null;
  username: string | null;
}

export function upsertUser(u: {
  tenantId: number;
  userId: number;
  tgLanguageCode?: string;
  username?: string;
}): UserRow {
  const now = new Date().toISOString();
  db.query(
    `INSERT INTO users (tenant_id, user_id, tg_language_code, username, first_seen_at, last_seen_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?5)
     ON CONFLICT(tenant_id, user_id) DO UPDATE SET
       tg_language_code = coalesce(excluded.tg_language_code, users.tg_language_code),
       username = coalesce(excluded.username, users.username),
       last_seen_at = excluded.last_seen_at`,
  ).run(u.tenantId, u.userId, u.tgLanguageCode ?? null, u.username ?? null, now);
  return db
    .query<UserRow, [number, number]>(
      "SELECT tenant_id, user_id, language, tg_language_code, username FROM users WHERE tenant_id = ?1 AND user_id = ?2",
    )
    .get(u.tenantId, u.userId)!;
}

export function setUserLanguage(tenantId: number, userId: number, language: string) {
  db.query("UPDATE users SET language = ?3 WHERE tenant_id = ?1 AND user_id = ?2").run(
    tenantId,
    userId,
    language,
  );
}

export function getUserLangRow(
  tenantId: number,
  userId: number,
): { language: string | null; tg_language_code: string | null } | null {
  return db
    .query<{ language: string | null; tg_language_code: string | null }, [number, number]>(
      "SELECT language, tg_language_code FROM users WHERE tenant_id = ?1 AND user_id = ?2",
    )
    .get(tenantId, userId);
}

export function getSession<T>(tenantId: number, userId: number): T | null {
  const row = db
    .query<{ state: string }, [number, number]>(
      "SELECT state FROM sessions WHERE tenant_id = ?1 AND user_id = ?2",
    )
    .get(tenantId, userId);
  if (!row) return null;
  try {
    return JSON.parse(row.state) as T;
  } catch {
    return null;
  }
}

export function saveSession(tenantId: number, userId: number, state: unknown) {
  db.query(
    `INSERT INTO sessions (tenant_id, user_id, state, updated_at) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(tenant_id, user_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`,
  ).run(tenantId, userId, JSON.stringify(state), new Date().toISOString());
}

export function clearSession(tenantId: number, userId: number) {
  db.query("DELETE FROM sessions WHERE tenant_id = ?1 AND user_id = ?2").run(
    tenantId,
    userId,
  );
}

export interface OrderRow {
  id: number;
  tenant_id: number;
  user_id: number;
  chat_id: number;
  message_id: number | null;
  bridge_id: string;
  intent_id: string;
  status: string;
  product_label: string;
  pay_label: string;
  deposit_address: string | null;
  deposit_memo: string | null;
  deposit_amount: string | null;
  deposit_asset: string | null;
  expires_at: string | null;
  pay_asset_v1: string | null;
  refund_set: number;
  qr_message_id: number | null;
  delivered_notified: number;
  created_at: string;
}

export const TERMINAL_ORDER_STATUSES = new Set([
  "completed",
  "failed",
  "refunded",
  "cancelled",
  "expired",
]);

export function insertOrder(o: {
  tenantId: number;
  userId: number;
  chatId: number;
  bridgeId: string;
  intentId: string;
  status: string;
  productLabel: string;
  payLabel: string;
  depositAddress?: string | null;
  depositMemo?: string | null;
  depositAmount?: string | null;
  depositAsset?: string | null;
  expiresAt?: string | null;
  payAssetV1?: string | null;
}): number {
  const now = new Date().toISOString();
  const res = db
    .query(
      `INSERT INTO orders (tenant_id, user_id, chat_id, bridge_id, intent_id, status, product_label, pay_label,
        deposit_address, deposit_memo, deposit_amount, deposit_asset, expires_at, pay_asset_v1, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?15, ?14, ?14)`,
    )
    .run(
      o.tenantId,
      o.userId,
      o.chatId,
      o.bridgeId,
      o.intentId,
      o.status,
      o.productLabel,
      o.payLabel,
      o.depositAddress ?? null,
      o.depositMemo ?? null,
      o.depositAmount ?? null,
      o.depositAsset ?? null,
      o.expiresAt ?? null,
      now,
      o.payAssetV1 ?? null,
    );
  return Number(res.lastInsertRowid);
}

export function setOrderRefundSet(orderId: number) {
  db.query("UPDATE orders SET refund_set = 1 WHERE id = ?1").run(orderId);
}

export function setOrderMessage(orderId: number, messageId: number) {
  db.query("UPDATE orders SET message_id = ?2 WHERE id = ?1").run(orderId, messageId);
}

export function setOrderQrMessage(orderId: number, messageId: number | null) {
  db.query("UPDATE orders SET qr_message_id = ?2 WHERE id = ?1").run(orderId, messageId);
}

export function updateOrderStatus(orderId: number, status: string) {
  db.query("UPDATE orders SET status = ?2, updated_at = ?3 WHERE id = ?1").run(
    orderId,
    status,
    new Date().toISOString(),
  );
}

export function updateOrderIntent(orderId: number, intentId: string) {
  db.query("UPDATE orders SET intent_id = ?2 WHERE id = ?1").run(orderId, intentId);
}

export function markOrderDeliveredNotified(orderId: number) {
  db.query("UPDATE orders SET delivered_notified = 1 WHERE id = ?1").run(orderId);
}

export function getOrder(orderId: number): OrderRow | null {
  return db.query<OrderRow, [number]>("SELECT * FROM orders WHERE id = ?1").get(orderId);
}

export function listActiveOrders(): OrderRow[] {
  // Expired orders stay watched for 24h: a late deposit mints a replacement
  // intent server-side (replaced_by_intent_id) and the order comes back to
  // life — the poller must see that happen.
  return db
    .query<OrderRow, []>(
      `SELECT * FROM orders
       WHERE status NOT IN ('completed','failed','refunded','cancelled','expired')
          OR (status = 'expired'
              AND created_at >= strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 day'))`,
    )
    .all();
}

export function listUserOrders(tenantId: number, userId: number, limit = 10): OrderRow[] {
  return db
    .query<OrderRow, [number, number, number]>(
      "SELECT * FROM orders WHERE tenant_id = ?1 AND user_id = ?2 ORDER BY id DESC LIMIT ?3",
    )
    .all(tenantId, userId, limit);
}

export function countTenantOrders(tenantId: number): { total: number; completed: number } {
  const row = db
    .query<{ total: number; completed: number }, [number]>(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM orders WHERE tenant_id = ?1`,
    )
    .get(tenantId);
  return { total: row?.total ?? 0, completed: row?.completed ?? 0 };
}

// ---------- tenants ----------

export interface TenantRow {
  id: number;
  mode: string;
  bot_id: number;
  bot_username: string;
  bot_token_enc: string;
  owner_user_id: number;
  brand_name: string;
  welcome_text: string | null;
  support_handle: string | null;
  families: string | null;
  creator_code: string | null;
  affiliate_token_enc: string | null;
  status: string;
  created_at: string;
}

export function insertTenant(t: {
  mode: string;
  botId: number;
  botUsername: string;
  botTokenEnc: string;
  ownerUserId: number;
  brandName: string;
  supportHandle: string | null;
  families: string[] | null;
  creatorCode: string | null;
  affiliateTokenEnc: string | null;
}): number {
  const now = new Date().toISOString();
  // A previously removed enrollment of the same bot gives way to the new one
  // (bot_id is UNIQUE).
  db.query("DELETE FROM tenants WHERE bot_id = ?1 AND status = 'deleted'").run(t.botId);
  const res = db
    .query(
      `INSERT INTO tenants (mode, bot_id, bot_username, bot_token_enc, owner_user_id, brand_name,
        support_handle, families, creator_code, affiliate_token_enc, status, created_at, updated_at)
       VALUES (?11, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'active', ?10, ?10)`,
    )
    .run(
      t.botId,
      t.botUsername,
      t.botTokenEnc,
      t.ownerUserId,
      t.brandName,
      t.supportHandle,
      t.families ? JSON.stringify(t.families) : null,
      t.creatorCode,
      t.affiliateTokenEnc,
      now,
      t.mode,
    );
  return Number(res.lastInsertRowid);
}

export function getTenantRow(id: number): TenantRow | null {
  return db.query<TenantRow, [number]>("SELECT * FROM tenants WHERE id = ?1").get(id);
}

export function getTenantByBotId(botId: number): TenantRow | null {
  // Deleted tenants don't count as enrolled — the bot can be re-minted.
  return db
    .query<TenantRow, [number]>(
      "SELECT * FROM tenants WHERE bot_id = ?1 AND status != 'deleted'",
    )
    .get(botId);
}

export function listTenants(opts: { ownerUserId?: number } = {}): TenantRow[] {
  if (opts.ownerUserId !== undefined) {
    return db
      .query<TenantRow, [number]>(
        "SELECT * FROM tenants WHERE owner_user_id = ?1 AND status != 'deleted' ORDER BY id",
      )
      .all(opts.ownerUserId);
  }
  return db
    .query<TenantRow, []>("SELECT * FROM tenants WHERE status != 'deleted' ORDER BY id")
    .all();
}

export function updateTenant(
  id: number,
  patch: Partial<{
    brand_name: string;
    welcome_text: string | null;
    support_handle: string | null;
    families: string | null;
    creator_code: string | null;
    affiliate_token_enc: string | null;
    status: string;
  }>,
) {
  const keys = Object.keys(patch);
  if (keys.length === 0) return;
  const sets = keys.map((k, i) => `${k} = ?${i + 2}`).join(", ");
  db.query(`UPDATE tenants SET ${sets}, updated_at = ?${keys.length + 2} WHERE id = ?1`).run(
    id,
    ...keys.map((k) => (patch as Record<string, unknown>)[k] as never),
    new Date().toISOString(),
  );
}

// ---------- father wizard sessions ----------

/** Wizard sessions can hold in-flight secrets — don't keep them forever. */
export function pruneStaleSessions(maxAgeHours = 24): void {
  const cutoff = new Date(Date.now() - maxAgeHours * 3600_000).toISOString();
  db.query("DELETE FROM father_sessions WHERE updated_at < ?1").run(cutoff);
  db.query("DELETE FROM sessions WHERE updated_at < ?1").run(cutoff);
}

export function getFatherSession<T>(userId: number): T | null {
  const row = db
    .query<{ state: string }, [number]>(
      "SELECT state FROM father_sessions WHERE user_id = ?1",
    )
    .get(userId);
  if (!row) return null;
  try {
    return JSON.parse(row.state) as T;
  } catch {
    return null;
  }
}

export function saveFatherSession(userId: number, state: unknown) {
  db.query(
    `INSERT INTO father_sessions (user_id, state, updated_at) VALUES (?1, ?2, ?3)
     ON CONFLICT(user_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`,
  ).run(userId, JSON.stringify(state), new Date().toISOString());
}
