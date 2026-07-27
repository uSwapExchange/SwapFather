/**
 * Telegram update handlers. Thin: parse the update, call flow.ts, render a
 * screen, edit the anchored message.
 *
 * The whole UI lives in ONE anchored message per user that is edited in
 * place. Free-text input (custom amounts, usernames, search) is consumed and
 * deleted where possible to keep the chat clean.
 */

import type { Bot, Context } from "grammy";
import { InputFile } from "grammy";
import QRCode from "qrcode";
import {
  getOrder,
  listUserOrders,
  insertOrder,
  setOrderMessage,
  setOrderQrMessage,
  setUserLanguage,
  upsertUser,
  TERMINAL_ORDER_STATUSES,
} from "../lib/store.ts";
import {
  getTranslator,
  resolveLanguage,
  SUPPORTED_LANGUAGES,
  type Translator,
} from "../i18n/index.ts";
import { getFamilies } from "./catalog.ts";
import { getGiftCardCountrySegment } from "./inline.ts";
import * as flow from "./flow.ts";
import type { FlowSession } from "./flow.ts";
import { loadSession, persistSession, resetSession } from "./session.ts";
import * as screens from "./screens.ts";
import type { Screen } from "./screens.ts";
import { markup, stripIcons } from "./keyboard.ts";
import { customEmojiEnabled, disableCustomEmoji, stripTgEmoji } from "./emoji.ts";
import { uswap, UswapApiError } from "../uswap/client.ts";
import { esc, rawToHuman } from "../lib/format.ts";
import { logger } from "../lib/logger.ts";
import { checkOrderNow } from "./poller.ts";
import { isNiche, sellsProducts, sellsSwaps, type Tenant } from "../tenant.ts";

interface Uctx {
  ctx: Context;
  s: FlowSession;
  t: Translator;
  tenant: Tenant;
  userId: number;
  chatId: number;
}

function getT(tenant: Tenant, ctx: Context): { t: Translator; lang: string } {
  const user = upsertUser({
    tenantId: tenant.id,
    userId: ctx.from!.id,
    tgLanguageCode: ctx.from?.language_code,
    username: ctx.from?.username,
  });
  const lang = user.language ?? resolveLanguage(user.tg_language_code ?? undefined);
  return { t: getTranslator(lang), lang };
}

async function showScreen(u: Uctx, screen: Screen, opts: { newMessage?: boolean } = {}) {
  let { text, keyboard } = screen;
  // Bots whose owner lacks Premium had custom emoji rejected before —
  // strip up front instead of burning a failed API call every render.
  if (!customEmojiEnabled(u.tenant.botId)) {
    text = stripTgEmoji(text);
    keyboard = stripIcons(keyboard);
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const payload = {
      parse_mode: "HTML" as const,
      reply_markup: markup(keyboard) as never,
      link_preview_options: { is_disabled: true },
    };
    try {
      if (!opts.newMessage && u.s.messageId) {
        try {
          await u.ctx.api.editMessageText(u.chatId, u.s.messageId, text, payload);
          return;
        } catch (err) {
          const msg = String(err);
          if (msg.includes("message is not modified")) return;
          if (isCustomEmojiRejection(msg)) throw err;
          // Anchor unusable (deleted / too old) — send a fresh one.
          logger.debug("edit failed; sending new anchor", { err: msg.slice(0, 120) });
        }
      }
      const sent = await u.ctx.api.sendMessage(u.chatId, text, payload);
      u.s.messageId = sent.message_id;
      u.s.chatId = u.chatId;
      return;
    } catch (err) {
      // Self-hosters without Telegram Premium on the bot owner: Telegram may
      // reject custom emoji entities / button icons. Degrade to unicode for
      // the rest of the process lifetime and retry once.
      if (
        attempt === 0 &&
        customEmojiEnabled(u.tenant.botId) &&
        isCustomEmojiRejection(String(err))
      ) {
        logger.warn("custom emoji rejected by Telegram; falling back to unicode", {
          botId: u.tenant.botId,
        });
        disableCustomEmoji(u.tenant.botId);
        text = stripTgEmoji(text);
        keyboard = stripIcons(keyboard);
        continue;
      }
      throw err;
    }
  }
}

