/**
 * SQLite persistence (bun:sqlite).
 *
 * Three tables:
 *  - users:   per-user preferences (language override) + last seen
 *  - sessions: per-user transient purchase flow state (JSON blob)
 *  - orders:  committed purchases → bridge/intent ids for status polling
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
  user_id INTEGER PRIMARY KEY,
  language TEXT,
  tg_language_code TEXT,
  username TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  user_id INTEGER PRIMARY KEY,
  state TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  qr_message_id INTEGER,
  delivered_notified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_active ON orders (status) WHERE status NOT IN ('completed','failed','refunded','cancelled','expired');
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id, id DESC);
`);

export interface UserRow {
  user_id: number;
  language: string | null;
  tg_language_code: string | null;
  username: string | null;
}

export function upsertUser(u: {
  userId: number;
  tgLanguageCode?: string;
  username?: string;
}): UserRow {
  const now = new Date().toISOString();
  db.query(
    `INSERT INTO users (user_id, tg_language_code, username, first_seen_at, last_seen_at)
     VALUES (?1, ?2, ?3, ?4, ?4)
     ON CONFLICT(user_id) DO UPDATE SET
       tg_language_code = excluded.tg_language_code,
       username = excluded.username,
       last_seen_at = excluded.last_seen_at`,
  ).run(u.userId, u.tgLanguageCode ?? null, u.username ?? null, now);
  return db
    .query<UserRow, [number]>(
      "SELECT user_id, language, tg_language_code, username FROM users WHERE user_id = ?1",
    )
    .get(u.userId)!;
}

export function setUserLanguage(userId: number, language: string) {
  db.query("UPDATE users SET language = ?2 WHERE user_id = ?1").run(userId, language);
}

export function getSession<T>(userId: number): T | null {
  const row = db
    .query<{ state: string }, [number]>("SELECT state FROM sessions WHERE user_id = ?1")
    .get(userId);
  if (!row) return null;
  try {
    return JSON.parse(row.state) as T;
  } catch {
    return null;
  }
}

export function saveSession(userId: number, state: unknown) {
  db.query(
    `INSERT INTO sessions (user_id, state, updated_at) VALUES (?1, ?2, ?3)
     ON CONFLICT(user_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`,
  ).run(userId, JSON.stringify(state), new Date().toISOString());
}

export function clearSession(userId: number) {
  db.query("DELETE FROM sessions WHERE user_id = ?1").run(userId);
}

export interface OrderRow {
  id: number;
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
}): number {
  const now = new Date().toISOString();
  const res = db
    .query(
      `INSERT INTO orders (user_id, chat_id, bridge_id, intent_id, status, product_label, pay_label,
        deposit_address, deposit_memo, deposit_amount, deposit_asset, expires_at, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?13)`,
    )
    .run(
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
    );
  return Number(res.lastInsertRowid);
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

export function listUserOrders(userId: number, limit = 10): OrderRow[] {
  return db
    .query<OrderRow, [number, number]>(
      "SELECT * FROM orders WHERE user_id = ?1 ORDER BY id DESC LIMIT ?2",
    )
    .all(userId, limit);
}
