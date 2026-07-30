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
  /** User chose "All" on an aisle screen (bypasses the category chooser). */
  showAll?: boolean;
  query?: string;
}

export type PageItem =
  | { k: "l"; item: LeafItem; label: string; icon?: string; category?: string }
  | {
      k: "d";
      segment: LevelSegment;
      label: string;
      onlyItem?: LeafItem;
      oos?: boolean;
      icon?: string;
      category?: string;
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
  creator_fee?: {
    amount_usd: string;
    fee_bps: number;
    fee_category?: string | null;
  } | null;
}

export interface Draft {
  leaf: LeafItem;
  /** Human-readable product label, e.g. "Adidas Gift Card" */
  productLabel: string;
  /** True for crypto→crypto swaps (leaf is a synthesized crypto asset). */
  swap?: boolean;
  /** Amount in human units. Products: destination-side. Swaps: source-side. */
  amountHuman?: string;
  /** Swap amount semantics: which side + units the user typed. */
  inputSide?: "from" | "to";
  inputType?: "human" | "usd";
  destination?: string;
  destinationMemo?: string;
  /** Chosen payment rail. */
  payAssetV1?: string;
  paySymbol?: string;
  payChainId?: string;
  payChainName?: string;
  payDecimals?: number;
  /** Min deposit for the chosen pay asset (from the network catalog). */
  payMinHuman?: string;
  payMinUsd?: string;
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
  awaiting?:
    | "amount"
    | "dest"
    | "search"
    | "swaddr"
    | "swmemo"
    | "swamount"
    | "refund"
    | null;
  /** Order the pending refund-address input applies to. */
  refundOrderId?: number;
  /** Payment picker state. */
  payChoices?: PayAssetChoice[];
  payMore?: boolean;
  payNetChoice?: PayAssetChoice;
  /** Swap receive-side picker state. */
  swapChoices?: PayAssetChoice[];
  swapMore?: boolean;
  swapNetChoice?: PayAssetChoice;
}

export function loadSession(tenantId: number, userId: number): Session {
  return getSession<Session>(tenantId, userId) ?? { nav: [] };
}

export function persistSession(tenantId: number, userId: number, s: Session) {
  saveSession(tenantId, userId, s);
}

export function resetSession(tenantId: number, userId: number): Session {
  clearSession(tenantId, userId);
  return { nav: [] };
}