function isCustomEmojiRejection(msg: string): boolean {
  return /custom.?emoji|emoji.?id|button.*icon|icon.*button/i.test(msg);
}

async function showHome(u: Uctx, opts: { newMessage?: boolean } = {}): Promise<void> {
  u.s.nav = [];
  u.s.draft = undefined;
  u.s.awaiting = null;
  // A swap-only bot IS a swap service — home is the receive-coin picker.
  if (!sellsProducts(u.tenant)) {
    await flow.startSwap(u.s);
    return showCurrent(u);
  }
  const families = await getFamilies(u.tenant.families);
  // Niche mode: a single-category bot IS that category — home opens the
  // category itself, no pointless one-button shop grid in between.
  if (isNiche(u.tenant) && families.length === 1 && !sellsSwaps(u.tenant)) {
    await flow.enterLevel(u.s, {
      asset: families[0]!.id,
      segments: [],
      cursorStack: [null],
      nextCursor: null,
    });
    if (autoSelectSingleLeaf(u.s)) return showCurrent(u);
    return showBrowse(u);
  }
  u.s.screen = "home";
  await showScreen(
    u,
    screens.renderHome(u.t, families, u.tenant.brandName, sellsSwaps(u.tenant)),
    opts,
  );
}

async function showBrowse(u: Uctx): Promise<void> {
  const nav = flow.currentNav(u.s);
  if (!nav || !u.s.meta || !u.s.page) return showHome(u);
  await showScreen(u, screens.renderBrowse(u.t, u.s.meta, nav, u.s.page));
}

async function showCurrent(u: Uctx): Promise<void> {
  const s = u.s;
  switch (s.screen) {
    case "browse":
      return showBrowse(u);
    case "swto":
      return showScreen(
        u,
        screens.renderSwapTo(u.t, s.swapChoices ?? [], s.swapMore ?? false),
      );
    case "swtonet":
      return showScreen(u, screens.renderSwapToNetworks(u.t, s.swapNetChoice!));
    case "swaddr":
      s.awaiting = "swaddr";
      return showScreen(u, screens.renderSwapAddr(u.t, s.draft!));
    case "swmemo":
      s.awaiting = "swmemo";
      return showScreen(u, screens.renderSwapMemo(u.t));
    case "swamount":
      s.awaiting = "swamount";
      return showScreen(u, screens.renderSwapAmount(u.t, s.draft!));
    case "amount":
      // Arm free-text input: presets are one tap, but typing "75" works too.
      s.awaiting = "amount";
      return showScreen(u, screens.renderAmount(u.t, s.draft!));
    case "dest":
      s.awaiting = "dest";
      return showScreen(u, screens.renderDest(u.t, s.draft!, u.ctx.from?.username));
    case "pay":
      if (!s.payChoices) await flow.loadPayChoices(s);
      return showScreen(u, screens.renderPay(u.t, s.draft!, s.payChoices!, s.payMore ?? false));
    case "paynet":
      return showScreen(u, screens.renderPayNetworks(u.t, s.payNetChoice!));
    case "quote":
      return showQuote(u);
    default:
      return showHome(u);
  }
}

async function showQuote(u: Uctx) {
  const s = u.s;
  await showScreen(u, screens.renderQuoteLoading(u.t));
  try {
    await flow.fetchQuote(s, u.tenant);
  } catch (err) {
    return showQuoteError(u, err);
  }
  await showScreen(u, screens.renderQuote(u.t, s.draft!));
}

