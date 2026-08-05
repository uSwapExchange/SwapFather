import { describe, expect, test } from "bun:test";
import type { AffiliateCategoryFeeSetting } from "./affiliate.ts";
import {
  formatAffiliateFeeBps,
  parseAffiliateFeePercent,
  visibleAffiliateFeeItems,
} from "./father.ts";

const items = [
  setting("swap"),
  setting("telegram"),
  setting("discord"),
  setting("gift-card"),
  setting("prepaid-card"),
  setting("mullvad"),
  setting("tf2-keys"),
];

describe("SwapFather category fees", () => {
  test("parses percentages into bps inside the hard cap", () => {
    expect(parseAffiliateFeePercent("0.01", 1_500)).toBe(1);
    expect(parseAffiliateFeePercent("10", 1_500)).toBe(1_000);
    expect(parseAffiliateFeePercent("12.5", 1_500)).toBe(1_250);
    expect(parseAffiliateFeePercent("7.25%", 1_500)).toBe(725);
    expect(parseAffiliateFeePercent(" 7.25% ", 1_500)).toBe(725);
    expect(parseAffiliateFeePercent("7.25$", 1_500)).toBe(725);
    expect(parseAffiliateFeePercent("15", 1_500)).toBe(1_500);
    expect(parseAffiliateFeePercent("0", 1_500)).toBeNull();
    expect(parseAffiliateFeePercent("15.01", 1_500)).toBeNull();
    expect(parseAffiliateFeePercent("10.123", 1_500)).toBeNull();
    expect(parseAffiliateFeePercent("7.25%$", 1_500)).toBeNull();
    expect(parseAffiliateFeePercent("fee 7.25", 1_500)).toBeNull();
    expect(parseAffiliateFeePercent("2", 200)).toBe(200);
    expect(parseAffiliateFeePercent("2.01", 200)).toBeNull();
    expect(formatAffiliateFeeBps(1_250)).toBe("12.5%");
  });

  test("shows only categories sold by each tenant mode", () => {
    expect(visibleAffiliateFeeItems("swap", null, items).map((item) => item.category_id)).toEqual(["swap"]);
    expect(visibleAffiliateFeeItems("shop", ["telegram", "mullvad"], items).map((item) => item.category_id)).toEqual([
      "telegram",
      "mullvad",
    ]);
    expect(visibleAffiliateFeeItems("both", ["discord"], items).map((item) => item.category_id)).toEqual([
      "swap",
      "discord",
    ]);
    expect(visibleAffiliateFeeItems("shop", null, items).map((item) => item.category_id)).not.toContain("swap");
  });
});

function setting(categoryId: AffiliateCategoryFeeSetting["category_id"]): AffiliateCategoryFeeSetting {
  return {
    category_id: categoryId,
    display_name: categoryId,
    description: categoryId,
    available: true,
    source: "inherited",
    override_fee_bps: null,
    inherited_fee_bps: 75,
    effective_fee_bps: 75,
    fee_cap_bps: 1_500,
    platform_bps: 15,
    organization_bps: 30,
    affiliate_bps: 30,
  };
}
