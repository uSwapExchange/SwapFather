/**
 * @B4UFatherBot — BotFather for shops.
 *
 * Mints and manages whitelabel tenant bots: paste a bot token, pick a brand
 * and categories, optionally set up affiliate payouts, and the bot goes live
 * in the fleet. See docs/b4ufather.md.
 *
 * English-only; same anchored-message UI discipline as the shop bots.
 */

import { Bot, type Context } from "grammy";
import { Bot as ProbeBot } from "grammy";
import {
  countTenantOrders,
  getFatherSession,
  getTenantByBotId,
  getTenantRow,
  insertTenant,
  listTenants,
  saveFatherSession,
  updateTenant,
} from "../lib/store.ts";
import { encryptSecret } from "../lib/crypto.ts";
import { getFamilies, type Family } from "../bot/catalog.ts";
import { productEmojiChar } from "../bot/emoji.ts";
import { btn, grid, markup, type Keyboard } from "../bot/keyboard.ts";
import { esc } from "../lib/format.ts";
import { logger } from "../lib/logger.ts";
import { setupBotProfile } from "../lib/telegram-profile.ts";
import { rowToTenant, type Fleet } from "../fleet/manager.ts";
import type { TenantMode } from "../tenant.ts";
import {
  affiliateEarnings,
  AffiliateError,
  registerAffiliate,
  updateAffiliatePayoutAddresses,
} from "./affiliate.ts";
import { formatEarningsUsd } from "./earnings.ts";

interface FDraft {
  mode?: TenantMode;
  /** AES-GCM ciphertext — the session row is plain JSON on disk. */
  botTokenEnc: string;
  botId: number;
  botUsername: string;
  botName: string;
  brand?: string;
  families?: string[];
  everything?: boolean;
  support?: string | null;
  code?: string;
  near?: string;
  xmr?: string;
  registered?: boolean;
  affiliateTokenEnc?: string;
}

interface FSession {
  messageId?: number;
  awaiting?:
    | "token"
    | "brand"
    | "support"
    | "code"
    | "near"
    | "xmr"
    | "editbrand"
    | "editwelcome"
    | "editsupport"
    | "pcode"
    | "pnear"
    | "pxmr"
    | null;
  draft?: FDraft;
  manageId?: number;
  editFamilies?: string[];
  /** Payout setup bound to an existing tenant (manage screen). */
  payout?: { code?: string; near?: string };
}

interface Fctx {
  ctx: Context;
  s: FSession;
  userId: number;
  chatId: number;
}

/** Guard-rail for the hosted fleet; admins are exempt. */
const MAX_BOTS_PER_OWNER = Number(process.env.MAX_BOTS_PER_OWNER ?? 10);

const admins = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter(Boolean);

export interface FatherOptions {
  /** Preset tenant mode (an alias bot that only mints swap bots). */
  presetMode?: TenantMode;
  /** Display name used in the factory's own copy (defaults per preset). */
  title?: string;
}

