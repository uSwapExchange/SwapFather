/**
 * Purchase-flow orchestration: everything between "user tapped a button"
 * and "screen rendered". Handlers (handlers.ts) stay thin; this module owns
 * the state machine.
 *
 * Screen graph:
 *   home → browse* → amount → dest? → pay → paynet? → quote → deposit
 */

import type { Translator } from "../i18n/index.ts";
import { uswap, UswapApiError } from "../uswap/client.ts";
import type {
  BridgeOpenResponse,
  LeafItem,
  LevelResponse,
  QuoteResponse,
} from "../uswap/types.ts";
import {
  leafAmountDecimals,
  leafLockedDestination,
  leafNeedsDestination,
  productLabel,
} from "./catalog.ts";
import type { Draft, NavLevel, PageItem, PayAssetChoice, Session } from "./session.ts";
import type { Tenant } from "../tenant.ts";
import { humanToRaw, rawToHuman } from "../lib/format.ts";
import { leafPackKey } from "./emoji.ts";
import { logger } from "../lib/logger.ts";

// ---------- referral attribution ----------

const referralCache = new Map<string, { token: string; expiresAtMs: number }>();

/**
 * Resolve the tenant's creator code to a referral token (cached until just
 * before expiry). Attribution must never block a sale — failures return
 * undefined and the quote proceeds unattributed.
 */
async function referralTokenFor(tenant: Tenant): Promise<string | undefined> {
  const code = tenant.creatorCode;
  if (!code) return undefined;
  const cached = referralCache.get(code);
  if (cached && Date.now() < cached.expiresAtMs - 60_000) return cached.token;
  try {
    const res = await uswap.resolveReferral(code);
    if (res.token && res.expires_at) {
      referralCache.set(code, {
        token: res.token,
        expiresAtMs: new Date(res.expires_at).getTime(),
      });
      return res.token;
    }
  } catch (err) {
    logger.warn("referral resolve failed", { code, err: String(err) });
  }
  return undefined;
}

export type ScreenId =
  | "home"
  | "swcard"
  | "swto"
  | "swtonet"
  | "swaddr"
  | "swmemo"
  | "swamount"
  | "browse"
  | "amount"
  | "dest"
  | "pay"
  | "paynet"
  | "quote"
  | "deposit"
  | "orders"
  | "order"
  | "lang"
  | "help";

export interface FlowSession extends Session {
  screen?: ScreenId;
  /** Cached meta of the current browse level (for pills/pagination). */
  meta?: LevelResponse["meta"];
}

// ---------- browse ----------

/**
 * Keep only the leaf fields the flow consumes — huge levels (2000+ Discord
 * OG usernames) would otherwise bloat the persisted session by megabytes.
 */
function slimLeaf(item: LeafItem): LeafItem {
  const c = item.chain;
  return {
    asset_v1: item.asset_v1,
    symbol: item.symbol,
    name: item.name,
    decimals: item.decimals,
    chain: {
      id: c.id,
      name: c.name,
      subtitle: c.subtitle,
      address_prompt: c.address_prompt,
      destination_required: c.destination_required,
      destination_optional: c.destination_optional,
      destination_address: c.destination_address,
      destination_label: c.destination_label,
      destination_locked: c.destination_locked,
      amount_min_raw: c.amount_min_raw,
      amount_max_raw: c.amount_max_raw,
      amount_decimals: c.amount_decimals,
      amount_options_raw: c.amount_options_raw,
      amount_step_raw: c.amount_step_raw,
      unit_label: c.unit_label,
      unit_price_usd_buy: c.unit_price_usd_buy,
      discount_min_bps: c.discount_min_bps,
      discount_max_bps: c.discount_max_bps,
      out_of_stock: c.out_of_stock,
      availability_reason: c.availability_reason,
      parent_group_name: c.parent_group_name,
      group_name: c.group_name,
    },
  };
}

