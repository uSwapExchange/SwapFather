/**
 * Catalog access for the shop: which top-level families we sell, cached root
 * data, and product labeling helpers.
 *
 * "Digital products" = every drill in the catalog root's Special category,
 * plus Prepaid Cards (which the API files under Fiat). Crypto/fiat payout
 * destinations are deliberately not sold here — this bot is a shop, not an
 * exchange front-end.
 */

import { uswap } from "../uswap/client.ts";
import type { LeafItem, LevelDrill } from "../uswap/types.ts";
import { logger } from "../lib/logger.ts";

export interface Family {
  id: string;
  name: string;
  childCount: number | null;
}

const EXTRA_FAMILY_IDS = new Set(["prepaid-card"]);
const FAMILY_ORDER = ["gift-card", "telegram", "discord", "prepaid-card", "mullvad", "tf2-keys"];

let cachedFamilies: Family[] | null = null;
let cachedAt = 0;
const FAMILY_TTL_MS = 60 * 60 * 1000;

export async function getFamilies(allowlist?: string[] | null): Promise<Family[]> {
  if (!cachedFamilies || Date.now() - cachedAt >= FAMILY_TTL_MS) {
    const root = await uswap.level({ path: { asset: null, segments: [] }, side: "to" });
    const drills = root.items.filter((i): i is LevelDrill => i.kind === "drill");
    const families = drills
      .filter(
        (d) => d.node.category === "Special" || EXTRA_FAMILY_IDS.has(d.node.id),
      )
      .map((d) => ({
        id: d.node.id,
        name: d.node.name,
        childCount: d.node.child_count,
      }));
    families.sort((a, b) => {
      const ai = FAMILY_ORDER.indexOf(a.id);
      const bi = FAMILY_ORDER.indexOf(b.id);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    cachedFamilies = families;
    cachedAt = Date.now();
    logger.info("catalog families refreshed", { count: families.length });
  }
  if (!allowlist) return cachedFamilies!;
  const allowed = new Set(allowlist);
  return cachedFamilies!.filter((f) => allowed.has(f.id));
}

/** Human product label for a leaf, e.g. "Adidas Gift Card", "Telegram Stars". */
export function productLabel(leaf: LeafItem): string {
  const chain = leaf.chain;
  const family = leaf.asset_v1.split(":")[1] ?? "";
  switch (family) {
    case "gift-card":
      return `${chain.name} Gift Card`;
    case "prepaid-card":
      return chain.name;
    case "telegram":
      return chain.parent_group_name && chain.parent_group_name !== chain.name
        ? `Telegram ${chain.parent_group_name} ${chain.name}`.replace(/\s+Top-up$/i, "")
        : `Telegram ${chain.name}`;
    case "discord":
      return chain.parent_group_name
        ? `Discord ${chain.parent_group_name} — ${chain.name}`
        : `Discord ${chain.name}`;
    case "mullvad":
      return "Mullvad VPN";
    default:
      return chain.subtitle ? `${chain.name} · ${chain.subtitle}` : chain.name;
  }
}

/** Effective decimals for a leaf's amount fields. */
export function leafAmountDecimals(leaf: LeafItem): number {
  return leaf.chain.amount_decimals ?? leaf.decimals ?? 0;
}

/** True when the product needs the user to provide a delivery destination. */
export function leafNeedsDestination(leaf: LeafItem): boolean {
  const c = leaf.chain;
  if (c.destination_locked && c.destination_address) return false;
  if (c.destination_required === false && !c.destination_optional) return false;
  // Products with an address_prompt want a destination (Mullvad's is optional).
  return Boolean(c.address_prompt) || c.destination_required !== false;
}

/** Locked (SKU-bound) destination, e.g. a specific +888 number or OG account. */
export function leafLockedDestination(leaf: LeafItem): string | undefined {
  return leaf.chain.destination_locked ? leaf.chain.destination_address : undefined;
}
