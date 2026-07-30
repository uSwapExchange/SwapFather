/**
 * Screen renderers — pure functions from state to { text, keyboard }.
 * Every screen is HTML parse mode and is designed to be edited in place
 * on a single anchored message.
 */

import type { Translator } from "../i18n/index.ts";
import type { LevelMeta } from "../uswap/types.ts";
import type { Draft, NavLevel, PageItem, PayAssetChoice, Session } from "./session.ts";
import type { OrderRow } from "../lib/store.ts";
import type { DeliveryItem } from "../uswap/types.ts";
import { esc, niceCrypto, presetAmounts, rawToHuman, usd } from "../lib/format.ts";
import {
  assetEmojiChar,
  assetEmojiHtml,
  assetIconId,
  categoryEmojiChar,
  leafEmoji,
  networkIconId,
  packEmojiId,
  productEmoji,
  productEmojiChar,
  productIconId,
  UI,
} from "./emoji.ts";
import { leafAmountDecimals, productLabel } from "./catalog.ts";
import { btn, copyBtn, grid, type Btn, type Keyboard } from "./keyboard.ts";
import type { Family } from "./catalog.ts";

export interface Screen {
  text: string;
  keyboard: Keyboard;
}

/**
 * Live-relative timestamp (Bot API 10.x date_time entity). The tag content is
 * a plain fallback for clients that don't render date_time.
 */
function tgTime(iso: string): string {
  const unix = Math.floor(new Date(iso).getTime() / 1000);
  const fallback = new Date(iso).toISOString().slice(11, 16) + " UTC";
  return `<tg-time unix="${unix}" format="r">${fallback}</tg-time>`;
}

function navRow(t: Translator, opts: { back?: boolean; home?: boolean } = {}): Btn[] {
  const row: Btn[] = [];
  if (opts.back !== false) row.push(btn(t("btn.back"), "bk"));
  if (opts.home !== false) row.push(btn(t("btn.home"), "h"));
  return row;
}

// ---------- home ----------

export function renderHome(
  t: Translator,
  families: Family[],
  brand: string,
  withSwap = false,
  welcomeText?: string | null,
): Screen {
  const text = [
    t("home.title", { brand: esc(brand) }),
    "",
    welcomeText ? esc(welcomeText) : t("home.body"),
  ].join("\n");
  const familyBtns = families.map((f) => {
    const icon = productIconId(f.id);
    // With a brand icon the unicode glyph would double up — icon carries it.
    const label = icon ? f.name : `${productEmojiChar(f.id)} ${f.name}`;
    return btn(label, `c:${f.id}`, undefined, icon);
  });
  const keyboard: Keyboard = [
    ...(familyBtns.length ? [[familyBtns[0]!]] : []),
    ...grid(familyBtns.slice(1), 2),
    ...(withSwap ? [[btn(t("btn.swap"), "sw")]] : []),
    [btn(t("btn.orders"), "or"), btn(t("btn.language"), "lg")],
    [btn(t("btn.help"), "hp")],
  ];
  return { text, keyboard };
}

// ---------- browse (generic catalog level) ----------

const PAGE_SIZE = 24;

export interface BrowseContext {
  familyName?: string;
  familyEmojiHtml?: string;
  hideNav?: boolean;
}

/** Big sectioned levels open as a category chooser instead of a button wall. */
export function browseUsesAisles(meta: LevelMeta, page: PageItem[]): boolean {
  return (meta.categories?.length ?? 0) >= 2 && (Boolean(meta.pills) || page.length > 12);
}

function breadcrumb(ctx: BrowseContext, tail?: string): string {
  const parts: string[] = [];
  if (ctx.familyName) {
    parts.push(`${ctx.familyEmojiHtml ? ctx.familyEmojiHtml + " " : ""}<b>${esc(ctx.familyName)}</b>`);
  }
  if (tail && tail !== ctx.familyName) parts.push(`<b>${esc(tail)}</b>`);
  return parts.join(" › ");
}

