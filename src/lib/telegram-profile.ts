/**
 * Push a shop bot's Telegram profile: localized commands, the pre-/start
 * "What can this bot do?" description, and the share-card short description —
 * branded per tenant.
 */

import type { Api } from "grammy";
import type { TenantMode } from "../tenant.ts";

const COMMANDS: Record<string, { command: string; description: string }[]> = {
  en: [
    { command: "start", description: "🛍 Open the shop" },
    { command: "orders", description: "🧾 My orders & codes" },
    { command: "language", description: "🌐 Change language" },
    { command: "help", description: "❓ How it works" },
  ],
  es: [
    { command: "start", description: "🛍 Abrir la tienda" },
    { command: "orders", description: "🧾 Mis pedidos y códigos" },
    { command: "language", description: "🌐 Cambiar idioma" },
    { command: "help", description: "❓ Cómo funciona" },
  ],
  ru: [
    { command: "start", description: "🛍 Открыть магазин" },
    { command: "orders", description: "🧾 Мои заказы и коды" },
    { command: "language", description: "🌐 Сменить язык" },
    { command: "help", description: "❓ Как это работает" },
  ],
  zh: [
    { command: "start", description: "🛍 打开商店" },
    { command: "orders", description: "🧾 我的订单和代码" },
    { command: "language", description: "🌐 更改语言" },
    { command: "help", description: "❓ 使用说明" },
  ],
  fr: [
    { command: "start", description: "🛍 Ouvrir la boutique" },
    { command: "orders", description: "🧾 Mes commandes et codes" },
    { command: "language", description: "🌐 Changer de langue" },
    { command: "help", description: "❓ Comment ça marche" },
  ],
  de: [
    { command: "start", description: "🛍 Shop öffnen" },
    { command: "orders", description: "🧾 Meine Bestellungen & Codes" },
    { command: "language", description: "🌐 Sprache ändern" },
    { command: "help", description: "❓ So funktioniert's" },
  ],
  pt: [
    { command: "start", description: "🛍 Abrir a loja" },
    { command: "orders", description: "🧾 Meus pedidos e códigos" },
    { command: "language", description: "🌐 Mudar idioma" },
    { command: "help", description: "❓ Como funciona" },
  ],
};

const SWAP_COMMANDS = [
  { command: "start", description: "🔄 Swap crypto" },
  { command: "orders", description: "🧾 My swaps" },
  { command: "language", description: "🌐 Change language" },
  { command: "help", description: "❓ How it works" },
];

const BOTH_COMMANDS = [
  { command: "start", description: "↕️ Open the bot" },
  { command: "orders", description: "🧾 My activity" },
  { command: "language", description: "🌐 Change language" },
  { command: "help", description: "❓ How it works" },
];

function shopDescriptions(brand: string): Record<string, { long: string; short: string }> {
  return {
    en: {
      long: `Buy gift cards, Telegram Stars & Premium, Discord Nitro, VPN time and prepaid cards — paid with crypto (BTC, ETH, SOL, USDC, XMR and 50+ more).\n\n• No account, no KYC\n• Delivered here in minutes\n• Powered by uSwap\n\nPress Start to browse ${brand}.`,
      short: `${brand} — digital products paid with crypto. No account needed.`,
    },
    es: {
      long: `Compra tarjetas de regalo, Telegram Stars y Premium, Discord Nitro, VPN y tarjetas prepago — pagando con cripto.\n\n• Sin cuenta, sin KYC\n• Entrega aquí en minutos\n• Con tecnología de uSwap\n\nPulsa Iniciar para ver ${brand}.`,
      short: `${brand} — productos digitales pagados con cripto. Sin cuenta.`,
    },
    ru: {
      long: `Покупайте подарочные карты, Telegram Stars и Premium, Discord Nitro, VPN и предоплаченные карты за криптовалюту.\n\n• Без аккаунта и KYC\n• Доставка прямо сюда за минуты\n• Работает на uSwap\n\nНажмите Start, чтобы открыть ${brand}.`,
      short: `${brand} — цифровые товары за крипту. Без аккаунта.`,
    },
  };
}

export function telegramProfileForMode(
  brand: string,
  mode: TenantMode,
): { long: string; short: string; commands: { command: string; description: string }[] } {
  if (mode === "swap") {
    return {
      long: `Swap BTC, ETH, SOL, USDC, XMR and 50+ assets directly in Telegram.\n\n• No account, no KYC\n• Live quotes and automatic delivery\n• Powered by uSwap\n\nPress Start to swap with ${brand}.`,
      short: `${brand} — swap crypto directly in Telegram. No account needed.`,
      commands: SWAP_COMMANDS,
    };
  }
  if (mode === "both") {
    return {
      long: `Swap 50+ crypto assets or buy gift cards, Telegram Stars & Premium, Discord Nitro, VPN time and prepaid cards — all in Telegram.\n\n• No account, no KYC\n• Delivered here in minutes\n• Powered by uSwap\n\nPress Start to use ${brand}.`,
      short: `${brand} — swap crypto and buy digital products in Telegram.`,
      commands: BOTH_COMMANDS,
    };
  }
  const english = shopDescriptions(brand).en!;
  return { ...english, commands: COMMANDS.en! };
}