function toPageItems(res: LevelResponse): PageItem[] {
  return res.items.map((it): PageItem => {
    if (it.kind === "leaf") {
      const c = it.item.chain;
      // Names like "1 Month" are meaningless without their group — borrow it
      // ("Boosts · 1 Month") so buttons never orphan their context.
      const needsContext = /^\d/.test(c.name) && c.parent_group_name;
      const name = needsContext ? `${c.parent_group_name} · ${c.name}` : c.name;
      const label = c.subtitle ? `${name} · ${c.subtitle}` : name;
      return {
        k: "l",
        item: slimLeaf(it.item),
        label,
        icon: leafPackKey(it.item.asset_v1),
        category: it.category,
      };
    }
    const n = it.node;
    // A drill with exactly one leaf child IS that product — treat it as a
    // leaf so a tap goes straight to configuration (no extra fetch), and
    // borrow the child's subtitle (price range / discount) for the label.
    const single =
      n.only_item ?? (n.child_count === 1 ? n.first_item : undefined);
    const subtitle = n.subtitle ?? single?.chain.subtitle;
    const label = subtitle ? `${n.name} · ${subtitle}` : n.name;
    return {
      k: "d",
      segment: n.segment,
      label,
      onlyItem: single ? slimLeaf(single) : undefined,
      oos: n.out_of_stock,
      icon: single ? leafPackKey(single.asset_v1) : undefined,
      category: n.category,
    };
  });
}

/**
 * Fetch a catalog level into the session, auto-descending through
 * single-child levels (e.g. the gift-card country list with one country).
 */
export async function enterLevel(
  s: FlowSession,
  nav: NavLevel,
  cursor: string | null = null,
): Promise<void> {
  let current = nav;
  let curCursor = cursor;
  for (let depth = 0; depth < 4; depth++) {
    const res = await uswap.level({
      path: { asset: current.asset, segments: current.segments },
      side: "to",
      query: current.query || undefined,
      category: current.category || undefined,
      cursor: curCursor ?? undefined,
    });
    const page = toPageItems(res);

    // Auto-skip levels that contain exactly one drill (per meta hint).
    const first = page[0];
    if (
      res.meta.auto_skip_single &&
      page.length === 1 &&
      first &&
      first.k === "d" &&
      !current.query
    ) {
      current = {
        asset: current.asset,
        segments: [...current.segments, first.segment],
        cursorStack: [],
        nextCursor: null,
      };
      curCursor = null;
      continue;
    }

    current.title = res.meta.title;
    if (!current.cursorStack?.length) current.cursorStack = [curCursor];
    current.nextCursor = res.cursor;
    current.offset ??= 0;
    current.pageNo ??= 1;
    current.categoryIds = res.meta.categories?.map((c) => c.id);
    s.meta = res.meta;
    s.page = page;
    // Replace/append nav level
    const topIdx = s.nav.findIndex(
      (l) => l.asset === current.asset && sameSegments(l.segments, current.segments),
    );
    if (topIdx === -1) s.nav.push(current);
    else s.nav[topIdx] = current;
    // Drop anything deeper than this level
    s.nav = s.nav.slice(0, s.nav.indexOf(current) + 1);
    s.screen = "browse";
    return;
  }
  throw new Error("catalog auto-descend loop exceeded depth 4");
}

/** How many item buttons fit on one browse screen. */
export const PAGE_SIZE = 24;

function sameSegments(a: { id: string }[], b: { id: string }[]): boolean {
  return a.length === b.length && a.every((s, i) => s.id === b[i]!.id);
}

export function currentNav(s: FlowSession): NavLevel | undefined {
  return s.nav[s.nav.length - 1];
}

/** Fetch the current nav level again (page 1) — used after filter changes. */
export async function refreshLevel(s: FlowSession): Promise<void> {
  const nav = currentNav(s);
  if (!nav) return;
  nav.cursorStack = [null];
  nav.offset = 0;
  nav.pageNo = 1;
  await enterLevel(s, nav, null);
}

