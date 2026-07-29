/**
 * uSwap affiliate API — the tenant earnings rail.
 *
 * Registration is public + org-gated; the response includes a ONE-TIME
 * affiliate self-service token which we store encrypted per tenant.
 */

import { config } from "../config.ts";
import { logger } from "../lib/logger.ts";

export class AffiliateError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AffiliateError";
  }
}

async function req<T>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  const res = await fetch(`${config.uswapApiBase}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new AffiliateError(
      String(json.error ?? res.status),
      String(json.message ?? `affiliate API error ${res.status}`),
    );
  }
  return json as T;
}

export interface AffiliateRegistration {
  /** One-time self-service token (uswp_aff_…). */
  token: string | null;
  raw: Record<string, unknown>;
}

export async function registerAffiliate(params: {
  username: string;
  displayName: string;
  nearAccount: string;
  xmrAddress: string;
}): Promise<AffiliateRegistration> {
  const orgId = process.env.FATHER_ORG_ID;
  if (!orgId) throw new AffiliateError("not_configured", "FATHER_ORG_ID is not set");
  const raw = await req<Record<string, unknown>>(
    `/v1/organizations/${orgId}/affiliate-registrations`,
    {
      method: "POST",
      body: {
        username: params.username,
        display_name: params.displayName,
        near_account: params.nearAccount,
        xmr_address: params.xmrAddress,
      },
    },
  );
  // Token field name is tolerated loosely — log the shape once if unexpected.
  const token =
    (raw.token as string | undefined) ??
    (raw.access_token as string | undefined) ??
    (raw.affiliate_token as string | undefined) ??
    ((raw.affiliate as Record<string, unknown> | undefined)?.token as string | undefined) ??
    null;
  if (!token) {
    logger.warn("affiliate registration returned no recognizable token", {
      keys: Object.keys(raw),
    });
  }
  return { token, raw };
}

export interface AffiliateEarnings {
  summary?: Record<string, unknown>;
  [k: string]: unknown;
}

export function affiliateEarnings(token: string): Promise<AffiliateEarnings> {
  return req("/v1/affiliate/earnings?limit=10", { token });
}

export function affiliateMe(token: string): Promise<Record<string, unknown>> {
  return req("/v1/affiliate/me", { token });
}

export function updateAffiliatePayoutAddresses(
  token: string,
  params: { nearAccount: string; xmrAddress: string },
): Promise<Record<string, unknown>> {
  return req("/v1/affiliate/payout-addresses", {
    method: "PATCH",
    token,
    body: {
      near_account: params.nearAccount,
      xmr_address: params.xmrAddress,
    },
  });
}