export async function setupBotProfile(api: Api, brand: string, mode: TenantMode = "shop") {
  const profile = telegramProfileForMode(brand, mode);
  const currentCommands = await api.getMyCommands().catch(() => null);
  const currentDescription = await api.getMyDescription().catch(() => null);
  const currentShortDescription = await api.getMyShortDescription().catch(() => null);
  if (currentCommands !== null && shouldReplaceTelegramCommands(currentCommands)) {
    await api.setMyCommands(profile.commands);
  }
  if (currentDescription !== null && shouldReplaceTelegramProfileText(currentDescription.description, "long")) {
    await api.setMyDescription(profile.long);
  }
  if (
    currentShortDescription !== null
    && shouldReplaceTelegramProfileText(currentShortDescription.short_description, "short")
  ) {
    await api.setMyShortDescription(profile.short.slice(0, 120));
  }

  if (mode === "shop") {
    const descs = shopDescriptions(brand);
    for (const [lang, commands] of Object.entries(COMMANDS)) {
      if (lang === "en") continue;
      const existing = await api.getMyCommands({ language_code: lang as never }).catch(() => null);
      if (existing !== null && shouldReplaceTelegramCommands(existing)) {
        await api.setMyCommands(commands, { language_code: lang as never }).catch(() => {});
      }
    }
    for (const [lang, description] of Object.entries(descs)) {
      if (lang === "en") continue;
      const existingLong = await api.getMyDescription({ language_code: lang as never }).catch(() => null);
      if (existingLong !== null && shouldReplaceTelegramProfileText(existingLong.description, "long")) {
        await api.setMyDescription(description.long, { language_code: lang as never }).catch(() => {});
      }
      const existingShort = await api.getMyShortDescription({ language_code: lang as never }).catch(() => null);
      if (existingShort !== null && shouldReplaceTelegramProfileText(existingShort.short_description, "short")) {
        await api
          .setMyShortDescription(description.short.slice(0, 120), { language_code: lang as never })
          .catch(() => {});
      }
    }
    return;
  }

  // Clear only our stale storefront-localized overrides. Custom BotFather
  // profile fields are preserved and continue to win over fleet defaults.
  for (const lang of Object.keys(COMMANDS)) {
    if (lang === "en") continue;
    const existingCommands = await api.getMyCommands({ language_code: lang as never }).catch(() => null);
    if (existingCommands !== null && existingCommands.length > 0 && shouldReplaceTelegramCommands(existingCommands)) {
      await api.deleteMyCommands({ language_code: lang as never }).catch(() => {});
    }
    const existingLong = await api.getMyDescription({ language_code: lang as never }).catch(() => null);
    if (
      existingLong !== null
      && existingLong.description.length > 0
      && shouldReplaceTelegramProfileText(existingLong.description, "long")
    ) {
      await api.setMyDescription("", { language_code: lang as never }).catch(() => {});
    }
    const existingShort = await api.getMyShortDescription({ language_code: lang as never }).catch(() => null);
    if (
      existingShort !== null
      && existingShort.short_description.length > 0
      && shouldReplaceTelegramProfileText(existingShort.short_description, "short")
    ) {
      await api.setMyShortDescription("", { language_code: lang as never }).catch(() => {});
    }
  }
}

export function shouldReplaceTelegramCommands(
  commands: readonly { command: string; description: string }[],
): boolean {
  if (commands.length === 0) return true;
  const serialized = JSON.stringify(commands);
  return [...Object.values(COMMANDS), SWAP_COMMANDS, BOTH_COMMANDS]
    .some((candidate) => JSON.stringify(candidate) === serialized);
}

export function shouldReplaceTelegramProfileText(value: string, kind: "long" | "short"): boolean {
  if (value.length === 0) return true;
  if (kind === "short") {
    return [
      " — digital products paid with crypto. No account needed.",
      " — productos digitales pagados con cripto. Sin cuenta.",
      " — цифровые товары за крипту. Без аккаунта.",
      " — swap crypto directly in Telegram. No account needed.",
      " — swap crypto and buy digital products in Telegram.",
    ].some((suffix) => value.endsWith(suffix));
  }
  return [
    ["Buy gift cards, Telegram Stars & Premium", "• Powered by uSwap"],
    ["Compra tarjetas de regalo, Telegram Stars y Premium", "• Con tecnología de uSwap"],
    ["Покупайте подарочные карты, Telegram Stars и Premium", "• Работает на uSwap"],
    ["Swap BTC, ETH, SOL, USDC, XMR and 50+ assets", "• Powered by uSwap"],
    ["Swap 50+ crypto assets or buy gift cards", "• Powered by uSwap"],
  ].some(([prefix, marker]) => value.startsWith(prefix!) && value.includes(marker!));
}
