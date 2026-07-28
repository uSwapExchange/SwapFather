/**
 * Order status poller.
 *
 * Polls active orders against GET /v1/intents/{id} and pushes progress into
 * each order's anchored deposit message. On completion it fetches the
 * digital-delivery vault and sends a celebratory delivery message.
 *
 * (Webhooks would remove the polling; they need a public HTTPS endpoint,
 * which an open-source bot can't assume. Polling every few seconds against
 * the partner API is well within budget for a bot-sized order volume.)
 */

import type { Api } from "grammy";
import {
  getOrder,
  getUserLangRow,
  listActiveOrders,
  markOrderDeliveredNotified,
  setOrderQrMessage,
  updateOrderIntent,
  updateOrderStatus,
  type OrderRow,
} from "../lib/store.ts";
import { getTranslator, resolveLanguage } from "../i18n/index.ts";
import { uswap } from "../uswap/client.ts";
import * as screens from "./screens.ts";
import { markup } from "./keyboard.ts";
import { copyBtn, btn } from "./keyboard.ts";
import { esc } from "../lib/format.ts";
import { logger } from "../lib/logger.ts";

const POLL_INTERVAL_MS = 8_000;
/** Telegram message effect: confetti 🎉 (private chats only). */
const EFFECT_CONFETTI = "5046509860389126442";

function translatorForOrder(order: OrderRow) {
  const row = getUserLangRow(order.tenant_id, order.user_id);
  const lang = row?.language ?? resolveLanguage(row?.tg_language_code ?? undefined);
  return getTranslator(lang);
}

/** Resolves the Api handle for a tenant — undefined when the bot is paused. */
export type ApiResolver = (tenantId: number) => Api | undefined;

export function startPoller(getApi: ApiResolver) {
  let inFlight = false;
  setInterval(() => {
    // A slow cycle must not stack: overlapping sweeps double-notify.
    if (inFlight) return;
    inFlight = true;
    void pollOnce(getApi)
      .catch((err) => logger.error("poll cycle failed", { err: String(err) }))
      .finally(() => {
        inFlight = false;
      });
  }, POLL_INTERVAL_MS);
  logger.info("order poller started", { intervalMs: POLL_INTERVAL_MS });
}

async function pollOnce(getApi: ApiResolver) {
  const active = listActiveOrders();
  for (const order of active) {
    const api = getApi(order.tenant_id);
    if (!api) continue; // tenant paused/removed — resume when it's back
    try {
      await checkOrderNow(api, order);
    } catch (err) {
      logger.warn("order poll failed", { orderId: order.id, err: String(err) });
    }
  }
}

/** Poll a single order immediately (also used by the Refresh button). */
export async function checkOrderNow(api: Api, order: OrderRow): Promise<void> {
  const { intent } = await uswap.getIntent(order.intent_id);

  // Late deposits replace expired intents with a market intent — follow it.
  if (intent.status === "expired" && intent.replaced_by_intent_id) {
    updateOrderIntent(order.id, intent.replaced_by_intent_id);
    order.intent_id = intent.replaced_by_intent_id;
    return checkOrderNow(api, order);
  }

  if (intent.status === order.status) return;
  const previous = order.status;
  updateOrderStatus(order.id, intent.status);
  order.status = intent.status;
  logger.info("order status", {
    orderId: order.id,
    from: previous,
    to: intent.status,
  });

  // Payment was seen → the QR served its purpose.
  if (previous === "awaiting_deposit" && order.qr_message_id) {
    await api.deleteMessage(order.chat_id, order.qr_message_id).catch(() => {});
    setOrderQrMessage(order.id, null);
  }

  const t = translatorForOrder(order);

  // Update the anchored deposit/status message in place.
  if (order.message_id) {
    const screen =
      order.status === "awaiting_deposit"
        ? screens.renderDeposit(t, {
            orderId: order.id,
            productLabel: order.product_label,
            amountHuman: order.deposit_amount ?? "",
            paySymbol: order.deposit_asset ?? "",
            // pay_label is "SYMBOL (Network)" — recover the network name.
            payNetworkName: order.pay_label.match(/\(([^)]+)\)\s*$/)?.[1] ?? "",
            address: order.deposit_address ?? "",
            memo: order.deposit_memo,
            expiresAt: order.expires_at,
            status: order.status,
            offerRefund: Boolean(order.pay_asset_v1 && !order.refund_set),
          })
        : screens.renderOrderDetail(t, getOrder(order.id)!, null);
    await api
      .editMessageText(order.chat_id, order.message_id, screen.text, {
        parse_mode: "HTML",
        reply_markup: markup(screen.keyboard) as never,
        link_preview_options: { is_disabled: true },
      })
      .catch(() => {});
  }

  if (order.status === "completed" && !order.delivered_notified) {
    await notifyDelivered(api, order, t);
  } else if (["failed", "refunded"].includes(order.status)) {
    await api
      .sendMessage(
        order.chat_id,
        t("order.failedBody", { id: `#${order.id}` }),
        { parse_mode: "HTML" },
      )
      .catch(() => {});
  } else if (order.status === "expired") {
    await api
      .sendMessage(
        order.chat_id,
        t("order.expiredBody", { id: `#${order.id}` }),
        { parse_mode: "HTML" },
      )
      .catch(() => {});
  }
}

async function notifyDelivered(
  api: Api,
  order: OrderRow,
  t: ReturnType<typeof getTranslator>,
) {
  let vaultLines = "";
  const keyboard: ReturnType<typeof markup>["inline_keyboard"] = [];
  try {
    const vault = await uswap.getDigitalDelivery(order.bridge_id, order.intent_id);
    for (const item of vault.items) {
      vaultLines += `\n\n<b>${esc(item.label)}</b>`;
      for (const f of item.fields ?? []) {
        vaultLines += `\n${esc(f.label)}: <tg-spoiler><code>${esc(f.value)}</code></tg-spoiler>`;
      }
      for (const f of (item.fields ?? []).filter((x) => x.copy)) {
        keyboard.push([copyBtn(`📋 ${f.label}`, f.value)]);
      }
    }
  } catch (err) {
    logger.warn("vault fetch on completion failed", {
      orderId: order.id,
      err: String(err),
    });
  }
  keyboard.push([btn(t("btn.orders"), "or")]);

  const text =
    t("order.completedBody", { product: esc(order.product_label) }) +
    vaultLines +
    (vaultLines ? `\n\n${t("order.deliveryHint")}` : "");

  const payload = {
    parse_mode: "HTML" as const,
    reply_markup: { inline_keyboard: keyboard } as never,
  };
  try {
    await api.sendMessage(order.chat_id, text, {
      ...payload,
      message_effect_id: EFFECT_CONFETTI,
    } as never);
  } catch {
    await api.sendMessage(order.chat_id, text, payload).catch(() => {});
  }
  markOrderDeliveredNotified(order.id);
}
