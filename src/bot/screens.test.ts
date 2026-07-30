import { describe, expect, test } from "bun:test";
import { getTranslator } from "../i18n/index.ts";
import type { LevelMeta } from "../uswap/types.ts";
import type { Draft, NavLevel, PageItem } from "./session.ts";
import { browseUsesAisles, renderBrowse, renderQuote } from "./screens.ts";

const telegramMeta = {
  path: { asset: "telegram", segments: [] },
  title: "Select Product",
  search: "client",
  paging: "none",
  layout: "sections",
  categories: [
    { id: "PREMIUM", name: "PREMIUM" },
    { id: "STARS", name: "STARS" },
    { id: "ACCOUNTS", name: "ACCOUNTS" },
    { id: "BOOSTS", name: "BOOSTS" },
    { id: "OTHER", name: "OTHER" },
  ],
} satisfies LevelMeta;

const nav = {
  asset: "telegram",
  segments: [],
  cursorStack: [null],
  nextCursor: null,
  title: "Select Product",
} satisfies NavLevel;

function catalogItem(label: string, category: string): PageItem {
  return {
    k: "l",
    label,
    category,
    item: {
      asset_v1: `asset_v1:telegram:${label}`,
      symbol: label,
      name: label,
      decimals: 0,
      chain: { id: label, name: label },
    },
  };
}

const telegramItems = [
  catalogItem("Premium Top-up", "PREMIUM"),
  catalogItem("Gift Link", "PREMIUM"),
  catalogItem("Stars Top-up", "STARS"),
  catalogItem("Stars Giveaway", "STARS"),
  catalogItem("Numbers", "ACCOUNTS"),
  catalogItem("Usernames", "ACCOUNTS"),
  catalogItem("Boosts · 1 Month", "BOOSTS"),
  catalogItem("Boosts · 3 Months", "BOOSTS"),
  catalogItem("Boosts · 6 Months", "BOOSTS"),
  catalogItem("Boosts · 1 Year", "BOOSTS"),
  catalogItem("Ads Top-up", "OTHER"),
  catalogItem("Fresh US Account", "OTHER"),
] satisfies PageItem[];

describe("catalog category drilldowns", () => {
  test("honors a section layout even when the level has exactly 12 products", () => {
    expect(browseUsesAisles(telegramMeta, telegramItems)).toBe(true);
  });

  test("renders a compact, humanized category menu with derived counts", () => {
    const screen = renderBrowse(
      getTranslator("en"),
      telegramMeta,
      nav,
      telegramItems,
      { familyName: "Telegram", familyEmojiHtml: "✈️" },
    );
    const labels = screen.keyboard.flat().map((button) => button.text);

    expect(screen.text).toContain("12 products — pick a category:");
    expect(labels).toEqual([
      "🌟 Premium · 2",
      "⭐️ Stars · 2",
      "👤 Accounts · 2",
      "⚡️ Boosts · 4",
      "🎫 More · 2",
      "‹ Back",
      "🏠 Home",
    ]);
    expect(labels.some((label) => label.includes("All 12"))).toBe(false);
  });

  test("uses the humanized category in the product-list breadcrumb", () => {
    const screen = renderBrowse(
      getTranslator("en"),
      telegramMeta,
      { ...nav, category: "PREMIUM" },
      telegramItems.slice(0, 2),
      { familyName: "Telegram", familyEmojiHtml: "✈️" },
    );

    expect(screen.text).toStartWith("✈️ <b>Telegram</b> › <b>Premium</b>");
  });
});

describe("quote fee disclosure", () => {
  test("shows the tenant fee neutrally when a referred quote includes one", () => {
    const draft = {
      leaf: {
        asset_v1: "asset_v1:telegram:test:item",
        symbol: "ITEM",
        name: "Item",
        decimals: 0,
        chain: { id: "item", name: "Item", unit_label: "Quantity" },
      },
      productLabel: "Telegram Item",
      amountHuman: "1",
      paySymbol: "BTC",
      payChainName: "Bitcoin",
      payDecimals: 8,
      quote: {
        draft_id: "draft",
        plan_id: "plan",
        leg_plan_ids: ["leg"],
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        request_hash: "hash",
        source_amount_raw: "100000",
        source_amount_usd: 12.5,
        destination_amount_raw: "1",
        destination_amount_usd: 10,
        creator_fee: {
          amount_usd: "1.25",
          fee_bps: 1_000,
          fee_category: "telegram",
        },
      },
    } satisfies Draft;

    const screen = renderQuote(getTranslator("en"), draft);
    expect(screen.text).toContain("Shop fee:");
    expect(screen.text).toContain("$1.25");
    expect(screen.text).toContain("(10%)");
    expect(screen.text).not.toContain("uSwap fee");
  });
});