export function renderBrowse(
  t: Translator,
  meta: LevelMeta,
  nav: NavLevel,
  page: PageItem[],
  ctx: BrowseContext = {},
): Screen {
  const aisleMode =
    browseUsesAisles(meta, page) && !nav.category && !nav.showAll && !nav.query;

  // ----- aisle screen: the level's categories as the whole keyboard -----
  if (aisleMode) {
    const cats = meta.categories ?? [];
    const total =
      cats.reduce((n, c) => n + (c.count ?? 0), 0) || page.length;
    // No title tail here — "🎁 Gift Cards › Select Brand" reads clunky when
    // the screen itself is the category chooser.
    const lines = [
      breadcrumb(ctx) || `<b>${esc(nav.title ?? meta.title ?? "")}</b>`,
      "",
      t("browse.aisleHint", { count: total }),
    ];
    const catBtns = cats.map((c, i) => {
      const glyph = categoryEmojiChar(c.name);
      const label = `${glyph ? glyph + " " : ""}${c.name}${c.count ? ` (${c.count})` : ""}`;
      return btn(label, `ct:${i}`);
    });
    const keyboard: Keyboard = [
      ...grid(catBtns, 2),
      [btn(t("btn.allItems", { count: total }), "ct:all")],
    ];
    if (meta.search === "server") keyboard.push([btn(t("btn.search"), "sr")]);
    if (!ctx.hideNav) keyboard.push(navRow(t));
    return { text: lines.join("\n"), keyboard };
  }

  // ----- items screen -----
  const lines: string[] = [];
  const tail = nav.category ?? nav.title ?? meta.title ?? "";
  lines.push(breadcrumb(ctx, tail) || `<b>${esc(tail)}</b>`);
  if (nav.query) lines.push(t("browse.results", { query: esc(nav.query) }));
  if (page.length === 0) {
    lines.push("", t("browse.noResults", { query: esc(nav.query ?? "") }));
  }

  const keyboard: Keyboard = [];
  const offset = nav.offset ?? 0;
  const shown = page.slice(offset, offset + PAGE_SIZE);
  // Brand icons on items only when they DIFFER within the page — a column of
  // 24 identical gift-card glyphs is noise, but Stars/Premium/Boosts side by
  // side deserve their own marks.
  const distinctIcons = new Set(shown.map((it) => it.icon).filter(Boolean));
  const useIcons = distinctIcons.size >= 2;
  const itemBtns = shown.map((it, i) => {
    const oos = it.k === "d" ? it.oos : it.item.chain.out_of_stock;
    const label = oos ? `🔴 ${it.label} — ${t("browse.soldout")}` : it.label;
    const iconId = useIcons && it.icon ? packEmojiId(it.icon) : undefined;
    // Callback carries the ABSOLUTE index into the fetched page.
    return btn(label, `i:${offset + i}`, undefined, iconId);
  });
  // One per row keeps long labels (brand · $range) readable.
  keyboard.push(...grid(itemBtns, itemBtns.length > 12 ? 2 : 1));

  // Pagination (local slices + server cursor, see flow.pageNext).
  // When the whole level fits one server page the total is known: "2/4".
  const hasPrev = offset > 0 || nav.cursorStack.length > 1;
  const hasNext = offset + PAGE_SIZE < page.length || Boolean(nav.nextCursor);
  if (hasPrev || hasNext) {
    const totalKnown = nav.cursorStack.length <= 1 && !nav.nextCursor;
    const pageLabel = totalKnown
      ? `${nav.pageNo ?? 1}/${Math.max(1, Math.ceil(page.length / PAGE_SIZE))}`
      : t("browse.page", { page: nav.pageNo ?? 1 });
    const row: Btn[] = [];
    if (hasPrev) row.push(btn(t("btn.prev"), "pg:p"));
    row.push(btn(pageLabel, "noop"));
    if (hasNext) row.push(btn(t("btn.next"), "pg:n"));
    keyboard.push(row);
  }

  // Search lives on the aisle screen for aisle levels; inside a category the
  // list is already short. Keep it for flat levels and the "All" view.
  const showSearch =
    meta.search === "server" && (!browseUsesAisles(meta, page) || nav.showAll || nav.query);
  if (showSearch || nav.query) {
    const row: Btn[] = [];
    if (showSearch) row.push(btn(t("btn.search"), "sr"));
    if (nav.query) row.push(btn(t("btn.clearSearch"), "srx", "danger"));
    if (row.length) keyboard.push(row);
  }
  if (!ctx.hideNav) keyboard.push(navRow(t));
  return { text: lines.join("\n"), keyboard };
}