/**
 * Pagination is two-layered: big server pages are sliced into PAGE_SIZE
 * screens locally; when the local slice runs out we follow the server cursor.
 */
export async function pageNext(s: FlowSession): Promise<void> {
  const nav = currentNav(s);
  if (!nav || !s.page) return;
  const offset = nav.offset ?? 0;
  if (offset + PAGE_SIZE < s.page.length) {
    nav.offset = offset + PAGE_SIZE;
    nav.pageNo = (nav.pageNo ?? 1) + 1;
    return;
  }
  if (!nav.nextCursor) return;
  const cursor = nav.nextCursor;
  await enterLevel(s, nav, cursor);
  nav.cursorStack.push(cursor);
  nav.offset = 0;
  nav.pageNo = (nav.pageNo ?? 1) + 1;
}

export async function pagePrev(s: FlowSession): Promise<void> {
  const nav = currentNav(s);
  if (!nav || !s.page) return;
  const offset = nav.offset ?? 0;
  if (offset > 0) {
    nav.offset = Math.max(0, offset - PAGE_SIZE);
    nav.pageNo = Math.max(1, (nav.pageNo ?? 2) - 1);
    return;
  }
  if (nav.cursorStack.length <= 1) return;
  nav.cursorStack.pop();
  const cursor = nav.cursorStack[nav.cursorStack.length - 1] ?? null;
  const keptStack = [...nav.cursorStack];
  await enterLevel(s, nav, cursor);
  nav.cursorStack = keptStack;
  // Land on the LAST local slice of the previous server page.
  const slices = Math.max(1, Math.ceil(s.page.length / PAGE_SIZE));
  nav.offset = (slices - 1) * PAGE_SIZE;
  nav.pageNo = Math.max(1, (nav.pageNo ?? 2) - 1);
}

// ---------- configure ----------

/** Begin a purchase draft from a selected leaf. Returns the next screen. */
export function startDraft(s: FlowSession, leaf: LeafItem): ScreenId {
  s.draft = { leaf, productLabel: productLabel(leaf) };
  const c = leaf.chain;
  const min = c.amount_min_raw ?? "1";
  const max = c.amount_max_raw ?? min;
  if (min === max) {
    // Single fixed quantity (rented numbers, OG accounts) — skip amount step.
    s.draft.amountHuman = rawToHuman(min, leafAmountDecimals(leaf));
    return afterAmount(s);
  }
  s.screen = "amount";
  return s.screen;
}

export function setAmount(s: FlowSession, human: string): ScreenId {
  const draft = s.draft!;
  draft.amountHuman = human;
  return afterAmount(s);
}

export function afterAmount(s: FlowSession): ScreenId {
  const draft = s.draft!;
  const locked = leafLockedDestination(draft.leaf);
  if (locked) {
    draft.destination = locked;
    s.screen = "pay";
  } else if (leafNeedsDestination(draft.leaf)) {
    s.screen = "dest";
  } else {
    s.screen = "pay";
  }
  return s.screen;
}

/**
 * Normalize a typed amount. "100,000" is a thousands separator, "7,50" is a
 * European decimal comma; fractional input on count products (stars, months)
 * is ambiguous and rejected outright.
 */
export function normalizeAmountInput(input: string, decimals: number): string {
  let v = input.replace(/[$\s]/g, "");
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(v)) v = v.replaceAll(",", "");
  else v = v.replace(",", ".");
  if (decimals === 0 && v.includes(".") && !/\.0*$/.test(v.slice(v.indexOf(".")))) {
    throw new Error(`fractional amount on integer product: ${input}`);
  }
  if (decimals === 0) v = v.split(".")[0]!;
  return v;
}

/**
 * Validate a typed amount against the leaf's bounds.
 * Returns the canonical human string, or null if invalid.
 */
