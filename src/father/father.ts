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
import { affiliateEarnings, AffiliateError, registerAffiliate } from "./affiliate.ts";

interface FDraft {
  botToken: string;
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
  affiliateToken?: string;
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
    | "editsupport"
    | null;
  draft?: FDraft;
  manageId?: number;
  editFamilies?: string[];
}

interface Fctx {
  ctx: Context;
  s: FSession;
  userId: number;
  chatId: number;
}

const admins = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter(Boolean);

export function registerFather(bot: Bot, fleet: Fleet) {
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
          return showCategories(f);
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
          return show(f, {
            text: "💰 <b>Payout account</b>\n\nSend the <b>NEAR account</b> that should receive your earnings (e.g. <code>yourname.near</code>). Required by uSwap's affiliate program.",
            keyboard: [[btn("‹ Back", "pl")]],
          });
        }
        case "near": {
          if (f.s.draft) f.s.draft.near = text;
          f.s.awaiting = "xmr";
          return show(f, {
            text: "Optional: send a <b>Monero (XMR) address</b> for payouts too, or skip.",
            keyboard: [[btn("⏭ Skip", "xs")]],
          });
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
    return Boolean(row && (row.owner_user_id === f.userId || admins.includes(f.userId)));
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
          f.s.awaiting = "support";
          return show(f, {
            text: "💬 <b>Support contact</b>\n\nSend the @username your buyers should contact for help, or skip to use uSwap support.",
            keyboard: [[btn("⏭ Skip", "ss")]],
          });
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
          return show(f, {
            text: "💰 <b>Payout account</b>\n\nSend the <b>NEAR account</b> that should receive your earnings (e.g. <code>yourname.near</code>).",
            keyboard: [[btn("‹ Back", "pl")]],
          });
        }
        case "xs":
          f.s.awaiting = null;
          return doRegister(f);
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
        case "es":
          if (!ownsTenant(f, Number(a))) return;
          f.s.manageId = Number(a);
          f.s.awaiting = "editsupport";
          return show(f, {
            text: "💬 Send the new support @username:",
            keyboard: [[btn("‹ Back", `t:${a}`)]],
          });
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
            const summary = JSON.stringify(e.summary ?? e, null, 0).slice(0, 800);
            return show(f, {
              text: `💰 <b>Earnings — ${esc(row.brand_name)}</b>\n\n<code>${esc(summary)}</code>`,
              keyboard: [[btn("‹ Back", `t:${id}`)]],
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
    if (getTenantByBotId(me.id)) {
      return show(f, {
        text: `⚠️ @${me.username} is already enrolled. Manage it under 📋 My bots, or paste a different token.`,
        keyboard: [[btn("📋 My bots", "m")], [btn("‹ Cancel", "h", "danger")]],
      });
    }
    f.s.draft = {
      botToken: token,
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
    const lines = [
      "🚀 <b>Ready to launch</b>",
      "",
      `Bot: @${esc(d.botUsername)}`,
      `Brand: <b>${esc(d.brand ?? d.botName)}</b>`,
      `Catalog: ${esc(cats)}`,
      `Support: ${esc(d.support ?? "uSwap support")}`,
      `Payouts: ${d.registered ? `✅ code <code>${esc(d.code ?? "")}</code>` : "not set up — you can add them later"}`,
    ];
    const keyboard: Keyboard = [[btn("🚀 Launch my bot", "L", "success")]];
    if (!d.registered) keyboard.push([btn("💰 Set up payouts first", "ps")]);
    keyboard.push([btn("‹ Cancel", "h", "danger")]);
    return show(f, { text: lines.join("\n"), keyboard });
  }

  async function doRegister(f: Fctx) {
    const d = f.s.draft!;
    if (!d.code || !d.near) return showConfirm(f);
    try {
      const reg = await registerAffiliate({
        username: d.code,
        displayName: d.brand ?? d.botName,
        nearAccount: d.near,
        xmrAddress: d.xmr,
      });
      d.registered = true;
      d.affiliateToken = reg.token ?? undefined;
      return showConfirm(f);
    } catch (err) {
      const msg = err instanceof AffiliateError ? err.message : "registration failed";
      return show(f, {
        text: `⚠️ Payout setup failed: ${esc(msg)}\n\nYou can try a different code, or launch now and add payouts later.`,
        keyboard: [
          [btn("🔁 Try another code", "ps")],
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
      botId: d.botId,
      botUsername: d.botUsername,
      botTokenEnc: encryptSecret(d.botToken),
      ownerUserId: f.userId,
      brandName: d.brand ?? d.botName,
      supportHandle: d.support ?? null,
      families: d.everything || !d.families?.length ? null : d.families,
      creatorCode: d.registered ? (d.code ?? null) : null,
      affiliateTokenEnc: d.affiliateToken ? encryptSecret(d.affiliateToken) : null,
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
    const lines = [
      `<b>@${esc(row.bot_username)}</b> — ${esc(row.brand_name)}`,
      "",
      `Status: ${row.status === "active" ? "🟢 live" : "⏸ paused"}`,
      `Catalog: ${families ? esc(families.join(", ")) : "Everything"}`,
      `Support: ${esc(row.support_handle ?? "uSwap support")}`,
      `Payouts: ${row.creator_code ? `✅ <code>${esc(row.creator_code)}</code>` : "not set up"}`,
      `Orders: ${orders.total} (${orders.completed} delivered)`,
    ];
    const keyboard: Keyboard = [
      [btn(row.status === "active" ? "⏸ Pause" : "▶️ Resume", `p:${id}`, row.status === "active" ? "danger" : "success")],
      [btn("✏️ Brand", `eb:${id}`), btn("🗂 Catalog", `ec:${id}`)],
      [btn("💬 Support", `es:${id}`), btn("💰 Earnings", `$:${id}`)],
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
    return {
      text: [
        "🤖 <b>B4UFather</b> — mint your own crypto shop bot",
        "",
        "Launch a Telegram store under <b>your brand</b> in under a minute: gift cards, Telegram Stars & Premium, Discord Nitro, VPN time, prepaid cards — all paid in crypto, fulfilled by uSwap.",
        "",
        "Sell everything, or run a niche bot (VPN-only, Discord-only, gift cards only). You bring the audience; we run the engine. You earn on every sale.",
      ].join("\n"),
      keyboard: [
        [btn("🤖 Create my bot", "c", "success")],
        [btn("📋 My bots", "m"), btn("❓ How it works", "w")],
      ],
    };
  }

  function howItWorks(): FScreen {
    return {
      text: [
        "<b>How it works</b>",
        "",
        "1️⃣ Make a bot in @BotFather and paste its token here",
        "2️⃣ Pick a brand name and which categories to sell",
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