// ---------- amount ----------

export function renderAmount(
  t: Translator,
  draft: Draft,
  opts: { hideNav?: boolean } = {},
): Screen {
  const leaf = draft.leaf;
  const c = leaf.chain;
  const decimals = leafAmountDecimals(leaf);
  const unit = c.unit_label ?? "";
  const min = rawToHuman(c.amount_min_raw ?? "1", decimals);
  const max = rawToHuman(c.amount_max_raw ?? "1", decimals);
  const isUsd = unit === "USD";

  const lines: string[] = [
    `${leafEmoji(draft.leaf.asset_v1)} ${t("amount.title", { product: esc(draft.productLabel) })}`,
  ];
  if (c.subtitle) lines.push(`<i>${esc(c.subtitle)}</i>`);
  if (c.unit_price_usd_buy) {
    lines.push(`<i>${usd(c.unit_price_usd_buy)} / ${esc(unit.replace(/s$/, "").toLowerCase() || "unit")}</i>`);
  }
  lines.push("");
  lines.push(
    isUsd
      ? t("amount.rangeUsd", { min: `$${min}`, max: `$${max}` })
      : unit === "Quantity" || !unit
        ? t("amount.rangeCount", { min, max })
        : t("amount.rangeUnits", { unit: esc(unit), min, max }),
  );

  const presets = presetAmounts({
    minRaw: c.amount_min_raw ?? "1",
    maxRaw: c.amount_max_raw ?? "1",
    decimals,
    unitLabel: c.unit_label,
    stepRaw: c.amount_step_raw,
    optionsRaw: c.amount_options_raw,
    count: 6,
  });
  const presetBtns = presets.map((p, i) =>
    btn(isUsd ? `$${p}` : `${p}`, `am:${i}`),
  );
  const keyboard: Keyboard = [
    ...grid(presetBtns, 3),
    ...(c.amount_options_raw?.length ? [] : [[btn(t("amount.custom"), "am:c")]]),
  ];
  // A single-product bot's root screen has nowhere to go "back" to.
  if (!opts.hideNav) keyboard.push(navRow(t));
  return { text: lines.join("\n"), keyboard };
}

// ---------- destination ----------

export function renderDest(
  t: Translator,
  draft: Draft,
  selfUsername?: string,
): Screen {
  const prompt = draft.leaf.chain.address_prompt ?? "";
  const isTgUsername = /telegram username/i.test(prompt);
  const lines = [
    `${leafEmoji(draft.leaf.asset_v1)} ${t("amount.title", { product: esc(draft.productLabel) })}`,
    "",
    isTgUsername
      ? t("dest.prompt.telegram_username")
      : t("dest.prompt.generic", { label: esc(prompt || "destination") }),
  ];
  const keyboard: Keyboard = [];
  if (isTgUsername && selfUsername) {
    keyboard.push([btn(t("dest.me", { username: `@${selfUsername}` }), "dm", "primary")]);
  }
  if (draft.leaf.chain.destination_optional) {
    keyboard.push([btn(t("dest.skip"), "ds")]);
  }
  keyboard.push(navRow(t));
  return { text: lines.join("\n"), keyboard };
}

// ---------- swap ----------

/** Min-deposit line; drops the fiat parenthetical when the API returns 0. */
function minDepositLine(t: Translator, min: string, usdVal?: string): string {
  const hasUsd = usdVal !== undefined && Number(usdVal) > 0;
  const raw = t("swap.minDeposit", { min, usd: hasUsd ? `$${usdVal}` : "@@" });
  return hasUsd ? raw : raw.replace(/\s*[（(]≈ @@[)）]/, "");
}


/**
 * The swap hub: a uSwapZero-style config card. Pair on top with a flip
 * button, amount + address filled in any order, quote unlocks when ready.
 */