export function parseAmount(s: FlowSession, input: string): string | null {
  const draft = s.draft!;
  const c = draft.leaf.chain;
  const decimals = leafAmountDecimals(draft.leaf);
  let raw: bigint;
  try {
    raw = BigInt(humanToRaw(normalizeAmountInput(input, decimals), decimals));
  } catch {
    return null;
  }
  const min = BigInt(c.amount_min_raw ?? "1");
  const max = BigInt(c.amount_max_raw ?? raw.toString());
  if (raw < min || raw > max) return null;
  if (c.amount_step_raw && raw % BigInt(c.amount_step_raw) !== 0n) return null;
  if (c.amount_options_raw?.length && !c.amount_options_raw.includes(raw.toString())) {
    return null;
  }
  return rawToHuman(raw.toString(), decimals);
}

/** Normalize a destination input (e.g. strip @ from usernames). */
export function normalizeDestination(s: FlowSession, input: string): string {
  const prompt = s.draft?.leaf.chain.address_prompt ?? "";
  let value = input.trim();
  if (/username/i.test(prompt)) value = value.replace(/^@/, "");
  return value;
}

// ---------- swap flow ----------

/** Chains whose deposits/deliveries can require a memo or tag. */
export const MEMO_CHAINS = new Set(["xrp", "stellar", "ton", "eos"]);

async function loadCryptoChoices(counterpart?: string): Promise<PayAssetChoice[]> {
  const res = await uswap.assets({
    side: "to",
    ...(counterpart ? { counterpart_asset_v1: counterpart } : {}),
  });
  // The destination-side list expands one row PER NETWORK (ETH ×7, USDC ×16),
  // each row already carrying the full networks[] — aggregate to one choice
  // per SYMBOL (wrapped variants of a coin merge too; the network picker
  // disambiguates) or the picker shows a wall of duplicates.
  const byAsset = new Map<string, PayAssetChoice>();
  for (const a of res.items) {
    if (a.category !== "Crypto") continue;
    const key = a.symbol.toUpperCase();
    let choice = byAsset.get(key);
    if (!choice) {
      choice = { assetId: a.asset_id, symbol: a.symbol, name: a.name, networks: [] };
      byAsset.set(key, choice);
    }
    for (const n of a.networks) {
      if (!choice.networks.some((x) => x.asset_v1 === n.asset_v1)) {
        choice.networks.push({
          asset_v1: n.asset_v1,
          chain_id: n.chain_id,
          chain_name: n.chain_name,
          decimals: n.decimals,
        });
      }
    }
  }
  return [...byAsset.values()];
}

/**
 * Open the swap config card (uSwapZero-style hub): both sides pre-set to a
 * sensible default pair (BTC → XMR), amount/address filled in any order.
 */
export async function startSwap(s: FlowSession): Promise<void> {
  s.draft = undefined;
  s.swapChoices = await loadCryptoChoices();
  s.swapMore = false;
  const receive = s.swapChoices.find((c) => c.symbol === "XMR") ?? s.swapChoices[0];
  if (receive) selectSwapToNetwork(s, receive, 0);
  if (s.draft) {
    const d: Draft = s.draft;
    await loadPayChoices(s);
    const send =
      s.payChoices?.find((c) => c.symbol === "BTC" && c.networks.some((n) => n.chain_id === "bitcoin")) ??
      s.payChoices?.[0];
    if (send) {
      const netIdx = Math.max(0, send.networks.findIndex((n) => n.chain_id === "bitcoin"));
      const net = send.networks[netIdx];
      if (net) {
        d.payAssetV1 = net.asset_v1;
        d.paySymbol = send.symbol;
        d.payChainId = net.chain_id;
        d.payChainName = net.chain_name;
        d.payDecimals = net.decimals;
      }
    }
  }
  s.screen = "swcard";
}

/** Both inputs the quote needs are present. */
export function swapReady(s: FlowSession): boolean {
  const d = s.draft;
  return Boolean(d?.swap && d.payAssetV1 && d.leaf && d.amountHuman && d.destination);
}

/**
 * Flip send ↔ receive. The typed amount survives only when it was entered in
 * USD; the receive address never survives (it belongs to the old coin).
 */
