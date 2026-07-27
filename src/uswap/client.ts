/**
 * Minimal uSwap Partner API client.
 *
 * Conventions (from the API guide):
 *  - Bearer auth, JSON bodies.
 *  - Optional fields must be OMITTED, not null (zod validation).
 *  - Mutating endpoints get an Idempotency-Key.
 *  - Errors return { error, message? } — surfaced as UswapApiError.
 */

import { config } from "../config.ts";
import { logger } from "../lib/logger.ts";
import type {
  ApiErrorBody,
  BridgeOpenRequest,
  BridgeOpenResponse,
  CatalogAssetsResponse,
  DigitalDeliveryResponse,
  IntentView,
  LevelPath,
  LevelResponse,
  QuoteRequest,
  QuoteResponse,
} from "./types.ts";

export class UswapApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "UswapApiError";
  }
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  opts: { body?: unknown; idempotencyKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.uswapApiKey}`,
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  const started = Date.now();
  const res = await fetch(`${config.uswapApiBase}${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  logger.debug("uswap api", {
    method,
    path,
    status: res.status,
    ms: Date.now() - started,
  });

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new UswapApiError(res.status, "invalid_response", text.slice(0, 300));
  }

  if (!res.ok) {
    const err = json as ApiErrorBody;
    throw new UswapApiError(
      res.status,
      err.error ?? "unknown_error",
      err.message ?? `uSwap API error ${res.status}`,
      err.details,
    );
  }
  return json as T;
}

/** Strip undefined values so optional fields are omitted from the JSON body. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

export const uswap = {
  /** Unified catalog picker — one call per browse screen. */
  level(params: {
    path: LevelPath;
    side?: "from" | "to";
    query?: string;
    category?: string;
    cursor?: string;
  }): Promise<LevelResponse> {
    return request("POST", "/v1/catalog/level", { body: compact({ ...params }) });
  },

  /** Flat asset list — used for the payment-coin picker. */
  assets(params: {
    side?: "from" | "to";
    query?: string;
    counterpart_asset_v1?: string;
    cursor?: string;
  }): Promise<CatalogAssetsResponse> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    return request("GET", `/v1/catalog/assets?${qs}`);
  },

  quote(body: QuoteRequest): Promise<QuoteResponse> {
    return request("POST", "/v1/quotes", { body: compact({ ...body }) });
  },

  /** Atomically create a bridge + commit the quoted plan as its first intent. */
  openBridge(body: BridgeOpenRequest, idempotencyKey: string): Promise<BridgeOpenResponse> {
    return request("POST", "/v1/bridges/open", {
      body: compact({ ...body }),
      idempotencyKey,
    });
  },

  getIntent(intentId: string): Promise<{ intent: IntentView }> {
    return request("GET", `/v1/intents/${intentId}`);
  },

  getDigitalDelivery(
    bridgeId: string,
    intentId?: string,
  ): Promise<DigitalDeliveryResponse> {
    const qs = intentId ? `?intent_id=${encodeURIComponent(intentId)}` : "";
    return request("GET", `/v1/bridges/${bridgeId}/digital-delivery${qs}`);
  },

  runDeliveryAction(
    bridgeId: string,
    body: { delivery_item_id: string; action: string; intent_id?: string },
    idempotencyKey: string,
  ): Promise<{ result: unknown }> {
    return request("POST", `/v1/bridges/${bridgeId}/digital-delivery/actions`, {
      body: compact({ ...body }),
      idempotencyKey,
    });
  },
};
