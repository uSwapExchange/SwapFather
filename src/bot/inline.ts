/**
 * Inline mode: type @BestB4UBot <query> in ANY chat to share a product card.
 *
 * Cards carry a deep-link button back into the bot, so inline mode is the
 * bot's sharing/viral surface: results are product ads, purchases always
 * happen in the private chat. Requires inline mode enabled via @BotFather
 * (/setinline) — without it Telegram never sends inline_query updates.
 */

import type { Bot } from "grammy";
import type { Tenant } from "../tenant.ts";
import { uswap } from "../uswap/client.ts";
import type { LevelDrill, LevelSegment } from "../uswap/types.ts";
import { logger } from "../lib/logger.ts";
import { esc } from "../lib/format.ts";

const IMG = "https://app.uswap.net";

interface InlineProduct {
  id: string;
  title: string;
  description: string;
  thumb: string;
  /** /start deep-link payload (A-Za-z0-9_- only, ≤64 chars). */
  payload: string;
  emoji: string;
  /** Catalog family this card belongs to (for tenant filtering). */
  family: string;
}

/** Evergreen showcase shown for an empty query. */
const SHOWCASE: InlineProduct[] = [
  {
    id: "gift-card",
    family: "gift-card",
    title: "Gift Cards",
    description: "Amazon, Apple, Netflix, Xbox +30 more · up to 5% off · pay with crypto",
    thumb: `${IMG}/gift-card-placeholder.png`,
    payload: "gift-card",
    emoji: "🎁",
  },
  {
    id: "tg-stars",
    family: "telegram",
    title: "Telegram Stars",
    description: "Top up any account · from 50 ⭐ · pay with crypto",
    thumb: `${IMG}/stars.png`,
    payload: "telegram",
    emoji: "⭐️",
  },
  {
    id: "tg-premium",
    family: "telegram",
    title: "Telegram Premium",
    description: "3, 6 or 12 months · gift to anyone · pay with crypto",
    thumb: `${IMG}/Telegram_Premium.png`,
    payload: "telegram",
    emoji: "🌟",
  },
  {
    id: "nitro",
    family: "discord",
    title: "Discord Nitro",
    description: "Nitro gifts, server boosts & OG usernames · pay with crypto",
    thumb: `${IMG}/Nitro.png`,
    payload: "discord",
    emoji: "🚀",
  },
  {
    id: "prepaid",
    family: "prepaid-card",
    title: "Prepaid Cards",
    description: "Visa & Mastercard, 160+ countries · $10–$5000 · pay with crypto",
    thumb: `${IMG}/debit_card.png`,
    payload: "prepaid-card",
    emoji: "💳",
  },
  {
    id: "mullvad",
    family: "mullvad",
    title: "Mullvad VPN",
    description: "1–24 months of VPN time · no account needed · pay with crypto",
    thumb: `${IMG}/mullvad.png`,
    payload: "mullvad",
    emoji: "🛡",
  },
];

// ---- gift-card brand search (server-side) ----

let countrySegment: LevelSegment | null = null;

/** The gift-card catalog currently has a single country level — cache its segment. */
export async function getGiftCardCountrySegment(): Promise<LevelSegment | null> {
  if (countrySegment) return countrySegment;
  try {
    const root = await uswap.level({
      path: { asset: "gift-card", segments: [] },
      side: "to",
    });
    const first = root.items.find((i): i is LevelDrill => i.kind === "drill");
    countrySegment = first?.node.segment ?? null;
  } catch (err) {
    logger.warn("gift-card country segment fetch failed", { err: String(err) });
  }
  return countrySegment;
}

async function searchGiftCardBrands(query: string): Promise<InlineProduct[]> {
  const country = await getGiftCardCountrySegment();
  if (!country) return [];
  const res = await uswap.level({
    path: { asset: "gift-card", segments: [country] },
    side: "to",
    query,
  });
  return res.items
    .filter((i): i is LevelDrill => i.kind === "drill")
    .slice(0, 12)
    .flatMap((d) => {
      const leaf = d.node.only_item ?? d.node.first_item;
      const brandId = d.node.id;
      // Deep-link payload charset is [A-Za-z0-9_-]; skip exotic brand ids.
      if (!/^[A-Za-z0-9_-]{1,56}$/.test(brandId)) return [];
      return [
        {
          id: `gc-${brandId}`.slice(0, 64),
          family: "gift-card",
          title: `${d.node.name} Gift Card`,
          description: `${leaf?.chain.subtitle ?? ""} · pay with crypto`.replace(/^ · /, ""),
          thumb: `${IMG}/gift-card-placeholder.png`,
          payload: `gc-${brandId}`,
          emoji: "🎁",
        },
      ];
    });
}

// ---- handler ----

export function registerInline(bot: Bot, tenant: Tenant) {
  const botUsername = tenant.botUsername;
  const allowed = tenant.families ? new Set(tenant.families) : null;
  const showcase = SHOWCASE.filter((p) => !allowed || allowed.has(p.family));
  const giftCardsEnabled = !allowed || allowed.has("gift-card");

  bot.on("inline_query", async (ctx) => {
    const query = ctx.inlineQuery.query.trim();
    let products: InlineProduct[];
    try {
      if (!query) {
        products = showcase;
      } else {
        const q = query.toLowerCase();
        const staticHits = showcase.filter(
          (p) =>
            p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
        );
        const brands = giftCardsEnabled ? await searchGiftCardBrands(query) : [];
        products = [...brands, ...staticHits].slice(0, 20);
      }

      const results = products.map((p) => ({
        type: "article" as const,
        id: p.id,
        title: `${p.emoji} ${p.title}`,
        description: p.description,
        thumbnail_url: p.thumb,
        input_message_content: {
          message_text: [
            `${p.emoji} <b>${esc(p.title)}</b>`,
            esc(p.description),
            "",
            `<i>No account, no card — one crypto payment, delivered in minutes.</i>`,
          ].join("\n"),
          parse_mode: "HTML" as const,
          link_preview_options: { is_disabled: true },
        },
        reply_markup: {
          inline_keyboard: [
            [{ text: `🛒 Buy in @${botUsername}`, url: `https://t.me/${botUsername}?start=${p.payload}` }],
          ],
        },
      }));

      await ctx.answerInlineQuery(results as never, {
        cache_time: 300,
        is_personal: false,
        button: { text: "🛍 Open the shop", start_parameter: "shop" },
      });
    } catch (err) {
      logger.error("inline query failed", { err: String(err) });
      await ctx.answerInlineQuery([], { cache_time: 5 }).catch(() => {});
    }
  });
}