export async function flipSwap(s: FlowSession): Promise<void> {
  const d = s.draft;
  if (!d?.swap || !d.payAssetV1 || !d.payChainId) return;
  const oldLeaf = d.leaf;
  d.leaf = {
    asset_v1: d.payAssetV1,
    symbol: d.paySymbol ?? "",
    name: d.paySymbol ?? "",
    decimals: d.payDecimals ?? 0,
    chain: {
      id: d.payChainId,
      name: d.payChainName ?? d.payChainId,
      unit_label: d.paySymbol,
      address_type: "crypto",
      destination_required: true,
    },
  };
  d.productLabel = `${d.leaf.symbol} (${d.leaf.chain.name})`;
  d.payAssetV1 = oldLeaf.asset_v1;
  d.paySymbol = oldLeaf.symbol;
  d.payChainId = oldLeaf.chain.id;
  d.payChainName = oldLeaf.chain.name;
  d.payDecimals = oldLeaf.decimals;
  if (d.inputType !== "usd") d.amountHuman = undefined;
  d.destination = undefined;
  d.destinationMemo = undefined;
  d.payMinHuman = undefined;
  d.payMinUsd = undefined;
  d.quote = undefined;
  s.screen = "swcard";
}

export function pickSwapTo(s: FlowSession, idx: number): ScreenId {
  const choice = s.swapChoices?.[idx];
  if (!choice) return s.screen ?? "swto";
  if (choice.networks.length > 1) {
    s.swapNetChoice = choice;
    s.screen = "swtonet";
    return s.screen;
  }
  return selectSwapToNetwork(s, choice, 0);
}

export function selectSwapToNetwork(
  s: FlowSession,
  choice: PayAssetChoice,
  netIdx: number,
): ScreenId {
  const net = choice.networks[netIdx];
  if (!net) return s.screen ?? "swto";
  // A swap destination is a synthesized "leaf": the receive asset itself.
  const prev = s.draft;
  s.draft = {
    swap: true,
    leaf: {
      asset_v1: net.asset_v1,
      symbol: choice.symbol,
      name: choice.name,
      decimals: net.decimals,
      chain: {
        id: net.chain_id,
        name: net.chain_name,
        unit_label: choice.symbol,
        address_type: "crypto",
        destination_required: true,
      },
    },
    productLabel: `${choice.symbol} (${net.chain_name})`,
    inputSide: "from",
    // keep the send side + amount when re-picking the receive coin
    ...(prev?.swap
      ? {
          payAssetV1: prev.payAssetV1,
          paySymbol: prev.paySymbol,
          payChainId: prev.payChainId,
          payChainName: prev.payChainName,
          payDecimals: prev.payDecimals,
          payMinHuman: prev.payMinHuman,
          payMinUsd: prev.payMinUsd,
          amountHuman: prev.amountHuman,
          inputType: prev.inputType,
        }
      : {}),
  };
  // the old address belonged to the old receive coin
  s.screen = "swcard";
  return s.screen;
}

export function swapNeedsMemo(s: FlowSession): boolean {
  return MEMO_CHAINS.has(s.draft?.leaf.chain.id ?? "");
}

/**
 * Parse a swap amount: "$100" = USD notional, "0.1" = source-coin units.
 * Returns null on garbage.
 */
export function parseSwapAmount(
  input: string,
): { amount: string; inputType: "human" | "usd" } | null {
  const trimmed = input.trim();
  const usd = trimmed.startsWith("$");
  const body = (usd ? trimmed.slice(1) : trimmed).replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(body) || Number(body) <= 0) return null;
  return { amount: body, inputType: usd ? "usd" : "human" };
}

/**
 * Best-effort minimum-deposit lookup for the chosen pay asset — shown on the
 * swap amount screen so users don't discover the floor via a failed quote.
 */