async function showQuoteError(u: Uctx, err: unknown) {
  let reason = u.t("error.generic");
  if (err instanceof UswapApiError) {
    if (err.code === "min_amount") {
      const details = err.details as
        | { provider_quote_attempts?: { min_amount_raw?: string }[] }
        | undefined;
      const minRaw = details?.provider_quote_attempts?.find((a) => a.min_amount_raw)
        ?.min_amount_raw;
      const draft = u.s.draft;
      if (minRaw && draft) {
        const decimals = draft.leaf.chain.amount_decimals ?? draft.leaf.decimals ?? 0;
        reason = `${err.message} (min ${rawToHuman(minRaw, decimals)})`;
      } else reason = err.message;
    } else {
      reason = err.message;
    }
    if (err.code === "invalid_destination") {
      u.s.screen = "dest";
      u.s.awaiting = "dest";
      persistSession(u.tenant.id, u.userId, u.s);
      const scr = screens.renderDest(u.t, u.s.draft!, u.ctx.from?.username);
      scr.text = `⚠️ ${esc(reason)}\n\n${scr.text}`;
      return showScreen(u, scr);
    }
  } else {
    logger.error("quote failed", { err: String(err) });
  }
  const s = u.s;
  s.screen = "pay";
  const scr = screens.renderPay(u.t, s.draft!, s.payChoices ?? [], s.payMore ?? false);
  scr.text = `${u.t("quote.error", { reason: esc(reason) })}\n\n${scr.text}`;
  return showScreen(u, scr);
}

// ---------- deposit ----------

async function confirmAndOpen(u: Uctx) {
  const s = u.s;
  const draft = s.draft!;
  const externalId = `bb4u-${u.userId}-${Date.now()}`;
  let result: flow.CommitResult;
  await showScreen(u, screens.renderQuoteLoading(u.t));
  try {
    result = await flow.commit(s, u.tenant, externalId);
  } catch (err) {
    if (err instanceof flow.RepriceRequiredError) {
      // The approved price expired and the market moved — show the fresh
      // quote (already in the draft) and let the user decide again.
      s.screen = "quote";
      const scr = screens.renderQuote(u.t, s.draft!);
      scr.text = `⚠️ ${u.t("error.expiredQuote")}\n\n${scr.text}`;
      return showScreen(u, scr);
    }
    return showQuoteError(u, err);
  }

  const productLabel = draft.swap
    ? `Swap → ~${rawToHuman(draft.quote!.destination_amount_raw, draft.leaf.decimals)} ${draft.leaf.symbol}`
    : screens.formatProductAmount(draft);

  const orderId = insertOrder({
    tenantId: u.tenant.id,
    userId: u.userId,
    chatId: u.chatId,
    bridgeId: result.bridgeId,
    intentId: result.intentId,
    status: result.status,
    productLabel,
    payLabel: `${draft.paySymbol} (${draft.payChainName})`,
    depositAddress: result.depositAddress,
    depositMemo: result.depositMemo,
    depositAmount: result.depositAmountHuman,
    depositAsset: draft.paySymbol,
    expiresAt: result.expiresAt,
  });

  const scr = screens.renderDeposit(u.t, {
    orderId,
    productLabel,
    amountHuman: result.depositAmountHuman,
    paySymbol: draft.paySymbol ?? "",
    payNetworkName: draft.payChainName ?? "",
    address: result.depositAddress,
    memo: result.depositMemo,
    expiresAt: result.expiresAt,
    status: result.status,
  });
  // The deposit card becomes the new anchor; drop the old flow message so
  // the chat doesn't end on a stale "getting the best price…" screen.
  const oldAnchor = u.s.messageId;
  await showScreen(u, scr, { newMessage: true });
  if (oldAnchor) await u.ctx.api.deleteMessage(u.chatId, oldAnchor).catch(() => {});
  if (u.s.messageId) setOrderMessage(orderId, u.s.messageId);

  // QR code below the deposit card; deleted once payment is detected.
  try {
    const png = await QRCode.toBuffer(result.depositAddress, {
      width: 400,
      margin: 2,
    });
    const photo = await u.ctx.api.sendPhoto(u.chatId, new InputFile(png, "deposit.png"));
    setOrderQrMessage(orderId, photo.message_id);
  } catch (err) {
    logger.warn("qr send failed", { err: String(err) });
  }

  // Clear the purchase draft; the order lives on in the orders table. The
  // deposit card belongs to the ORDER (poller updates it) — detach it from
  // the session anchor so later navigation never overwrites it.
  s.draft = undefined;
  s.payChoices = undefined;
  s.screen = "deposit";
  s.messageId = undefined;
}

