import { afterEach, beforeEach, describe, expect, test } from "bun:test";

process.env.USWAP_API_KEY ??= "test-api-key";
process.env.FATHER_ORG_ID = "org-test";

const {
  affiliateCategoryFees,
  registerAffiliate,
  resetAffiliateCategoryFee,
  updateAffiliateCategoryFee,
  updateAffiliatePayoutAddresses,
} = await import("./affiliate.ts");

describe("affiliate payout API", () => {
  const originalFetch = globalThis.fetch;
  let requests: Array<{ url: string; init?: RequestInit }>;

  beforeEach(() => {
    requests = [];
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      return new Response(JSON.stringify({ token: "uswp_aff_test_token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("registration always sends both payout destinations", async () => {
    await registerAffiliate({
      username: "merchant",
      displayName: "Merchant",
      nearAccount: "merchant.near",
      xmrAddress: "xmr-address",
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]!.url).toEndWith("/v1/organizations/org-test/affiliate-registrations");
    expect(requests[0]!.init?.method).toBe("POST");
    expect(JSON.parse(String(requests[0]!.init?.body))).toEqual({
      username: "merchant",
      display_name: "Merchant",
      near_account: "merchant.near",
      xmr_address: "xmr-address",
    });
  });

  test("existing affiliates update payout destinations instead of re-registering", async () => {
    await updateAffiliatePayoutAddresses("affiliate-token", {
      nearAccount: "merchant.near",
      xmrAddress: "xmr-address",
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]!.url).toEndWith("/v1/affiliate/payout-addresses");
    expect(requests[0]!.init?.method).toBe("PATCH");
    expect(requests[0]!.init?.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer affiliate-token",
    });
    expect(JSON.parse(String(requests[0]!.init?.body))).toEqual({
      near_account: "merchant.near",
      xmr_address: "xmr-address",
    });
  });

  test("reads, updates, and resets category fees with affiliate authorization", async () => {
    await affiliateCategoryFees("affiliate-token");
    await updateAffiliateCategoryFee("affiliate-token", "telegram", 1_250);
    await resetAffiliateCategoryFee("affiliate-token", "telegram");

    expect(requests.map((request) => [request.url.split("/v1")[1], request.init?.method ?? "GET"])).toEqual([
      ["/affiliate/category-fees", "GET"],
      ["/affiliate/category-fees/telegram", "PUT"],
      ["/affiliate/category-fees/telegram", "DELETE"],
    ]);
    expect(JSON.parse(String(requests[1]!.init?.body))).toEqual({ total_fee_bps: 1_250 });
    expect(requests[1]!.init?.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer affiliate-token",
    });
    expect(requests[2]!.init?.headers).toEqual({
      Authorization: "Bearer affiliate-token",
    });
  });
});