export async function loadPayMinDeposit(s: FlowSession): Promise<void> {
  const draft = s.draft;
  if (!draft?.payChainId || !draft.payAssetV1 || draft.payMinHuman) return;
  try {
    const res = await uswap.networkAssets(draft.payChainId);
    const match = res.items.find((i) => i.asset_v1 === draft.payAssetV1);
    if (match?.min_deposit) {
      draft.payMinHuman = match.min_deposit.human;
      draft.payMinUsd = match.min_deposit.usd;
    }
  } catch (err) {
    logger.debug("min deposit lookup failed", { err: String(err) });
  }
}

// ---------- payment picker ----------

export async function loadPayChoices(s: FlowSession): Promise<void> {
  const draft = s.draft!;
  const res = await uswap.assets({
    side: "from",
    counterpart_asset_v1: draft.leaf.asset_v1,
  });
  s.payChoices = res.items
    .filter((a) => a.category === "Crypto")
    .map((a) => ({
      assetId: a.asset_id,
      symbol: a.symbol,
      name: a.name,
      networks: a.networks.map((n) => ({
        asset_v1: n.asset_v1,
        chain_id: n.chain_id,
        chain_name: n.chain_name,
        decimals: n.decimals,
      })),
    }));
  s.payMore = false;
  s.screen = "pay";
}

export function pickPayAsset(s: FlowSession, idx: number): ScreenId {
  const choice = s.payChoices?.[idx];
  if (!choice) return s.screen ?? "pay";
  if (choice.networks.length > 1) {
    s.payNetChoice = choice;
    s.screen = "paynet";
    return s.screen;
  }
  return selectPayNetwork(s, choice, 0);
}

export function selectPayNetwork(
  s: FlowSession,
  choice: PayAssetChoice,
  netIdx: number,
): ScreenId {
  const net = choice.networks[netIdx];
  if (!net) return s.screen ?? "pay";
  const draft = s.draft!;
  draft.payAssetV1 = net.asset_v1;
  draft.paySymbol = choice.symbol;
  draft.payChainId = net.chain_id;
  draft.payChainName = net.chain_name;
  draft.payDecimals = net.decimals;
  if (draft.swap) {
    // back to the config card; a coin-denominated amount belonged to the old coin
    if (draft.inputType !== "usd") draft.amountHuman = undefined;
    draft.payMinHuman = undefined;
    draft.payMinUsd = undefined;
    s.screen = "swcard";
    return s.screen;
  }
  s.screen = "quote";
  return s.screen;
}

// ---------- quote & commit ----------

export async function fetchQuote(s: FlowSession, tenant: Tenant): Promise<QuoteResponse> {
  const draft = s.draft!;
  const referralToken = await referralTokenFor(tenant);
  const q = await uswap.quote({
    source_asset_v1: draft.payAssetV1!,
    destination_asset_v1: draft.leaf.asset_v1,
    ...(draft.destination ? { destination_address: draft.destination } : {}),
    ...(draft.destinationMemo ? { destination_memo: draft.destinationMemo } : {}),
    ...(referralToken ? { referral_token: referralToken } : {}),
    amount: draft.amountHuman!,
    input_side: draft.inputSide ?? "to",
    input_type: draft.inputType ?? "human",
  });
  draft.quote = {
    draft_id: q.draft_id,
    plan_id: q.plan_id,
    leg_plan_ids: q.legs.map((l) => l.leg_plan_id),
    expires_at: q.expires_at,
    request_hash: q.request_hash,
    source_amount_raw: q.source_amount_raw,
    source_amount_usd: q.source_amount_usd,
    destination_amount_raw: q.destination_amount_raw,
    destination_amount_usd: q.destination_amount_usd,
    creator_fee: q.creator_fee
      ? {
          amount_usd: q.creator_fee.amount_usd,
          fee_bps: q.creator_fee.fee_bps,
          fee_category: q.creator_fee.fee_category,
        }
      : null,
  };
  s.screen = "quote";
  return q;
}

export interface CommitResult {
  bridgeId: string;
  intentId: string;
  status: string;
  depositAddress: string;
  depositMemo: string | null;
  depositAmountHuman: string;
  expiresAt: string | null;
}