// ---------- orders ----------

async function showOrders(u: Uctx, opts: { newMessage?: boolean } = {}) {
  const orders = listUserOrders(u.tenant.id, u.userId, 10);
  u.s.screen = "orders";
  await showScreen(u, screens.renderOrders(u.t, orders), opts);
}

async function showOrderDetail(u: Uctx, orderId: number) {
  const order = getOrder(orderId);
  if (!order || order.user_id !== u.userId || order.tenant_id !== u.tenant.id) {
    return showOrders(u);
  }
  let vault = null;
  if (order.status === "completed") {
    try {
      const res = await uswap.getDigitalDelivery(order.bridge_id, order.intent_id);
      vault = res.items;
    } catch (err) {
      logger.warn("vault fetch failed", { err: String(err) });
    }
  }
  u.s.screen = "order";
  await showScreen(u, screens.renderOrderDetail(u.t, order, vault));
}

// ---------- back navigation ----------

async function goBack(u: Uctx) {
  const s = u.s;
  switch (s.screen) {
    case "swto":
      s.draft = undefined;
      return showHome(u);
    case "swtonet":
      s.screen = "swto";
      return showCurrent(u);
    case "swaddr":
      s.screen = s.swapNetChoice && s.swapNetChoice.networks.length > 1 ? "swtonet" : "swto";
      return showCurrent(u);
    case "swmemo":
      s.screen = "swaddr";
      return showCurrent(u);
    case "swamount":
      s.screen = "pay";
      return showCurrent(u);
    case "browse": {
      s.nav.pop();
      const nav = flow.currentNav(s);
      if (!nav) return showHome(u);
      await flow.enterLevel(s, nav, nav.cursorStack[nav.cursorStack.length - 1] ?? null);
      return showBrowse(u);
    }
    case "amount":
      s.draft = undefined;
      s.screen = "browse";
      return showBrowse(u);
    case "dest":
      s.screen = "amount";
      return showCurrent(u);
    case "pay": {
      const draft = s.draft;
      if (draft?.swap) {
        s.screen = flow.swapNeedsMemo(s) ? "swmemo" : "swaddr";
        return showCurrent(u);
      }
      if (draft && (draft.destination || !draft.leaf.chain.address_prompt)) {
        s.screen = draft.leaf.chain.destination_locked
          ? "browse"
          : draft.leaf.chain.address_prompt
            ? "dest"
            : "amount";
      } else {
        s.screen = "amount";
      }
      if (s.screen === "browse") return showBrowse(u);
      return showCurrent(u);
    }
    case "paynet":
      s.screen = "pay";
      return showCurrent(u);
    case "quote":
      s.screen = s.draft?.swap ? "swamount" : "pay";
      return showCurrent(u);
    default:
      return showHome(u);
  }
}

// ---------- registration ----------