export function registerFather(bot: Bot, fleet: Fleet, opts: FatherOptions = {}) {
  const run = async (ctx: Context, fn: (f: Fctx) => Promise<void>) => {
    if (!ctx.from || !ctx.chat || ctx.chat.type !== "private") return;
    const s = getFatherSession<FSession>(ctx.from.id) ?? {};
    const f: Fctx = { ctx, s, userId: ctx.from.id, chatId: ctx.chat.id };
    try {
      await fn(f);
    } finally {
      saveFatherSession(f.userId, f.s);
    }
  };

  bot.command("start", (ctx) =>
    run(ctx, async (f) => {
      f.s.awaiting = null;
      f.s.draft = undefined;
      await show(f, home(), { newMessage: true });
    }),
  );

  bot.command("tenants", (ctx) =>
    run(ctx, async (f) => {
      if (!admins.includes(f.userId)) return;
      const rows = listTenants();
      const lines = rows.map((r) => {
        const orders = countTenantOrders(r.id);
        return `#${r.id} @${r.bot_username} — ${esc(r.brand_name)} · ${r.status} · ${orders.total} orders`;
      });
      await show(
        f,
        {
          text: `<b>Fleet</b>\n\n${lines.join("\n") || "No tenants yet."}`,
          keyboard: rows.map((r) => [btn(`Manage #${r.id} @${r.bot_username}`, `t:${r.id}`)]),
        },
        { newMessage: true },
      );
    }),
  );

  bot.on("callback_query:data", async (ctx) => {
    try {
      await handleCallback(ctx);
      await ctx.answerCallbackQuery().catch(() => {});
    } catch (err) {
      logger.error("father callback failed", {
        data: ctx.callbackQuery.data,
        err: String(err),
      });
      await ctx
        .answerCallbackQuery({ text: "⚠️ Something went wrong.", show_alert: false })
        .catch(() => {});
    }
  });

  bot.on("message:text", (ctx) =>
    run(ctx, async (f) => {
      const text = ctx.message!.text.trim();
      if (text.startsWith("/")) return;
      switch (f.s.awaiting) {
        case "token":
          return stepToken(f, text);
        case "brand": {
          if (!f.s.draft) return;
          f.s.draft.brand = text.slice(0, 48);
          f.s.awaiting = null;
          await deleteMsg(ctx);
          return showModeStep(f);
        }
        case "support": {
          if (!f.s.draft) return;
          f.s.draft.support = text.startsWith("@") ? text : `@${text}`;
          f.s.awaiting = null;
          return showConfirm(f);
        }
        case "code": {
          const code = text.toLowerCase().replace(/^@/, "");
          if (!/^[a-z0-9_-]{3,32}$/.test(code)) {
            await ctx.reply("Codes are 3–32 chars: a-z, 0-9, - or _. Try again:");
            return;
          }
          if (f.s.draft) f.s.draft.code = code;
          f.s.awaiting = "near";
          return show(f, nearPrompt("pl"));
        }
        case "near": {
          if (f.s.draft) f.s.draft.near = text;
          f.s.awaiting = "xmr";
          return show(f, xmrPrompt("ps"));
        }
        case "xmr": {
          if (f.s.draft) f.s.draft.xmr = text;
          f.s.awaiting = null;
          return doRegister(f);
        }
        case "editbrand": {
          const id = f.s.manageId;
          f.s.awaiting = null;
          if (id !== undefined && ownsTenant(f, id)) {
            updateTenant(id, { brand_name: text.slice(0, 48) });
            await reloadTenant(id);
          }
          return showManage(f, id!);
        }
        case "pcode": {
          const code = text.toLowerCase().replace(/^@/, "");
          if (!/^[a-z0-9_-]{3,32}$/.test(code)) {
            await ctx.reply("Codes are 3–32 chars: a-z, 0-9, - or _. Try again:");
            return;
          }
          f.s.payout = { ...(f.s.payout ?? {}), code };
          f.s.awaiting = "pnear";
          return show(f, nearPrompt(`t:${f.s.manageId}`));
        }
        case "pnear": {
          f.s.payout = { ...(f.s.payout ?? {}), near: text.trim() };
          f.s.awaiting = "pxmr";
          return show(f, xmrPrompt(`t:${f.s.manageId}`));
        }
        case "pxmr": {
          f.s.awaiting = null;
          return finishPayout(f, text.trim());
        }
        case "editwelcome": {
          const id = f.s.manageId;
          f.s.awaiting = null;
          if (id !== undefined && ownsTenant(f, id)) {
            const value = text.trim().toLowerCase() === "reset" ? null : text.slice(0, 300);
            updateTenant(id, { welcome_text: value });
            await reloadTenant(id);
          }
          return showManage(f, id!);
        }
        case "editsupport": {
          const id = f.s.manageId;
          f.s.awaiting = null;
          if (id !== undefined && ownsTenant(f, id)) {
            updateTenant(id, { support_handle: text.startsWith("@") ? text : `@${text}` });
            await reloadTenant(id);
          }
          return showManage(f, id!);
        }
        default:
          await ctx.reply("Use the buttons, or send /start.");
      }
    }),
  );

  // ---------- helpers bound to fleet ----------

  async function reloadTenant(id: number) {
    const row = getTenantRow(id);
    if (!row) return;
    if (row.status === "active") await fleet.spawn(rowToTenant(row));
    else await fleet.stop(id);
  }

  function ownsTenant(f: Fctx, id: number): boolean {
    const row = getTenantRow(id);
    if (!row || row.status === "deleted") return false;
    // 'banned' is an operator decision — owners can't manage their way out.
    if (row.status === "banned" && !admins.includes(f.userId)) return false;
    return row.owner_user_id === f.userId || admins.includes(f.userId);
  }

  async function handleCallback(ctx: Context) {
    await run(ctx, async (f) => {
      const data = ctx.callbackQuery!.data!;
      const [cmd = "", a = "", b = ""] = data.split(":");
      switch (cmd) {
        case "h":
          f.s.awaiting = null;
          f.s.draft = undefined;
          return show(f, home());
        case "w":
          return show(f, howItWorks());
        case "c": {
          f.s.draft = undefined;
          f.s.awaiting = "token";
          return show(f, {
            text: [
              "🤖 <b>Step 1 — your bot</b>",
              "",
              "1. Open @BotFather and send <code>/newbot</code>",
              "2. Pick a name and a username for your shop",
              "3. Paste the <b>bot token</b> here",
              "",
              "<i>The token stays encrypted and is only used to run your bot.</i>",
            ].join("\n"),
            keyboard: [[btn("‹ Cancel", "h", "danger")]],
          });
        }
        case "bd": {
          if (!f.s.draft) return;
          f.s.draft.brand = f.s.draft.botName.slice(0, 48);
          f.s.awaiting = null;
          return showModeStep(f);
        }
        case "mo": {
          if (!f.s.draft) return;
          f.s.draft.mode = a as TenantMode;
          if (a === "swap") return askSupport(f);
          return showCategories(f);
        }
        case "g": {
          if (!f.s.draft) return;
          const families = await getFamilies();
          const fam = families[Number(a)];
          if (!fam) return;
          const set = new Set(f.s.draft.families ?? []);
          if (set.has(fam.id)) set.delete(fam.id);
          else set.add(fam.id);
          f.s.draft.families = [...set];
          f.s.draft.everything = false;
          return showCategories(f);
        }
        case "ga": {
          if (!f.s.draft) return;
          f.s.draft.everything = true;
          f.s.draft.families = [];
          return showCategories(f);
        }
        case "gc": {
          if (!f.s.draft) return;
          if (!f.s.draft.everything && !(f.s.draft.families?.length)) {
            return ctx
              .answerCallbackQuery({ text: "Pick at least one category", show_alert: true })
              .catch(() => {}) as Promise<void>;
          }
          return askSupport(f);
        }
        case "ss":
          if (f.s.draft) f.s.draft.support = null;
          f.s.awaiting = null;
          return showConfirm(f);
        case "ps": {
          if (!f.s.draft) return;
          f.s.awaiting = "code";
          const def = f.s.draft.botUsername.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
          return show(f, {
            text: `💰 <b>Creator code</b>\n\nPick your unique creator code (this identifies your earnings).\nDefault: <code>${esc(def)}</code>`,
            keyboard: [[btn(`Use "${def}"`, "cd", "primary")], [btn("‹ Back", "pl")]],
          });
        }
        case "cd": {
          if (!f.s.draft) return;
          f.s.draft.code = f.s.draft.botUsername
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "")
            .slice(0, 32);
          f.s.awaiting = "near";
          return show(f, nearPrompt("pl"));
        }
        case "xs":
          // Compatibility for payout screens sent before XMR became required.
          f.s.awaiting = "xmr";
          return show(f, xmrPrompt("ps"));
        case "pl":
          f.s.awaiting = null;
          return showConfirm(f);
        case "L":
          return launch(f);
        case "m":
          return showMyBots(f);
        case "t":
          if (!ownsTenant(f, Number(a))) return;
          return showManage(f, Number(a));
        case "p": {
          const id = Number(a);
          if (!ownsTenant(f, id)) return;
          const row = getTenantRow(id)!;
          if (row.status !== "active" && row.status !== "paused") return;
          const next = row.status === "active" ? "paused" : "active";
          updateTenant(id, { status: next });
          await reloadTenant(id);
          return showManage(f, id);
        }
        case "eb":
          if (!ownsTenant(f, Number(a))) return;
          f.s.manageId = Number(a);
          f.s.awaiting = "editbrand";
          return show(f, {
            text: "✏️ Send the new brand name:",
            keyboard: [[btn("‹ Back", `t:${a}`)]],
          });
        case "ps2": {
          const id = Number(a);
          if (!ownsTenant(f, id)) return;
          f.s.manageId = id;
          const row = getTenantRow(id)!;
          if (row.creator_code && row.affiliate_token_enc) {
            f.s.payout = { code: row.creator_code };
            f.s.awaiting = "pnear";
            return show(f, nearPrompt(`t:${id}`));
          }
          f.s.payout = {};
          f.s.awaiting = "pcode";
          const def = row.bot_username.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
          return show(f, {
            text: [
              "💰 <b>Set up payouts</b>",
              "",
              "You earn a share of every sale your bot makes, paid straight to your own wallet.",
              "",
              `First, pick your <b>creator code</b> (identifies your earnings).\nDefault: <code>${esc(def)}</code>`,
            ].join("\n"),
            keyboard: [
              [btn(`Use "${def}"`, `pd:${id}`, "primary")],
              [btn("‹ Back", `t:${id}`)],
            ],
          });
        }
        case "pd": {
          const id = Number(a);
          if (!ownsTenant(f, id)) return;
          const row = getTenantRow(id)!;
          f.s.manageId = id;
          f.s.payout = {
            code: row.bot_username.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32),
          };
          f.s.awaiting = "pnear";
          return show(f, nearPrompt(`t:${id}`));
        }
        case "px": {
          // Compatibility for payout screens sent before XMR became required.
          const id = Number(a);
          if (!ownsTenant(f, id)) return;
          f.s.manageId = id;
          f.s.awaiting = "pxmr";
          return show(f, xmrPrompt(`t:${id}`));
        }
        case "ew":
          if (!ownsTenant(f, Number(a))) return;
          f.s.manageId = Number(a);
          f.s.awaiting = "editwelcome";
          return show(f, {
            text: "✏️ Send the welcome text your buyers see on the home screen (or send <code>reset</code> for the default):",
            keyboard: [[btn("‹ Back", `t:${a}`)]],
          });
        case "es":
          if (!ownsTenant(f, Number(a))) return;
          f.s.manageId = Number(a);
          f.s.awaiting = "editsupport";
          return show(f, {
            text: "💬 Send the new support @username:",
            keyboard: [[btn("‹ Back", `t:${a}`)]],
          });
        case "wl": {
          const id = Number(a);
          if (!ownsTenant(f, id)) return;
          const row = getTenantRow(id)!;
          f.s.awaiting = null;
          return show(f, {
            text: [
              `✨ <b>Fully white-label @${esc(row.bot_username)}</b>`,
              "",
              "Remove all visible uSwap branding so your customers see only your brand.",
              "",
              "<b>$20/month or $250 lifetime per bot</b>",
              "",
              `Contact @hiss and send them <code>@${esc(row.bot_username)}</code> to activate it.`,
              "",
              "<i>uSwap still powers payments and fulfillment behind the scenes.</i>",
              "",
              'Or, <a href="https://github.com/uSwapExchange/SwapFather">host it yourself for free</a> with the open-source SwapFather.',
            ].join("\n"),
            keyboard: [
              [{ text: "💬 Contact @hiss", url: "https://t.me/hiss" }],
              [{ text: "⌨️ Host it yourself — free", url: "https://github.com/uSwapExchange/SwapFather" }],
              [btn("‹ Back", `t:${id}`)],
            ],
          });
        }
        case "ec": {
          const id = Number(a);
          if (!ownsTenant(f, id)) return;
          const row = getTenantRow(id)!;
          f.s.manageId = id;
          f.s.editFamilies = row.families ? (JSON.parse(row.families) as string[]) : [];
          return showEditCategories(f, id);
        }
        case "gt": {
          const id = Number(a);
          if (!ownsTenant(f, id)) return;
          const families = await getFamilies();
          const fam = families[Number(b)];
          if (!fam) return;
          const set = new Set(f.s.editFamilies ?? []);
          if (set.has(fam.id)) set.delete(fam.id);
          else set.add(fam.id);
          f.s.editFamilies = [...set];
          return showEditCategories(f, id);
        }
        case "gta": {
          const id = Number(a);
          if (!ownsTenant(f, id)) return;
          f.s.editFamilies = [];
          updateTenant(id, { families: null });
          await reloadTenant(id);
          return showManage(f, id);
        }
        case "gs": {
          const id = Number(a);
          if (!ownsTenant(f, id)) return;
          const chosen = f.s.editFamilies ?? [];
          if (chosen.length === 0) {
            return ctx
              .answerCallbackQuery({ text: "Pick at least one category (or Everything)", show_alert: true })
              .catch(() => {}) as Promise<void>;
          }
          updateTenant(id, { families: JSON.stringify(chosen) });
          await reloadTenant(id);
          return showManage(f, id);
        }
        case "$": {
          const id = Number(a);
          if (!ownsTenant(f, id)) return;
          const row = getTenantRow(id)!;
          if (!row.affiliate_token_enc) {
            return ctx
              .answerCallbackQuery({
                text: "Payouts aren't set up for this bot yet.",
                show_alert: true,
              })
              .catch(() => {}) as Promise<void>;
          }
          const tenant = rowToTenant(row);
          try {
            const e = await affiliateEarnings(tenant.affiliateToken!);
            const sum = (e.summary ?? e) as Record<string, unknown>;
            const lines = [
              `💰 <b>Earnings — ${esc(row.brand_name)}</b>`,
              `<i>Creator code: ${esc(row.creator_code ?? "")}</i>`,
              "",
              `Referred sales:  <b>${Number(sum.referred_swaps ?? 0)}</b>`,
              `Referred volume:  <b>${formatEarningsUsd(sum.referred_volume_usd)}</b>`,
              "",
              `Your earnings:  <b>${formatEarningsUsd(sum.affiliate_amount_usd)}</b>`,
              `• Paid out:  ${formatEarningsUsd(sum.dispatched_amount_usd)}`,
              `• Pending:  ${formatEarningsUsd(sum.accrued_amount_usd)}`,
            ];
            const failed = Number(sum.failed_amount_usd ?? 0);
            if (failed > 0) lines.push(`• ⚠️ Failed payouts: ${formatEarningsUsd(failed)}`);
            if (Number(sum.referred_swaps ?? 0) === 0) {
              lines.push(
                "",
                `<i>Nothing yet — every sale through @${esc(row.bot_username)} counts once buyers arrive.</i>`,
              );
            }
            return show(f, {
              text: lines.join("\n"),
              keyboard: [
                [btn("✏️ Payout wallets", `ps2:${id}`)],
                [btn("‹ Back", `t:${id}`)],
              ],
            });
          } catch (err) {
            const msg = err instanceof AffiliateError ? err.message : "fetch failed";
            return ctx
              .answerCallbackQuery({ text: `⚠️ ${msg}`, show_alert: true })
              .catch(() => {}) as Promise<void>;
          }
        }
        case "d":
          if (!ownsTenant(f, Number(a))) return;
          return show(f, {
            text: "🗑 Remove this bot from the fleet? Its order history stays, but the bot stops responding.",
            keyboard: [
              [btn("🗑 Yes, remove it", `dc:${a}`, "danger")],
              [btn("‹ Back", `t:${a}`)],
            ],
          });
        case "dc": {
          const id = Number(a);
          if (!ownsTenant(f, id)) return;
          updateTenant(id, { status: "deleted" });
          await fleet.stop(id);
          return showMyBots(f);
        }
        default:
          return show(f, home());
      }
    });
  }

  // ---------- wizard steps ----------

  async function stepToken(f: Fctx, token: string) {
    await deleteMsg(f.ctx); // tokens are secrets — get them out of the chat
    if (!/^\d+:[\w-]{30,}$/.test(token)) {
      return show(f, {
        text: "That doesn't look like a bot token (format: <code>123456:ABC-…</code>). Paste the token from @BotFather:",
        keyboard: [[btn("‹ Cancel", "h", "danger")]],
      });
    }
    let me;
    try {
      me = await new ProbeBot(token).api.getMe();
    } catch {
      return show(f, {
        text: "⚠️ Telegram rejected that token. Double-check it in @BotFather (/mybots → API Token) and paste it again:",
        keyboard: [[btn("‹ Cancel", "h", "danger")]],
      });
    }
    const owned = listTenants({ ownerUserId: f.userId });
    if (owned.length >= MAX_BOTS_PER_OWNER && !admins.includes(f.userId)) {
      return show(f, {
        text: `⚠️ You've reached the limit of ${MAX_BOTS_PER_OWNER} bots. Remove one first, or contact support.`,
        keyboard: [[btn("📋 My bots", "m")], [btn("‹ Cancel", "h", "danger")]],
      });
    }
    try {
      const hook = (await new ProbeBot(token).api.getWebhookInfo()) as {
        url?: string;
      };
      if (hook.url) {
        return show(f, {
          text: "⚠️ That bot already has a webhook set — it's running somewhere else. Delete the webhook (or use a fresh bot from @BotFather) and try again.",
          keyboard: [[btn("‹ Cancel", "h", "danger")]],
        });
      }
    } catch {
      // getWebhookInfo is advisory; a failure shouldn't block onboarding
    }
    if (getTenantByBotId(me.id)) {
      return show(f, {
        text: `⚠️ @${me.username} is already enrolled. Manage it under 📋 My bots, or paste a different token.`,
        keyboard: [[btn("📋 My bots", "m")], [btn("‹ Cancel", "h", "danger")]],
      });
    }
    f.s.draft = {
      botTokenEnc: encryptSecret(token),
      botId: me.id,
      botUsername: me.username,
      botName: me.first_name,
    };
    f.s.awaiting = "brand";
    return show(f, {
      text: [
        `✅ Found <b>@${esc(me.username)}</b>`,
        "",
        "🏷 <b>Step 2 — brand name</b>",
        `Shown on every screen. Use "${esc(me.first_name)}", or type a different name:`,
      ].join("\n"),
      keyboard: [
        [btn(`Use "${me.first_name.slice(0, 24)}"`, "bd", "primary")],
        [btn("‹ Cancel", "h", "danger")],
      ],
    });
  }

  function nearPrompt(backTo: string): FScreen {
    return {
      text: [
        "💰 <b>NEAR payout account</b>",
        "",
        "Send the <b>NEAR account ID</b> that should receive your earnings.",
        "",
        "This may be a named account such as <code>yourname.near</code> or a longer account ID supplied by your wallet.",
        "",
        "🆕 <b>Need a NEAR account?</b>",
        "Choose a wallet from NEAR's official wallet directory, create an account, then copy its NEAR account ID here.",
        "",
        "<i>near.com changed its onboarding and may not create a named .near account. Named .near accounts still exist.</i>",
      ].join("\n"),
      keyboard: [
        [{ text: "🌈 Choose a NEAR wallet", url: "https://wallet.near.org" }],
        [btn("‹ Back", backTo)],
      ],
    };
  }

  function xmrPrompt(backTo: string): FScreen {
    return {
      text: [
        "💰 <b>Monero payout address</b>",
        "",
        "Send the <b>XMR address</b> that should receive your earnings.",
        "",
        "<b>Both NEAR and XMR payout destinations are required.</b> The payout engine needs both before creator fees can be attached to your sales.",
      ].join("\n"),
      keyboard: [[btn("‹ Back", backTo)]],
    };
  }

  /** Register payouts or update their destinations for an existing tenant. */
  async function finishPayout(f: Fctx, xmr: string) {
    const id = f.s.manageId;
    const p = f.s.payout;
    f.s.payout = undefined;
    if (id === undefined || !ownsTenant(f, id) || !p?.code || !p.near || !xmr) {
      return id === undefined ? show(f, home()) : showManage(f, id);
    }
    const row = getTenantRow(id)!;
    try {
      if (row.affiliate_token_enc) {
        const tenant = rowToTenant(row);
        if (!tenant.affiliateToken) {
          throw new AffiliateError("missing_token", "Affiliate access token is unavailable.");
        }
        await updateAffiliatePayoutAddresses(tenant.affiliateToken, {
          nearAccount: p.near,
          xmrAddress: xmr,
        });
      } else {
        const reg = await registerAffiliate({
          username: p.code,
          displayName: row.brand_name,
          nearAccount: p.near,
          xmrAddress: xmr,
        });
        updateTenant(id, {
          creator_code: p.code,
          affiliate_token_enc: reg.token ? encryptSecret(reg.token) : null,
        });
      }
      await reloadTenant(id);
      return show(f, {
        text: [
          "✅ <b>Payouts are live.</b>",
          "",
          `Creator code: <code>${esc(p.code)}</code>`,
          "NEAR and XMR payout destinations are connected.",
          "You now earn a share of every sale this bot makes, paid to your wallet automatically.",
        ].join("\n"),
        keyboard: [[btn("‹ Back to bot", `t:${id}`)]],
      });
    } catch (err) {
      const msg = err instanceof AffiliateError ? err.message : "payout setup failed";
      return show(f, {
        text: `⚠️ Payout setup failed: ${esc(msg)}\n\nCheck both payout addresses and try again.`,
        keyboard: [
          [btn("🔁 Try again", `ps2:${id}`)],
          [btn("‹ Back", `t:${id}`)],
        ],
      });
    }
  }

  async function showModeStep(f: Fctx) {
    if (opts.presetMode) {
      f.s.draft!.mode = opts.presetMode;
      if (opts.presetMode === "swap") return askSupport(f);
      return showCategories(f);
    }
    return show(f, {
      text: [
        "🧭 <b>Step 3 — what kind of bot?</b>",
        "",
        "🛍 <b>Shop</b> — sell digital products (gift cards, Stars, Nitro, VPN…)",
        "🔄 <b>Swap</b> — a crypto exchange bot: any coin → any coin",
        "Or both in one bot.",
      ].join("\n"),
      keyboard: [
        [btn("🛍 Shop", "mo:shop"), btn("🔄 Swap", "mo:swap")],
        [btn("🛍 + 🔄 Both", "mo:both", "primary")],
        [btn("‹ Cancel", "h", "danger")],
      ],
    });
  }

  async function askSupport(f: Fctx) {
    f.s.awaiting = "support";
    return show(f, {
      text: "💬 <b>Support contact</b>\n\nSend the @username your buyers should contact for help, or skip to use uSwap support (@maintenance).",
      keyboard: [[btn("⏭ Skip", "ss")]],
    });
  }

  async function showCategories(f: Fctx) {
    const d = f.s.draft!;
    const families = await getFamilies();
    const chosen = new Set(d.families ?? []);
    const toggles = families.map((fam: Family, i: number) =>
      btn(
        `${chosen.has(fam.id) ? "✅" : "○"} ${productEmojiChar(fam.id)} ${fam.name}`,
        `g:${i}`,
      ),
    );
    const keyboard: Keyboard = [
      [btn(d.everything ? "✅ 🛍 Everything" : "🛍 Everything", "ga", d.everything ? "primary" : undefined)],
      ...grid(toggles, 2),
      [btn("Continue ›", "gc", "success")],
      [btn("‹ Cancel", "h", "danger")],
    ];
    return show(f, {
      text: [
        "🗂 <b>Step 3 — what do you sell?</b>",
        "",
        "Sell the whole catalog, or make a niche bot — a Mullvad-only VPN shop, a Discord-only store, gift cards only… Your bot's home screen adapts: one category means your bot opens straight into it.",
      ].join("\n"),
      keyboard,
    });
  }

  async function showConfirm(f: Fctx) {
    const d = f.s.draft!;
    const families = await getFamilies();
    const cats = d.everything || !d.families?.length
      ? "Everything"
      : families
          .filter((x) => d.families!.includes(x.id))
          .map((x) => x.name)
          .join(", ");
    const mode = d.mode ?? "shop";
    const modeLabel = mode === "shop" ? "🛍 Shop" : mode === "swap" ? "🔄 Swap" : "🛍 Shop + 🔄 Swap";
    const lines = [
      "🚀 <b>Ready to launch</b>",
      "",
      `Bot: @${esc(d.botUsername)}`,
      `Brand: <b>${esc(d.brand ?? d.botName)}</b>`,
      `Type: ${modeLabel}`,
      ...(mode === "swap" ? [] : [`Catalog: ${esc(cats)}`]),
      `Support: ${esc(d.support ?? "@maintenance")}`,
      `Payouts: ${d.registered ? `✅ code <code>${esc(d.code ?? "")}</code>` : "not set up — you can add them later"}`,
    ];
    const keyboard: Keyboard = [[btn("🚀 Launch my bot", "L", "success")]];
    if (!d.registered) keyboard.push([btn("💰 Set up payouts (optional)", "ps")]);
    keyboard.push([btn("‹ Cancel", "h", "danger")]);
    return show(f, { text: lines.join("\n"), keyboard });
  }

  async function doRegister(f: Fctx) {
    const d = f.s.draft!;
    if (!d.code || !d.near || !d.xmr) return showConfirm(f);
    try {
      const reg = await registerAffiliate({
        username: d.code,
        displayName: d.brand ?? d.botName,
        nearAccount: d.near,
        xmrAddress: d.xmr,
      });
      d.registered = true;
      d.affiliateTokenEnc = reg.token ? encryptSecret(reg.token) : undefined;
      return showConfirm(f);
    } catch (err) {
      const msg = err instanceof AffiliateError ? err.message : "registration failed";
      return show(f, {
        text: `⚠️ Payout setup failed: ${esc(msg)}\n\nCheck the creator code and both payout addresses, or launch now and add payouts later.`,
        keyboard: [
          [btn("🔁 Try again", "ps")],
          [btn("🚀 Launch without payouts", "L", "success")],
          [btn("‹ Cancel", "h", "danger")],
        ],
      });
    }
  }

  async function launch(f: Fctx) {
    const d = f.s.draft;
    if (!d) return show(f, home());
    const tenantId = insertTenant({
      mode: d.mode ?? "shop",
      botId: d.botId,
      botUsername: d.botUsername,
      botTokenEnc: d.botTokenEnc,
      ownerUserId: f.userId,
      brandName: d.brand ?? d.botName,
      supportHandle: d.support ?? null,
      families: d.everything || !d.families?.length ? null : d.families,
      creatorCode: d.registered ? (d.code ?? null) : null,
      affiliateTokenEnc: d.affiliateTokenEnc ?? null,
    });
    const tenant = rowToTenant(getTenantRow(tenantId)!);
    await fleet.spawn(tenant);
    setupBotProfile(fleet.apiFor(tenantId)!, tenant.brandName).catch((err) =>
      logger.warn("tenant profile setup failed", { tenantId, err: String(err) }),
    );
    f.s.draft = undefined;
    logger.info("tenant launched", { tenantId, bot: tenant.botUsername, owner: f.userId });
    return show(f, {
      text: [
        `🎉 <b>@${esc(tenant.botUsername)} is live!</b>`,
        "",
        `Your shop: https://t.me/${tenant.botUsername}`,
        "",
        "💡 Tips:",
        "• Send /setinline to @BotFather for your bot to enable shareable product cards",
        "• Set a profile photo in @BotFather to complete the brand",
        `• Manage it anytime under 📋 My bots`,
      ].join("\n"),
      keyboard: [[btn("📋 My bots", "m")], [btn("🏠 Home", "h")]],
    });
  }

  // ---------- management ----------

  async function showMyBots(f: Fctx) {
    const rows = listTenants({ ownerUserId: f.userId });
    if (rows.length === 0) {
      return show(f, {
        text: "You don't have a bot yet — create one in under a minute.",
        keyboard: [[btn("🤖 Create my bot", "c", "success")], [btn("🏠 Home", "h")]],
      });
    }
    return show(f, {
      text: "<b>Your bots</b>",
      keyboard: [
        ...rows.map((r) => [
          btn(`${r.status === "active" ? "🟢" : "⏸"} @${r.bot_username} — ${r.brand_name}`, `t:${r.id}`),
        ]),
        [btn("🤖 Create another", "c")],
        [btn("🏠 Home", "h")],
      ],
    });
  }

  async function showManage(f: Fctx, id: number) {
    const row = getTenantRow(id);
    if (!row) return showMyBots(f);
    const families = row.families ? (JSON.parse(row.families) as string[]) : null;
    const orders = countTenantOrders(id);
    const mode = (row.mode as TenantMode) || "shop";
    const lines = [
      `<b>@${esc(row.bot_username)}</b> — ${esc(row.brand_name)}`,
      "",
      `Status: ${row.status === "active" ? "🟢 live" : "⏸ paused"}`,
      `Type: ${mode === "shop" ? "🛍 Shop" : mode === "swap" ? "🔄 Swap" : "🛍 + 🔄 Both"}`,
      ...(mode === "swap" ? [] : [`Catalog: ${families ? esc(families.join(", ")) : "Everything"}`]),
      `Support: ${esc(row.support_handle ?? "@maintenance")}`,
      `Welcome: ${row.welcome_text ? "✏️ custom" : "default"}`,
      `Payouts: ${row.creator_code ? `✅ <code>${esc(row.creator_code)}</code>` : "not set up"}`,
      `Orders: ${orders.total} (${orders.completed} delivered)`,
    ];
    const keyboard: Keyboard = [
      [btn(row.status === "active" ? "⏸ Pause" : "▶️ Resume", `p:${id}`, row.status === "active" ? "danger" : "success")],
      [btn("✏️ Brand", `eb:${id}`), btn("🗂 Catalog", `ec:${id}`)],
      [btn("📝 Welcome", `ew:${id}`), btn("💬 Support", `es:${id}`)],
      row.creator_code
        ? [btn("💰 Earnings", `$:${id}`), btn("✏️ Payout wallets", `ps2:${id}`)]
        : [btn("💰 Set up payouts — earn on every sale", `ps2:${id}`, "success")],
      [btn("✨ Remove uSwap branding", `wl:${id}`, "primary")],
      [btn("🗑 Remove", `d:${id}`, "danger")],
      [btn("‹ Back", "m")],
    ];
    return show(f, { text: lines.join("\n"), keyboard });
  }

  async function showEditCategories(f: Fctx, id: number) {
    const families = await getFamilies();
    const chosen = new Set(f.s.editFamilies ?? []);
    const toggles = families.map((fam, i) =>
      btn(`${chosen.has(fam.id) ? "✅" : "○"} ${productEmojiChar(fam.id)} ${fam.name}`, `gt:${id}:${i}`),
    );
    return show(f, {
      text: "🗂 <b>Catalog</b> — toggle what this bot sells:",
      keyboard: [
        [btn("🛍 Everything", `gta:${id}`)],
        ...grid(toggles, 2),
        [btn("💾 Save", `gs:${id}`, "success")],
        [btn("‹ Back", `t:${id}`)],
      ],
    });
  }

  // ---------- rendering ----------

  interface FScreen {
    text: string;
    keyboard: Keyboard;
  }

  function home(): FScreen {
    const title = esc(opts.title ?? (opts.presetMode === "swap" ? "SwapFather" : "B4UFather"));
    const text =
      opts.presetMode === "swap"
        ? [
            `🔄 <b>${title}</b> — mint your own swap bot`,
            "",
            "Launch a crypto exchange bot under <b>your brand</b> in under a minute: any coin for any coin, 50+ currencies, fulfilled by uSwap's swap engine.",
            "",
            "You bring the audience; we run the engine. You earn on every swap.",
          ]
        : [
            `🤖 <b>${title}</b> — mint your own crypto bot`,
            "",
            "Launch a swap bot (any coin for any coin, 50+ currencies), a Telegram store (gift cards, Stars & Premium, Discord Nitro, VPN time, prepaid cards), or both — under <b>your brand</b>, live in under a minute, fulfilled by uSwap.",
            "",
            "Go broad or niche: a VPN-only shop, a Discord-only store, a pure exchange. You bring the audience; we run the engine. You earn on every sale.",
          ];
    return {
      text: text.join("\n"),
      keyboard: [
        [btn("🤖 Create my bot", "c", "success")],
        [btn("📋 My bots", "m"), btn("❓ How it works", "w")],
      ],
    };
  }

  function howItWorks(): FScreen {
    const step2 =
      opts.presetMode === "swap"
        ? "2️⃣ Pick a brand name — your bot swaps 50+ coins out of the box"
        : "2️⃣ Pick a brand name and what to sell (products, swaps, or both)";
    return {
      text: [
        "<b>How it works</b>",
        "",
        "1️⃣ Make a bot in @BotFather and paste its token here",
        step2,
        "3️⃣ Your bot goes live instantly — hosted for you",
        "4️⃣ Set up payouts to earn a share of every sale (paid in NEAR/XMR)",
        "",
        "🔒 You never touch customer funds — payments and delivery run on uSwap's engine. You can pause, rebrand or refocus your bot anytime.",
      ].join("\n"),
      keyboard: [[btn("🤖 Create my bot", "c", "success")], [btn("🏠 Home", "h")]],
    };
  }

  async function show(f: Fctx, screen: FScreen, opts: { newMessage?: boolean } = {}) {
    const payload = {
      parse_mode: "HTML" as const,
      reply_markup: markup(screen.keyboard) as never,
      link_preview_options: { is_disabled: true },
    };
    if (!opts.newMessage && f.s.messageId) {
      try {
        await f.ctx.api.editMessageText(f.chatId, f.s.messageId, screen.text, payload);
        return;
      } catch (err) {
        if (String(err).includes("message is not modified")) return;
      }
    }
    const sent = await f.ctx.api.sendMessage(f.chatId, screen.text, payload);
    f.s.messageId = sent.message_id;
  }

  async function deleteMsg(ctx: Context) {
    await ctx.deleteMessage().catch(() => {});
  }
}
