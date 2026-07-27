/**
 * Emoji layer — uSwap brand custom emoji with unicode fallbacks.
 *
 * uSwap publishes public custom-emoji packs (uSwapAssets / uSwapNetworks /
 * uSwapBanners, owned by @uSwap_Bot). Since Bot API 10.x a bot may use custom
 * emoji in its own messages and as inline-button icons when the bot OWNER has
 * Telegram Premium (or the bot has a Fragment username).
 *
 * We render them optimistically; if Telegram rejects a send, the render layer
 * calls disableCustomEmoji() and retries with plain unicode — so the bot
 * degrades gracefully for self-hosters without Premium. Set CUSTOM_EMOJI=0 to
 * force plain unicode.
 */

import uswapEmojiIds from "./uswap-emoji-ids.json" with { type: "json" };

const ids = uswapEmojiIds as Record<string, string>;

let enabled = process.env.CUSTOM_EMOJI !== "0";

export function customEmojiEnabled(): boolean {
  return enabled;
}

/** Called by the render layer when Telegram rejects custom emoji. */
export function disableCustomEmoji(): void {
  enabled = false;
}

/** uSwap pack emoji id for a key like "asset-btc", "prod-nitro", "net-base". */
export function packEmojiId(key: string): string | undefined {
  return enabled ? ids[key] : undefined;
}

/** Inline emoji for HTML message text: uSwap custom emoji + unicode fallback. */
function e(unicode: string, packKey?: string): string {
  const id = packKey ? packEmojiId(packKey) : undefined;
  return id ? `<tg-emoji emoji-id="${id}">${unicode}</tg-emoji>` : unicode;
}

/** Strip <tg-emoji> wrappers, keeping the unicode fallback content. */
export function stripTgEmoji(html: string): string {
  return html.replace(/<tg-emoji[^>]*>(.*?)<\/tg-emoji>/g, "$1");
}

// ---------- product families ----------

const PRODUCT_PACK_KEY: Record<string, string> = {
  "gift-card": "prod-gift-card",
  telegram: "prod-telegram",
  discord: "prod-discord",
  mullvad: "prod-mullvad",
  "prepaid-card": "prod-prepaid-card",
};

const PRODUCT_UNICODE: Record<string, string> = {
  "gift-card": "🎁",
  telegram: "✈️",
  discord: "🎮",
  mullvad: "🛡",
  "prepaid-card": "💳",
};

/** Plain unicode glyph (safe for button text). */
export function productEmojiChar(assetId: string): string {
  return PRODUCT_UNICODE[assetId] ?? "🛍";
}

/** HTML emoji for message text (custom emoji when available). */
export function productEmoji(assetId: string): string {
  return e(productEmojiChar(assetId), PRODUCT_PACK_KEY[assetId]);
}

/** uSwap pack icon id for a family button. */
export function productIconId(assetId: string): string | undefined {
  const key = PRODUCT_PACK_KEY[assetId];
  return key ? packEmojiId(key) : undefined;
}

// ---------- crypto assets & networks ----------

const ASSET_UNICODE: Record<string, string> = {
  btc: "₿",
  eth: "Ξ",
  sol: "◎",
  usdc: "💵",
  usdt: "💵",
  xmr: "🕵️",
  ltc: "🌙",
  gram: "✈️",
  ton: "✈️",
  near: "🌈",
  doge: "🐕",
  bnb: "🟡",
  xrp: "✕",
  trx: "🔺",
  ada: "🔷",
  zec: "🛡",
  dash: "💨",
  bch: "🍀",
  pol: "🟣",
  avax: "🔻",
  link: "🔗",
  sui: "💧",
  xlm: "🌟",
};

/** Plain unicode glyph for an asset (button-text safe). */
export function assetEmojiChar(assetId: string): string {
  return ASSET_UNICODE[assetId.toLowerCase()] ?? "🪙";
}

/** uSwap pack icon id for a crypto asset button. */
export function assetIconId(assetId: string): string | undefined {
  return packEmojiId(`asset-${assetId.toLowerCase()}`);
}

/** uSwap pack icon id for a network button. */
export function networkIconId(chainId: string): string | undefined {
  return packEmojiId(`net-${chainId.toLowerCase()}`);
}

/** Common UI glyphs (single source so the whole bot stays consistent). */
export const UI = {
  home: "🏠",
  back: "‹",
  next: "›",
  search: "🔍",
  orders: "🧾",
  language: "🌐",
  help: "❓",
  ok: "✅",
  warn: "⚠️",
  fail: "❌",
  hourglass: "⏳",
  spark: "✨",
  lock: "🔒",
  money: "💰",
  card: "💳",
  point: "👉",
  copy: "📋",
  clock: "🕒",
  refresh: "🔄",
  support: "💬",
} as const;