export function registerHandlers(bot: Bot, tenant: Tenant) {
  const runUi = makeRunUi(tenant);
  const handleCallback = makeHandleCallback(tenant, runUi);
  const handleText = makeHandleText(runUi);

  bot.command("start", async (ctx) => {
    if (!ctx.from || ctx.chat.type !== "private") return;
    const { t } = getT(tenant, ctx);
    const s = resetSession(tenant.id, ctx.from.id) as FlowSession;
    const u: Uctx = { ctx, s, t, tenant, userId: ctx.from.id, chatId: ctx.chat.id };

    // Deep links: t.me/bot?start=gift-card (family) or ?start=gc-amazon (brand).
    const payload = ctx.match?.trim();
    if (payload && payload !== "shop") {
      const families = await getFamilies(tenant.families);
      const family = families.find((f) => f.id === payload);
      if (family) {
        await flow.enterLevel(s, {
          asset: family.id,
          segments: [],
          cursorStack: [null],
          nextCursor: null,
        });
        if (autoSelectSingleLeaf(s)) await showCurrent(u);
        else await showBrowse(u);
        persistSession(tenant.id, ctx.from.id, s);
        return;
      }
      if (payload.startsWith("gc-") && (!tenant.families || tenant.families.includes("gift-card"))) {
        const brandId = payload.slice(3);
        const country = await getGiftCardCountrySegment();
        if (country && /^[A-Za-z0-9_-]+$/.test(brandId)) {
          try {
            await flow.enterLevel(s, {
              asset: "gift-card",
              segments: [
                country,
                {
                  key: "brand",
                  id: brandId,
                  wire: {
                    parent_group_id: country.wire?.parent_group_id ?? country.id,
                    group_id: brandId,
                  },
                },
              ],
              cursorStack: [null],
              nextCursor: null,
            });
            if (autoSelectSingleLeaf(s)) await showCurrent(u);
            else await showBrowse(u);
            persistSession(tenant.id, ctx.from.id, s);
            return;
          } catch (err) {
            logger.warn("gc deep link failed; falling back to home", {
              brandId,
              err: String(err),
            });
          }
        }
      }
    }
    await showHome(u, { newMessage: true });
    persistSession(tenant.id, ctx.from.id, s);
  });

  bot.command("shop", (ctx) => runUi(ctx, (u) => showHome(u, { newMessage: true })));
  bot.command("orders", (ctx) => runUi(ctx, (u) => showOrders(u, { newMessage: true })));
  bot.command("help", (ctx) =>
    runUi(ctx, (u) =>
      showScreen(
        u,
        screens.renderHelp(u.t, u.tenant.brandName, u.tenant.supportHandle ?? "@uSwapSupport"),
        { newMessage: true },
      ),
    ),
  );
  bot.command("language", (ctx) =>
    runUi(ctx, async (u) => {
      const user = upsertUser({ tenantId: u.tenant.id, userId: u.userId });
      const active = user.language ?? resolveLanguage(user.tg_language_code ?? undefined);
      u.s.screen = "lang";
      await showScreen(u, screens.renderLanguage(u.t, SUPPORTED_LANGUAGES, active), {
        newMessage: true,
      });
    }),
  );

  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    try {
      await handleCallback(ctx, data);
      await ctx.answerCallbackQuery().catch(() => {});
    } catch (err) {
      logger.error("callback failed", { data, err: String(err) });
      await ctx
        .answerCallbackQuery({ text: getT(tenant, ctx).t("error.generic"), show_alert: false })
        .catch(() => {});
    }
  });

  bot.on("message:text", async (ctx) => {
    if (!ctx.from || ctx.chat.type !== "private") return;
    if (ctx.message.text.startsWith("/")) return;
    await handleText(ctx);
  });
}

/**
 * A level with exactly one in-stock product IS that product — skip the
 * pointless single-button screen (e.g. Mullvad's lone "VPN · Top-up" leaf).
 */
function autoSelectSingleLeaf(s: FlowSession): boolean {
  const nav = flow.currentNav(s);
  if (nav?.query || nav?.category) return false;
  if (s.page?.length !== 1) return false;
  const only = s.page[0]!;
  if (only.k === "l" && !only.item.chain.out_of_stock) {
    flow.startDraft(s, only.item);
    return true;
  }
  return false;
}

type RunUi = (ctx: Context, fn: (u: Uctx) => Promise<void>) => Promise<void>;

function makeRunUi(tenant: Tenant): RunUi {
  return async (ctx, fn) => {
    if (!ctx.from || !ctx.chat) return;
    const { t } = getT(tenant, ctx);
    const s = loadSession(tenant.id, ctx.from.id) as FlowSession;
    const u: Uctx = { ctx, s, t, tenant, userId: ctx.from.id, chatId: ctx.chat.id };
    try {
      await fn(u);
    } finally {
      persistSession(tenant.id, u.userId, u.s);
    }
  };
}

