import { describe, expect, test } from "bun:test";
import { getTranslator } from "../i18n/index.ts";
import type { Draft } from "./session.ts";
import { renderQuote } from "./screens.ts";

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
