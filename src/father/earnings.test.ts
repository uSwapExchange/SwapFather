import { describe, expect, test } from "bun:test";
import { formatEarningsUsd } from "./earnings.ts";

describe("affiliate earnings formatting", () => {
  test("keeps sub-cent earnings visible", () => {
    expect(formatEarningsUsd("0.005882")).toBe("$0.005882");
    expect(formatEarningsUsd("0.00000001")).toBe("$0.00000001");
  });

  test("keeps ordinary totals concise", () => {
    expect(formatEarningsUsd("12.5")).toBe("$12.50");
    expect(formatEarningsUsd(0)).toBe("$0.00");
  });
});
