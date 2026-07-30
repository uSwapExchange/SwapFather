/**
 * uSwap Partner API wire types — hand-written from the OpenAPI 3.1 spec
 * (GET /v1/openapi.json) and verified against live responses.
 * Only the fields the bot consumes are typed; responses may carry more.
 */

// ---------- catalog: unified level picker ----------

export interface LevelSegment {
  key: string;
  id: string;
  wire?: { parent_group_id?: string; group_id?: string };
}

export interface LevelPath {
  asset: string | null;
  segments: LevelSegment[];
}

export interface LevelCategory {
  id: string;
  name: string;
  count?: number;
  pinned?: boolean;
}

export interface LevelMeta {
  path: LevelPath;
  title?: string;
  search?: "server" | "client";
  paging?: "none" | "offset" | "opaque";
  layout?: "flat" | "sections";
  pills?: boolean;
  categories?: LevelCategory[];
  auto_skip_single?: boolean;
}

/** Product/network descriptor attached to a leaf (`item.chain`). */
export interface LeafChain {
  id: string;
  name: string;
  subtitle?: string;
  image?: string;
  address_type?: string;
  address_prompt?: string;
  destination_required?: boolean;
  destination_optional?: boolean;
  destination_address?: string;
  destination_label?: string;
  destination_locked?: boolean;
  amount_min_raw?: string;
  amount_max_raw?: string;
  amount_decimals?: number;
  amount_options_raw?: string[];
  amount_step_raw?: string;
  unit_label?: string;
  unit_price_usd_buy?: number;
  discount_min_bps?: number;
  discount_max_bps?: number;
  out_of_stock?: boolean;
  availability_reason?: string;
  parent_group_name?: string;
  group_name?: string;
}

export interface LeafItem {
  asset_v1: string;
  symbol: string;
  name: string;
  image?: string;
  decimals: number;
  chain: LeafChain;
}

export interface LevelLeaf {
  kind: "leaf";
  item: LeafItem;
  category?: string;
}

export interface LevelDrill {
  kind: "drill";
  node: {
    id: string;
    segment: LevelSegment;
    name: string;
    image?: string;
    subtitle?: string;
    child_count: number | null;
    only_item?: LeafItem;
    first_item?: LeafItem;
    category?: string;
    out_of_stock?: boolean;
    availability_reason?: string;
  };
}

export type LevelItem = LevelLeaf | LevelDrill;

export interface LevelResponse {
  meta: LevelMeta;
  items: LevelItem[];
  cursor: string | null;
}

// ---------- catalog: flat asset list ----------

export interface CatalogAsset {
  asset_id: string;
  asset_v1: string;
  symbol: string;
  name: string;
  category: string;
  chain: { id: string; name: string; image?: string; address_type?: string };
  decimals: number;
  networks: {
    asset_v1: string;
    chain_id: string;
    chain_name: string;
    chain_image?: string;
    decimals: number;
  }[];
}

export interface CatalogAssetsResponse {
  cursor: string | null;
  items: CatalogAsset[];
  categories: { name: string; items: CatalogAsset[] }[];
}

// ---------- quotes ----------

export interface QuoteRequest {
  source_asset_v1: string;
  destination_asset_v1: string;
  destination_address?: string;
  destination_memo?: string | null;
  amount: string;
  input_side: "from" | "to";
  input_type?: "usd" | "human" | "raw";
  slippage_bps?: number;
  excluded_provider_ids?: string[];
  referral_token?: string;
}

export interface QuoteLeg {
  leg_plan_id: string;
  route_leg_index: number;
  kind: string;
  provider_id: string;
  source_asset_v1: string;
  destination_asset_v1: string;
  amount_in_raw: string;
  amount_out_raw: string;
  rate?: string;
  expires_at?: string;
}

export interface QuoteResponse {
  draft_id: string;
  plan_id: string;
  request_hash: string;
  created_at: string;
  expires_at: string;
  source_asset_v1: string;
  destination_asset_v1: string;
  source_amount_raw: string;
  destination_amount_raw: string;
  source_amount_usd?: number;
  destination_amount_usd?: number;
  destination_amount_min_raw: string | null;
  selected_route: {
    legs: { leg_plan_id: string }[];
  };
  legs: QuoteLeg[];
  warnings?: unknown[];
  creator_fee?: {
    affiliate_username: string;
    affiliate_display_name: string;
    amount_usd: string;
    amount_raw: string;
    fee_bps: number;
    fee_category?: string | null;
  } | null;
}

// ---------- bridges / intents ----------

export interface IngressEndpoint {
  id: string;
  network_id: string;
  network_name?: string;
  rail?: string;
  address: string;
  memo?: string | null;
  tag?: string | null;
}

export interface BridgeView {
  id: string;
  created_at: string;
  ingress_endpoints: IngressEndpoint[];
}

export type IntentStatus =
  | "quoted"
  | "awaiting_deposit"
  | "matched"
  | "held"
  | "executing"
  | "refunding"
  | "delivering"
  | "completed"
  | "expired"
  | "refunded"
  | "failed"
  | "cancelled";

export interface IntentView {
  id: string;
  status: IntentStatus;
  kind?: string;
  created_at: string;
  expires_at: string | null;
  source_amount_raw?: string;
  replaced_by_intent_id?: string | null;
  deliveries?: { status: string; tx_hash?: string | null }[];
}

export interface BridgeOpenRequest extends QuoteRequest {
  draft_id: string;
  plan_id: string;
  leg_plan_ids: string[];
  expires_at: string;
  request_hash: string;
  source_amount_ceiling_raw?: string;
  external_id?: string;
  metadata?: Record<string, unknown>;
  intent_metadata?: Record<string, unknown>;
  policies?: BridgePolicies;
}

export interface BridgePolicies {
  on_unmatched?: "market" | "refund" | "hold";
  default_on_mismatch?: "market" | "refund" | "hold";
  default_on_expiry?: "refund" | "market" | "hold";
  on_failure?: "retry" | "refund" | "fallback";
  slippage_bps?: number;
}

export interface BridgeOpenResponse {
  bridge: BridgeView;
  intent: IntentView;
}

// ---------- digital delivery ----------

export interface DeliveryField {
  label: string;
  value: string;
  copy?: boolean;
}

export interface DeliveryItem {
  id: string;
  label: string;
  kind: string;
  status: string;
  purchased_at?: string;
  actions?: string[];
  fields?: DeliveryField[];
}

export interface DigitalDeliveryResponse {
  bridge_id: string;
  intent_id?: string;
  status: string;
  items: DeliveryItem[];
  review_required?: boolean;
  updated_at?: string;
}

// ---------- errors ----------

export interface ApiErrorBody {
  error: string;
  message?: string;
  details?: unknown;
}