function makeHandleCallback(tenant: Tenant, runUi: RunUi) {
  return async (ctx: Context, data: string) =>
    runUi(ctx, async (u) => {
    const s = u.s;
    // Callbacks from an outdated anchor: refuse gently (except order views,
    // which are safe from any message).
    const msgId = ctx.callbackQuery?.message?.message_id;
    const isOrderCb = data.startsWith("or") || data.startsWith("ost:") || data.startsWith("da:");
    const isStale = Boolean(s.messageId && msgId && msgId !== s.messageId);
    if (isStale && data === "h") {
      // Home works from ANY message (e.g. an old deposit card) — open a
      // fresh anchor instead of hijacking whatever the old message shows.
      s.messageId = undefined;
    } else if (isStale && !isOrderCb) {
      await ctx
        .answerCallbackQuery({ text: u.t("browse.stale"), show_alert: false })
        .catch(() => {});
      return;
    }

    const [cmd = "", ...rest] = data.split(":");
    const arg = rest.join(":");

    switch (cmd) {
      case "h":
        return showHome(u);
      case "hp":
        u.s.screen = "help";
        return showScreen(
          u,
          screens.renderHelp(u.t, u.tenant.brandName, u.tenant.supportHandle ?? "@uSwapSupport"),
        );
      case "lg": {
        if (!arg) {
          const user = upsertUser({ tenantId: u.tenant.id, userId: u.userId });
          const active = user.language ?? resolveLanguage(user.tg_language_code ?? undefined);
          s.screen = "lang";
          return showScreen(u, screens.renderLanguage(u.t, SUPPORTED_LANGUAGES, active));
        }
        setUserLanguage(u.tenant.id, u.userId, arg);
        const t2 = getTranslator(arg);
        u.t = t2;
        const langLabel = SUPPORTED_LANGUAGES.find((l) => l.code === arg)?.label ?? arg;
        await ctx
          .answerCallbackQuery({ text: t2("lang.set", { language: langLabel }) })
          .catch(() => {});
        return showHome(u);
      }
      case "c": {
        await flow.enterLevel(s, {
          asset: arg,
          segments: [],
          cursorStack: [null],
          nextCursor: null,
        });
        if (autoSelectSingleLeaf(s)) return showCurrent(u);
        return showBrowse(u);
      }
      case "i": {
        const item = s.page?.[Number(arg)];
        if (!item) return showBrowse(u);
        if (item.k === "l" && item.item.chain.out_of_stock) {
          return ctx
            .answerCallbackQuery({ text: u.t("browse.soldout"), show_alert: false })
            .catch(() => {}) as Promise<void>;
        }
        if (item.k === "d") {
          if (item.oos) {
            return ctx
              .answerCallbackQuery({ text: u.t("browse.soldout"), show_alert: false })
              .catch(() => {}) as Promise<void>;
          }
          if (item.onlyItem) {
            flow.startDraft(s, item.onlyItem);
            return showCurrent(u);
          }
          const nav = flow.currentNav(s)!;
          await flow.enterLevel(s, {
            asset: nav.asset,
            segments: [...nav.segments, item.segment],
            cursorStack: [null],
            nextCursor: null,
          });
          if (autoSelectSingleLeaf(s)) return showCurrent(u);
          return showBrowse(u);
        }
        flow.startDraft(s, item.item);
        return showCurrent(u);
      }
      case "pg":
        if (arg === "n") await flow.pageNext(s);
        else await flow.pagePrev(s);
        return showBrowse(u);
      case "ct": {
        const nav = flow.currentNav(s);
        const catId = nav?.categoryIds?.[Number(arg)];
        if (!nav) return showBrowse(u);
        nav.category = nav.category === catId ? undefined : catId;
        await flow.refreshLevel(s);
        return showBrowse(u);
      }
      case "srx": {
        const nav = flow.currentNav(s);
        if (nav) {
          nav.query = undefined;
          await flow.refreshLevel(s);
        }
        return showBrowse(u);
      }
      case "sr":
        s.awaiting = "search";
        return showScreen(u, {
          text: u.t("browse.searchPrompt"),
          keyboard: [[{ text: u.t("btn.back"), callback_data: "bk" }]],
        });
      case "am": {
        if (arg === "c") {
          s.awaiting = "amount";
          const c = s.draft!.leaf.chain;
          const decimals = c.amount_decimals ?? s.draft!.leaf.decimals ?? 0;
          return showScreen(u, {
            text: u.t("amount.customPrompt", {
              min: rawToHuman(c.amount_min_raw ?? "1", decimals),
              max: rawToHuman(c.amount_max_raw ?? "1", decimals),
              unit: c.unit_label ?? "",
            }),
            keyboard: [[{ text: u.t("btn.back"), callback_data: "bk" }]],
          });
        }
        const presets = screens.renderAmount(u.t, s.draft!);
        // Recompute the preset list the same way the renderer did.
        const presetLabels = presets.keyboard
          .flat()
          .filter((b) => b.callback_data?.startsWith("am:") && b.callback_data !== "am:c");
        const chosen = presetLabels[Number(arg)];
        if (!chosen) return showCurrent(u);
        flow.setAmount(s, chosen.text.replace(/^\$/, ""));
        if (s.screen === "pay") await flow.loadPayChoices(s);
        return showCurrent(u);
      }
      case "dm": {
        const username = ctx.from?.username;
        if (!username) {
          s.awaiting = "dest";
          return showScreen(u, screens.renderDest(u.t, s.draft!, undefined));
        }
        s.awaiting = null;
        s.draft!.destination = username;
        s.screen = "pay";
        await flow.loadPayChoices(s);
        return showCurrent(u);
      }
      case "ds": {
        s.awaiting = null;
        s.draft!.destination = undefined;
        s.screen = "pay";
        await flow.loadPayChoices(s);
        return showCurrent(u);
      }
      case "pa": {
        if (arg === "m") {
          s.payMore = true;
          return showCurrent(u);
        }
        flow.pickPayAsset(s, Number(arg));
        return showCurrent(u);
      }
      case "pn": {
        if (!s.payNetChoice) return showCurrent(u);
        flow.selectPayNetwork(s, s.payNetChoice, Number(arg));
        return showCurrent(u);
      }
      case "sw": {
        await flow.startSwap(s);
        return showCurrent(u);
      }
      case "st": {
        if (arg === "m") {
          s.swapMore = true;
          return showCurrent(u);
        }
        flow.pickSwapTo(s, Number(arg));
        return showCurrent(u);
      }
      case "sn": {
        if (!s.swapNetChoice) return showCurrent(u);
        flow.selectSwapToNetwork(s, s.swapNetChoice, Number(arg));
        return showCurrent(u);
      }
      case "sm": {
        s.awaiting = null;
        s.draft!.destinationMemo = undefined;
        s.screen = "pay";
        await flow.loadPayChoices(s);
        return showCurrent(u);
      }
      case "sa": {
        const draft = s.draft;
        if (!draft?.swap) return showCurrent(u);
        s.awaiting = null;
        draft.amountHuman = arg;
        draft.inputType = "usd";
        draft.inputSide = "from";
        s.screen = "quote";
        return showCurrent(u);
      }
      case "cf":
        // Double-tap guard: the first tap clears the draft when it finishes,
        // so a queued second tap must not re-enter with empty state.
        if (!s.draft?.quote) {
          return ctx
            .answerCallbackQuery({ text: u.t("browse.stale"), show_alert: false })
            .catch(() => {}) as Promise<void>;
        }
        return confirmAndOpen(u);
      case "cx":
        s.draft = undefined;
        return showHome(u);
      case "bk":
        s.awaiting = null;
        return goBack(u);
      case "or":
        if (!arg) return showOrders(u);
        return showOrderDetail(u, Number(arg));
      case "ost": {
        const orderId = Number(arg);
        const order = getOrder(orderId);
        if (order && order.user_id === u.userId && order.tenant_id === u.tenant.id) {
          await checkOrderNow(ctx.api, order);
          if (!TERMINAL_ORDER_STATUSES.has(order.status)) {
            await ctx
              .answerCallbackQuery({ text: "🔄" })
              .catch(() => {});
          }
          const fresh = getOrder(orderId)!;
          if (s.screen === "order") return showOrderDetail(u, orderId);
          // Deposit anchors are updated by checkOrderNow itself.
          void fresh;
        }
        return;
      }
      case "da": {
        const [orderIdStr = "", itemId = "", ...actionParts] = arg.split(":");
        const order = getOrder(Number(orderIdStr));
        if (!order || order.user_id !== u.userId || order.tenant_id !== u.tenant.id) return;
        try {
          await uswap.runDeliveryAction(
            order.bridge_id,
            {
              delivery_item_id: itemId,
              action: actionParts.join(":"),
              intent_id: order.intent_id,
            },
            `da-${order.id}-${Date.now()}`,
          );
          await ctx
            .answerCallbackQuery({ text: "✅", show_alert: false })
            .catch(() => {});
        } catch (err) {
          const msg = err instanceof UswapApiError ? err.message : u.t("error.generic");
          await ctx.answerCallbackQuery({ text: msg, show_alert: true }).catch(() => {});
        }
        return showOrderDetail(u, order.id);
      }
      case "noop":
        return;
      default:
        return showHome(u);
    }
  });
}