/**
 * Thrown when the draft expired at commit time and the fresh re-quote costs
 * more than the price the user approved — the UI must re-confirm, never
 * silently charge more.
 */
export class RepriceRequiredError extends Error {
  constructor() {
    super("price moved above the approved amount; re-confirmation required");
    this.name = "RepriceRequiredError";
  }
}

/**
 * Commit the quoted plan: POST /v1/bridges/open. If the draft expired between
 * quoting and confirming, re-quotes once and retries — but only while the new
 * price stays within the ceiling derived from what the user confirmed.
 */
export async function commit(
  s: FlowSession,
  tenant: Tenant,
  externalId: string,
): Promise<CommitResult> {
  const draft = s.draft!;
  const referralToken = await referralTokenFor(tenant);
  // The ceiling binds to the price the user APPROVED — never to a re-quote.
  const approvedCeilingRaw = (
    (BigInt(draft.quote!.source_amount_raw) * 102n) / 100n
  ).toString();
  let attempt = 0;
  for (;;) {
    attempt++;
    const q = draft.quote!;
    try {
      const res = await uswap.openBridge(
        {
          source_asset_v1: draft.payAssetV1!,
          destination_asset_v1: draft.leaf.asset_v1,
          ...(draft.destination ? { destination_address: draft.destination } : {}),
          ...(draft.destinationMemo ? { destination_memo: draft.destinationMemo } : {}),
          ...(referralToken ? { referral_token: referralToken } : {}),
          amount: draft.amountHuman!,
          input_side: draft.inputSide ?? "to",
          input_type: draft.inputType ?? "human",
          draft_id: q.draft_id,
          plan_id: q.plan_id,
          leg_plan_ids: q.leg_plan_ids,
          expires_at: q.expires_at,
          request_hash: q.request_hash,
          source_amount_ceiling_raw: approvedCeilingRaw,
          external_id: externalId,
          metadata: { source: "best-b4u" },
        },
        // Key includes the draft so a retry with a fresh draft (different
        // body) doesn't collide with the first attempt's idempotency record.
        `${externalId}-${q.draft_id}`,
      );
      return toCommitResult(res, draft.payChainId!, draft.payDecimals ?? 0);
    } catch (err) {
      const retryable =
        err instanceof UswapApiError &&
        ["quote_not_found", "quote_expired", "stale_plan"].includes(err.code);
      if (retryable && attempt === 1) {
        logger.info("quote expired at commit; re-quoting", { externalId });
        await fetchQuote(s, tenant);
        if (BigInt(draft.quote!.source_amount_raw) > BigInt(approvedCeilingRaw)) {
          throw new RepriceRequiredError();
        }
        continue;
      }
      throw err;
    }
  }
}

function toCommitResult(
  res: BridgeOpenResponse,
  payChainId: string,
  payDecimals: number,
): CommitResult {
  const endpoints = res.bridge.ingress_endpoints ?? [];
  // NEVER fall back to another chain's endpoint — showing a wrong-network
  // deposit address is how funds get lost.
  const ep = endpoints.find(
    (e) =>
      (e as { network_id?: string; chain?: string }).network_id === payChainId ||
      (e as { network_id?: string; chain?: string }).chain === payChainId,
  );
  if (!ep) {
    throw new Error(`no ingress endpoint for source chain ${payChainId}`);
  }
  const intent = res.intent as { source_amount_raw?: string } & typeof res.intent;
  // Prefer the committed intent's (re-quoted) source amount.
  const sourceRaw = intent.source_amount_raw;
  return {
    bridgeId: res.bridge.id,
    intentId: res.intent.id,
    status: res.intent.status,
    depositAddress: ep.address,
    depositMemo: ep.memo ?? null,
    depositAmountHuman: sourceRaw ? rawToHuman(sourceRaw, payDecimals) : "",
    expiresAt: res.intent.expires_at,
  };
}
