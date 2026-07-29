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

const globallyEnabled = process.env.CUSTOM_EMOJI !== "0";

/**
 * Custom-emoji entitlement is per BOT (the rule is "bot owner has Premium",
 * and in fleet mode every tenant bot has a different owner). Rendering always
 * produces the rich version; the send layer strips it for bots Telegram has
 * rejected once.
 */
const disabledBots = new Set<number>();

export function customEmojiEnabled(botId: number): boolean {
  return globallyEnabled && !disabledBots.has(botId);
}

/** Called by the send layer when Telegram rejects custom emoji for a bot. */
export function disableCustomEmoji(botId: number): void {
  disabledBots.add(botId);
}

/** uSwap pack emoji id for a key like "asset-btc", "prod-nitro", "net-base". */
export function packEmojiId(key: string): string | undefined {
  return globallyEnabled ? ids[key] : undefined;
}

/** Inline emoji for HTML message text: uSwap custom emoji + unicode fallback. */
function e(unicode: string, packKey?: string): string {
  const id = packKey ? packEmojiId(packKey) : undefined;
  if (!id) return unicode;

  // Telegram requires the text covered by a custom_emoji entity to contain an
  // actual emoji. Plain logo glyphs such as ₿, Ξ, ◎ and ✕ are valid text but
  // make the Bot API reject the entire message with ENTITY_TEXT_INVALID.
  // Keep this guard here so a future fallback cannot silently disable custom
  // emoji for an otherwise-entitled bot.
  const placeholder = /\p{Extended_Pictographic}/u.test(unicode) ? unicode : "🪙";
  return `<tg-emoji emoji-id="${id}">${placeholder}</tg-emoji>`;
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
  // family id (home buttons) and asset family (asset_v1) both resolve here
  "tf2-keys": "prod-tf2-key",
  tf2: "prod-tf2-key",
};

const PRODUCT_UNICODE: Record<string, string> = {
  "gift-card": "🎁",
  telegram: "✈️",
  discord: "🎮",
  mullvad: "🛡",
  "prepaid-card": "💳",
  "tf2-keys": "🔑",
  tf2: "🔑",
};

/**
 * Per-PRODUCT pack key resolver — finer than the family glyph, so Stars,
 * Premium, Boosts, Nitro, TF2 keys etc. each carry their own brand emoji.
 */
export function leafPackKey(assetV1: string): string | undefined {
  const [, family = "", provider = "", sku = ""] = assetV1.split(":");
  if (family === "telegram") {
    if (provider === "fragment") {
      if (sku.startsWith("premium")) return "prod-tg-premium";
      if (sku.startsWith("stars")) return "prod-tg-stars";
      if (sku.includes("boost")) return "prod-tg-boost";
      if (sku.startsWith("ads")) return "asset-gram";
    }
    return "prod-telegram";
  }
  if (family === "discord") {
    if (sku.includes("boost")) return "prod-dc-boost";
    if (sku.startsWith("nitro") || sku.startsWith("promo")) return "prod-nitro";
    return "prod-discord";
  }
  return PRODUCT_PACK_KEY[family];
}

/** Custom-emoji button icon id for a product, when the pack has one. */
export function leafIconId(assetV1: string): string | undefined {
  const key = leafPackKey(assetV1);
  return key ? packEmojiId(key) : undefined;
}

const PACK_KEY_UNICODE: Record<string, string> = {
  "prod-tg-premium": "🌟",
  "prod-tg-stars": "⭐️",
  "prod-tg-boost": "⚡️",
  "prod-nitro": "🚀",
  "prod-dc-boost": "⚡️",
  "prod-tf2-key": "🔑",
  "asset-gram": "✈️",
};

/** HTML emoji for a specific product (finer than the family glyph). */
export function leafEmoji(assetV1: string): string {
  const key = leafPackKey(assetV1);
  const family = assetV1.split(":")[1] ?? "";
  const unicode = (key && PACK_KEY_UNICODE[key]) ?? PRODUCT_UNICODE[family] ?? "🛍";
  return e(unicode, key);
}

/** Unicode prefix for known catalog category pills. */
const CATEGORY_UNICODE: Record<string, string> = {
  "food & drink": "🍔",
  shopping: "🛒",
  entertainment: "🎬",
  gaming: "🎮",
  travel: "🌎",
  tech: "💻",
  "home & garden": "🏡",
  "beauty & wellness": "💄",
  "sports & outdoors": "⚽️",
  other: "🎫",
  premium: "🌟",
  stars: "⭐️",
  rentals: "📱",
  nitro: "🚀",
  boosts: "⚡️",
  accounts: "👤",
};

export function categoryEmojiChar(name: string): string | undefined {
  return CATEGORY_UNICODE[name.toLowerCase()];
}

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
  btc: "🟠",
  eth: "💎",
  sol: "🟣",
  usdc: "💵",
  usdt: "💵",
  xmr: "🕵️",
  ltc: "🌙",
  gram: "✈️",
  ton: "✈️",
  near: "🌈",
  doge: "🐕",
  bnb: "🟡",
  xrp: "💧",
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

/** HTML emoji for an asset in message text (pack emoji + unicode fallback). */
export function assetEmojiHtml(assetId: string): string {
  return e(assetEmojiChar(assetId), `asset-${assetId.toLowerCase()}`);
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
