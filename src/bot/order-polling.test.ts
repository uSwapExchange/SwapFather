import { describe, expect, it } from "bun:test";
import { expectsDigitalDelivery, successorIntentId } from "./order-polling";

describe("order polling policy", () => {
  it("follows a server replacement regardless of the old terminal status", () => {
    expect(successorIntentId(
      { replaced_by_intent_id: "in_replacement" },
      "in_cancelled",
    )).toBe("in_replacement");
    expect(successorIntentId(
      { replaced_by_intent_id: "in_current" },
      "in_current",
    )).toBeNull();
    expect(successorIntentId({ replaced_by_intent_id: null }, "in_current")).toBeNull();
  });

  it("waits for protected delivery on shop orders but not plain swaps", () => {
    expect(expectsDigitalDelivery("Mullvad VPN — 1 Months")).toBe(true);
    expect(expectsDigitalDelivery("Telegram Stars × 100")).toBe(true);
    expect(expectsDigitalDelivery("Swap → ~0.25 XMR")).toBe(false);
  });
});