export function renderSwapCard(
  t: Translator,
  draft: Draft,
  opts: { hideNav?: boolean } = {},
): Screen {
  const sendSym = draft.paySymbol ?? "?";
  const recvSym = draft.leaf.symbol;
  const notSet = `<i>${t("swap.notset")}</i>`;
  const amountDisplay = draft.amountHuman
    ? draft.inputType === "usd"
      ? `<b>$${esc(draft.amountHuman)}</b> <i>(in ${esc(sendSym)})</i>`
      : `<b>${esc(draft.amountHuman)} ${esc(sendSym)}</b>`
    : notSet;
  const addrDisplay = draft.destination
    ? `<code>${esc(draft.destination.length > 24 ? draft.destination.slice(0, 10) + "…" + draft.destination.slice(-8) : draft.destination)}</code>`
    : notSet;
  const lines = [
    `🔄 <b>${t("btn.swap").replace("🔄 ", "")}</b>`,
    "",
    `↗️ ${t("quote.yousend")}:  ${assetEmojiHtml(sendSym)} <b>${esc(sendSym)}</b> <i>(${esc(draft.payChainName ?? "")})</i>`,
    `↘️ ${t("swap.receive")}:  ${assetEmojiHtml(recvSym)} <b>${esc(recvSym)}</b> <i>(${esc(draft.leaf.chain.name)})</i>`,
    "",
    `💵 ${t("btn.setAmount").replace("💵 ", "")}:  ${amountDisplay}`,
    `📍 ${t("btn.setAddress").replace("📍 ", "")}:  ${addrDisplay}`,
  ];
  if (draft.payMinHuman) {
    lines.push("", minDepositLine(t, `${draft.payMinHuman} ${esc(sendSym)}`, draft.payMinUsd));
  }
  const ready = Boolean(draft.amountHuman && draft.destination);
  const keyboard: Keyboard = [
    [
      btn(`↗️ ${sendSym}`, "sc:s", undefined, assetIconId(sendSym)),
      btn(t("btn.flipPair"), "sc:f"),
      btn(`↘️ ${recvSym}`, "sc:r", undefined, assetIconId(recvSym)),
    ],
    [
      btn(`${draft.amountHuman ? "✅" : "🔴"} ${t("btn.setAmount")}`, "sc:a"),
      btn(`${draft.destination ? "✅" : "🔴"} ${t("btn.setAddress")}`, "sc:d"),
    ],
  ];
  if (ready) keyboard.push([btn(t("btn.getQuote"), "sc:q", "success")]);
  if (!opts.hideNav) keyboard.push([btn(t("btn.home"), "h")]);
  return { text: lines.join("\n"), keyboard };
}

export function renderSwapTo(
  t: Translator,
  choices: PayAssetChoice[],
  more: boolean,
  opts: { hideNav?: boolean } = {},
): Screen {
  const lines = [t("swap.toTitle"), "", t("swap.toSubtitle")];
  let shown: PayAssetChoice[];
  if (!more) {
    const popular = POPULAR_ORDER.map((id) =>
      choices.find((c) => c.assetId.toLowerCase() === id),
    ).filter((c): c is PayAssetChoice => Boolean(c));
    shown = popular.length >= 4 ? popular : choices.slice(0, 12);
  } else {
    shown = choices;
  }
  const assetBtns = shown.map((c) => {
    const idx = choices.indexOf(c);
    const icon = assetIconId(c.assetId);
    const label = icon ? c.symbol : `${assetEmojiChar(c.assetId)} ${c.symbol}`;
    return btn(label, `st:${idx}`, undefined, icon);
  });
  const keyboard: Keyboard = [...grid(assetBtns, 3)];
  if (!more && choices.length > shown.length) {
    keyboard.push([btn(t("pay.morecoins"), "st:m")]);
  }
  if (!opts.hideNav) keyboard.push(navRow(t));
  return { text: lines.join("\n"), keyboard };
}

export function renderSwapToNetworks(t: Translator, choice: PayAssetChoice): Screen {
  const lines = [
    t("pay.networkTitle", { symbol: esc(choice.symbol) }),
    "",
    t("pay.networkSubtitle"),
  ];
  const netBtns = choice.networks.map((n, i) =>
    btn(n.chain_name, `sn:${i}`, undefined, networkIconId(n.chain_id)),
  );
  return { text: lines.join("\n"), keyboard: [...grid(netBtns, 2), navRow(t)] };
}

export function renderSwapAddr(t: Translator, draft: Draft): Screen {
  return {
    text: t("swap.addrPrompt", {
      symbol: esc(draft.leaf.symbol),
      network: esc(draft.leaf.chain.name),
    }),
    keyboard: [navRow(t)],
  };
}