function makeHandleText(runUi: RunUi) {
  return async (ctx: Context) =>
    runUi(ctx, async (u) => {
    const s = u.s;
    const text = ctx.message?.text ?? "";
    switch (s.awaiting) {
      case "amount": {
        const canonical = flow.parseAmount(s, text);
        if (canonical === null) {
          const c = s.draft!.leaf.chain;
          const decimals = c.amount_decimals ?? s.draft!.leaf.decimals ?? 0;
          await ctx.reply(
            u.t("amount.invalid", {
              min: rawToHuman(c.amount_min_raw ?? "1", decimals),
              max: rawToHuman(c.amount_max_raw ?? "1", decimals),
            }),
          );
          return;
        }
        s.awaiting = null;
        flow.setAmount(s, canonical);
        await deleteUserMessage(ctx);
        if (s.screen === "pay") await flow.loadPayChoices(s);
        return showCurrent(u);
      }
      case "dest": {
        const value = flow.normalizeDestination(s, text);
        if (!value || value.length > 128) {
          await ctx.reply(u.t("dest.invalid"));
          return;
        }
        s.awaiting = null;
        s.draft!.destination = value;
        s.screen = "pay";
        await deleteUserMessage(ctx);
        await flow.loadPayChoices(s);
        return showCurrent(u);
      }
      case "swaddr": {
        const value = text.trim();
        if (value.length < 8 || value.length > 128) {
          await ctx.reply(u.t("dest.invalid"));
          return;
        }
        s.awaiting = null;
        s.draft!.destination = value;
        await deleteUserMessage(ctx);
        if (flow.swapNeedsMemo(s)) {
          s.screen = "swmemo";
          return showCurrent(u);
        }
        s.screen = "pay";
        await flow.loadPayChoices(s);
        return showCurrent(u);
      }
      case "swmemo": {
        s.awaiting = null;
        s.draft!.destinationMemo = text.trim().slice(0, 32) || undefined;
        await deleteUserMessage(ctx);
        s.screen = "pay";
        await flow.loadPayChoices(s);
        return showCurrent(u);
      }
      case "swamount": {
        const parsed = flow.parseSwapAmount(text);
        if (!parsed) {
          await ctx.reply(u.t("swap.invalidAmount"), { parse_mode: "HTML" });
          return;
        }
        s.awaiting = null;
        const draft = s.draft!;
        draft.amountHuman = parsed.amount;
        draft.inputType = parsed.inputType;
        draft.inputSide = "from";
        await deleteUserMessage(ctx);
        s.screen = "quote";
        return showCurrent(u);
      }
      case "search": {
        const nav = flow.currentNav(s);
        if (!nav) return showHome(u);
        s.awaiting = null;
        nav.query = text.trim() || undefined;
        await deleteUserMessage(ctx);
        await flow.refreshLevel(s);
        return showBrowse(u);
      }
      default:
        await ctx.reply(u.t("input.useButtons"));
    }
  });
}

async function deleteUserMessage(ctx: Context) {
  try {
    await ctx.deleteMessage();
  } catch {
    // bot may lack delete rights; harmless
  }
}
