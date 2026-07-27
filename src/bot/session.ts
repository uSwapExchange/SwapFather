/**
 * Per-user purchase-flow session state, persisted as JSON in SQLite.
 *
 * The UI is a single anchored message edited in place; callback data stays
 * tiny (Telegram caps it at 64 bytes) by referencing indexes into the page
 * cached here.
 */

import type { LeafItem, LevelSegment } from "../uswap/types.ts";
import { getSession, saveSession, clearSession } from "../lib/store.ts";

export interface NavLevel {
  asset: string | null;
  segments: LevelSegment[];
  title?: string;
  /** Cursor used to fetch the current page (null = first page). */
  cursorStack: (string | null)[];
  nextCursor: string | null;
  /** Client-side slice offset into the fetched page (levels can be huge). */
  offset?: number;
  /** 1-based display page number across server pages + local slices. */
  pageNo?: number;
  category?: string;
  categoryIds?: string[];
  query?: string;
}

export type PageItem =
  | { k: "l"; item: LeafItem; label: string }
  | {
      k: "d";
      segment: LevelSegment;
      label: string;
      onlyItem?: LeafItem;
      oos?: boolean;
    };

export interface PayAssetChoice {
  assetId: string;
  symbol: string;
  name: string;
  networks: {
    asset_v1: string;
    chain_id: string;
    chain_name: string;
    decimals: number;
  }[];
}

export interface QuoteTuple {
  draft_id: string;
  plan_id: string;
  leg_plan_ids: string[];
  expires_at: string;
  request_hash: string;
  source_amount_raw: string;
  source_amount_usd?: number;
  destination_amount_raw: string;
  destination_amount_usd?: number;
}

export interface Draft {
  leaf: LeafItem;
  /** Human-readable product label, e.g. "Adidas Gift Card" */
  productLabel: string;
  /** Destination-side amount in human units (e.g. "50" stars, "25" USD). */
  amountHuman?: string;
  destination?: string;
  /** Chosen payment rail. */
  payAssetV1?: string;
  paySymbol?: string;
  payChainId?: string;
  payChainName?: string;
  payDecimals?: number;
  quote?: QuoteTuple;
}

export interface Session {
  /** The anchored UI message this session is driving. */
  messageId?: number;
  chatId?: number;
  nav: NavLevel[];
  page?: PageItem[];
  draft?: Draft;
  /** What free-text input we're waiting for, if any. */
  awaiting?: "amount" | "dest" | "search" | null;
  /** Payment picker state. */
  payChoices?: PayAssetChoice[];
  payMore?: boolean;
  payNetChoice?: PayAssetChoice;
}

export function loadSession(userId: number): Session {
  return getSession<Session>(userId) ?? { nav: [] };
}

export function persistSession(userId: number, s: Session) {
  saveSession(userId, s);
}

export function resetSession(userId: number): Session {
  clearSession(userId);
  return { nav: [] };
}