export function renderSwapMemo(t: Translator): Screen {
  return {
    text: t("swap.memoPrompt"),
    keyboard: [[btn(t("dest.skip"), "sm")], navRow(t)],
  };
}

const SWAP_USD_PRESETS = [20, 50, 100, 250, 500, 1000];

export function renderSwapAmount(t: Translator, draft: Draft): Screen {
  const presets = SWAP_USD_PRESETS.map((n) => btn(`$${n}`, `sa:${n}`));
  const lines = [t("swap.amountPrompt", { symbol: esc(draft.paySymbol ?? "") })];
  if (draft.payMinHuman) {
    lines.push(
      "",
      minDepositLine(t, `${draft.payMinHuman} ${esc(draft.paySymbol ?? "")}`, draft.payMinUsd),
    );
  }
  return {
    text: lines.join("\n"),
    keyboard: [...grid(presets, 3), navRow(t)],
  };
}

// ---------- payment asset picker ----------

const POPULAR_ORDER = [
  "btc", "eth", "sol", "usdc", "usdt", "xmr", "ltc", "gram", "trx", "doge", "bnb", "xrp",
];

export function renderPay(
  t: Translator,
  draft: Draft,
  choices: PayAssetChoice[],
  more: boolean,
): Screen {
  const summary = summaryLine(draft);
  const lines = [t("pay.title"), "", t("pay.subtitle", { product: summary })];

  let shown: PayAssetChoice[];
  if (!more) {
    const popular = POPULAR_ORDER.map((id) =>
      choices.find((c) => c.assetId.toLowerCase() === id),
    ).filter((c): c is PayAssetChoice => Boolean(c));
    shown = popular.length >= 4 ? popular : choices.slice(0, 12);
  } else {
    shown = choices;
  }

  const assetBtns = shown.map((c) => {
    const idx = choices.indexOf(c);
    const icon = assetIconId(c.assetId);
    const label = icon ? c.symbol : `${assetEmojiChar(c.assetId)} ${c.symbol}`;
    return btn(label, `pa:${idx}`, undefined, icon);
  });
  const keyboard: Keyboard = [...grid(assetBtns, 3)];
  if (!more && choices.length > shown.length) {
    keyboard.push([btn(t("pay.morecoins"), "pa:m")]);
  }
  keyboard.push(navRow(t));
  return { text: lines.join("\n"), keyboard };
}

export function renderPayNetworks(t: Translator, choice: PayAssetChoice): Screen {
  const lines = [
    t("pay.networkTitle", { symbol: esc(choice.symbol) }),
    "",
    t("pay.networkSubtitle"),
  ];
  const netBtns = choice.networks.map((n, i) =>
    btn(n.chain_name, `pn:${i}`, undefined, networkIconId(n.chain_id)),
  );
  return { text: lines.join("\n"), keyboard: [...grid(netBtns, 2), navRow(t)] };
}

// ---------- quote ----------

function familyOf(draft: Draft): string {
  return draft.leaf.asset_v1.split(":")[1] ?? "";
}

function summaryLine(draft: Draft): string {
  if (draft.swap) return `🔄 <b>${esc(draft.productLabel)}</b>`;
  return `${leafEmoji(draft.leaf.asset_v1)} <b>${esc(formatProductAmount(draft))}</b>`;
}

/** "Amazon Gift Card $50", "Telegram Stars × 50", "Mullvad VPN — 3 Months" */
export function formatProductAmount(draft: {
  productLabel: string;
  amountHuman?: string;
  leaf: Draft["leaf"];
}): string {
  const unit = draft.leaf.chain.unit_label ?? "";
  const amount = draft.amountHuman ?? "";
  if (unit === "USD") return `$${amount} ${draft.productLabel}`;
  if (unit === "Quantity" || !unit) return `${draft.productLabel} × ${amount}`;
  return `${draft.productLabel} — ${amount} ${unit}`;
}

export function renderQuoteLoading(t: Translator): Screen {
  return { text: t("quote.loading"), keyboard: [] };
}

