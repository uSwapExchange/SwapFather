import { describe, expect, test } from "bun:test";
import {
  shouldReplaceTelegramCommands,
  shouldReplaceTelegramProfileText,
  telegramProfileForMode,
} from "./telegram-profile.ts";

describe("Telegram tenant profiles", () => {
  test("describes exchange-only bots as exchanges", () => {
    const profile = telegramProfileForMode("PriceSwap⚡", "swap");

    expect(profile.long).toContain("Swap BTC, ETH, SOL");
    expect(profile.long).not.toContain("gift cards");
    expect(profile.short).toContain("swap crypto");
    expect(profile.commands.find((command) => command.command === "orders")?.description).toBe("🧾 My swaps");
  });

  test("keeps storefront and mixed profiles truthful", () => {
    const shop = telegramProfileForMode("Shop", "shop");
    const both = telegramProfileForMode("Everything", "both");

    expect(shop.long).toContain("Buy gift cards");
    expect(both.long).toContain("Swap 50+ crypto assets or buy gift cards");
  });

  test("preserves profile fields customized in BotFather", () => {
    expect(shouldReplaceTelegramProfileText("My hand-written exchange description", "long")).toBe(false);
    expect(shouldReplaceTelegramProfileText("My custom short text", "short")).toBe(false);
    expect(shouldReplaceTelegramCommands([
      { command: "start", description: "My custom start command" },
    ])).toBe(false);
  });

  test("can replace empty or previously generated profile fields", () => {
    const generated = telegramProfileForMode("Old Brand", "shop");
    expect(shouldReplaceTelegramProfileText("", "long")).toBe(true);
    expect(shouldReplaceTelegramProfileText(generated.long, "long")).toBe(true);
    expect(shouldReplaceTelegramProfileText(generated.short, "short")).toBe(true);
    expect(shouldReplaceTelegramCommands(generated.commands)).toBe(true);
  });
});