export function renderQuote(t: Translator, draft: Draft): Screen {
  const q = draft.quote!;
  const paySymbol = draft.paySymbol ?? "";
  const sourceHuman = niceCrypto(rawToHuman(q.source_amount_raw, draft.payDecimals ?? 0));
  const isUsername = /username/i.test(draft.leaf.chain.address_prompt ?? "");
  const destDisplay = draft.destination
    ? isUsername
      ? `@${draft.destination}`
      : draft.destination
    : null;
  // Swaps: "you get" is the ESTIMATED receive amount from the live quote.
  const getLine = draft.swap
    ? `${t("swap.youreceive")}:  <b>~${niceCrypto(rawToHuman(q.destination_amount_raw, draft.leaf.decimals))} ${esc(draft.leaf.symbol)}</b> <i>(≈ ${usd(q.destination_amount_usd)})</i>`
    : `${t("quote.youget")}:  ${summaryLine(draft)}`;
  const lines = [
    t("quote.title"),
    "",
    getLine,
    `${t("quote.yousend")}:  <b>${sourceHuman} ${esc(paySymbol)}</b> <i>(≈ ${usd(q.source_amount_usd)})</i> ${t("quote.via", { network: esc(draft.payChainName ?? "") })}`,
    ...(q.creator_fee
      ? [`Shop fee:  <b>${usd(q.creator_fee.amount_usd)}</b> <i>(${formatFeePercent(q.creator_fee.fee_bps)})</i>`]
      : []),
    ...(destDisplay ? [`${t("quote.deliverto")}:  <code>${esc(destDisplay)}</code>`] : []),
    ...(draft.destinationMemo
      ? [`Memo:  <code>${esc(draft.destinationMemo)}</code>`]
      : []),
    "",
    `${t("quote.eta")}: ${t("quote.etaValue", { minutes: 5 })}`,
    `⏳ ${tgTime(q.expires_at)}`,
    "",
    t("quote.note"),
  ];
  const keyboard: Keyboard = [
    [btn(t("quote.confirm"), "cf", "success")],
    [btn(t("btn.back"), "bk"), btn(t("btn.cancel"), "cx", "danger")],
  ];
  return { text: lines.join("\n"), keyboard };
}

function formatFeePercent(bps: number): string {
  return `${Number((bps / 100).toFixed(2))}%`;
}

// ---------- deposit / order status ----------

export function renderDeposit(
  t: Translator,
  o: {
    orderId: number;
    productLabel: string;
    amountHuman: string;
    paySymbol: string;
    payNetworkName: string;
    address: string;
    memo?: string | null;
    expiresAt?: string | null;
    status: string;
    /** Offer the optional refund-address affordance. */
    offerRefund?: boolean;
  },
): Screen {
  const lines = [
    t("deposit.title"),
    "",
    `${UI.orders} <b>#${o.orderId}</b> — ${esc(o.productLabel)}`,
    "",
    `${t("deposit.sendExactly")} <b>${esc(o.amountHuman)} ${esc(o.paySymbol)}</b>`,
    t("deposit.toAddress", { network: esc(o.payNetworkName) }),
    `<code>${esc(o.address)}</code>`,
    ...(o.memo ? ["", t("deposit.memoWarning", { memo: esc(o.memo) })] : []),
    "",
    t("deposit.tapToCopy"),
    ...(o.expiresAt
      ? [t("deposit.lockNote", { time: tgTime(o.expiresAt) })]
      : []),
    "",
    statusLine(t, o.status),
  ];
  const keyboard: Keyboard = [
    [copyBtn(t("btn.copyAddress"), o.address), copyBtn(t("btn.copyAmount"), o.amountHuman)],
    [btn(t("btn.refresh"), `ost:${o.orderId}`)],
  ];
  if (o.offerRefund) keyboard.push([btn(t("btn.refundAddr"), `rf:${o.orderId}`)]);
  keyboard.push([btn(t("btn.home"), "h")]);
  return { text: lines.join("\n"), keyboard };
}

export function statusLine(t: Translator, status: string): string {
  const key = `status.${status}`;
  const label = t(key as never);
  return label === key ? esc(status) : label;
}

// ---------- orders ----------

export function renderOrders(t: Translator, orders: OrderRow[]): Screen {
  if (orders.length === 0) {
    return {
      text: [t("orders.title"), "", t("orders.empty")].join("\n"),
      keyboard: [[btn(t("btn.home"), "h")]],
    };
  }
  const lines = [t("orders.title")];
  const keyboard: Keyboard = orders.map((o) => [
    btn(
      `${statusEmoji(o.status)} #${o.id} ${o.product_label}`,
      `or:${o.id}`,
    ),
  ]);
  keyboard.push([btn(t("btn.home"), "h")]);
  return { text: lines.join("\n"), keyboard };
}

function statusEmoji(status: string): string {
  switch (status) {
    case "completed":
      return "✅";
    case "failed":
    case "cancelled":
      return "❌";
    case "expired":
      return "⌛️";
    case "refunded":
    case "refunding":
      return "↩️";
    case "awaiting_deposit":
      return "⏳";
    default:
      return "⚙️";
  }
}

export function renderOrderDetail(
  t: Translator,
  order: OrderRow,
  vault: DeliveryItem[] | null,
): Screen {
  const lines = [
    t("order.progress", {
      id: `#${order.id}`,
      product: esc(order.product_label),
      status: statusLine(t, order.status),
    }),
  ];
  const keyboard: Keyboard = [];

  if (order.status === "awaiting_deposit" && order.deposit_address) {
    lines.push("");
    lines.push(
      `${t("deposit.sendExactly")} <b>${esc(order.deposit_amount ?? "")} ${esc(order.deposit_asset ?? "")}</b>`,
    );
    lines.push(`<code>${esc(order.deposit_address)}</code>`);
    if (order.deposit_memo) lines.push(t("deposit.memoWarning", { memo: esc(order.deposit_memo) }));
    keyboard.push([
      copyBtn(t("btn.copyAddress"), order.deposit_address),
      copyBtn(t("btn.copyAmount"), order.deposit_amount ?? ""),
    ]);
    if (order.pay_asset_v1 && !order.refund_set) {
      keyboard.push([btn(t("btn.refundAddr"), `rf:${order.id}`)]);
    }
  }

  if (vault?.length) {
    lines.push("", t("vault.title"));
    for (const item of vault) {
      lines.push(`\n<b>${esc(item.label)}</b>`);
      for (const f of item.fields ?? []) {
        lines.push(`${esc(f.label)}: <tg-spoiler><code>${esc(f.value)}</code></tg-spoiler>`);
      }
      for (const f of (item.fields ?? []).filter((f) => f.copy)) {
        keyboard.push([copyBtn(`${UI.copy} ${f.label}`, f.value)]);
      }
      for (const action of item.actions ?? []) {
        // callback_data is capped at 64 bytes — skip (never truncate) actions
        // that would not round-trip intact.
        const data = `da:${order.id}:${item.id}:${action}`;
        if (Buffer.byteLength(data) <= 64) {
          keyboard.push([btn(actionLabel(t, action), data)]);
        }
      }
    }
    lines.push("", t("order.deliveryHint"));
  } else if (order.status === "completed") {
    lines.push("", t("vault.pending"));
  }

  keyboard.push([btn(t("btn.refresh"), `ost:${order.id}`)]);
  keyboard.push([btn(t("btn.back"), "or"), btn(t("btn.home"), "h")]);
  return { text: lines.join("\n"), keyboard };
}

function actionLabel(t: Translator, action: string): string {
  if (/code/i.test(action)) return t("btn.requestLoginCode");
  return action.replaceAll("_", " ");
}

// ---------- language & help ----------

export function renderLanguage(
  t: Translator,
  languages: { code: string; label: string }[],
  active: string,
): Screen {
  const langBtns = languages.map((l) => {
    const isActive = l.code === active;
    return btn(isActive ? `• ${l.label}` : l.label, `lg:${l.code}`, isActive ? "primary" : undefined);
  });
  return {
    text: t("lang.title"),
    keyboard: [...grid(langBtns, 2), [btn(t("btn.home"), "h")]],
  };
}

export function renderHelp(t: Translator, brand: string, support: string): Screen {
  return {
    text: [
      t("help.title", { brand: esc(brand) }),
      "",
      t("help.body"),
      "",
      t("help.support", { support: esc(support) }),
    ].join("\n"),
    keyboard: [[btn(t("btn.home"), "h")]],
  };
}
