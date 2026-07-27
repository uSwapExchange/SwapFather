/**
 * Push a shop bot's Telegram profile: localized commands, the pre-/start
 * "What can this bot do?" description, and the share-card short description —
 * branded per tenant.
 */

import type { Api } from "grammy";

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

function descriptions(brand: string): Record<string, { long: string; short: string }> {
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

export async function setupBotProfile(api: Api, brand: string) {
  await api.setMyCommands(COMMANDS.en!);
  for (const [lang, commands] of Object.entries(COMMANDS)) {
    if (lang === "en") continue;
    await api.setMyCommands(commands, { language_code: lang as never }).catch(() => {});
  }
  const descs = descriptions(brand);
  await api.setMyDescription(descs.en!.long);
  await api.setMyShortDescription(descs.en!.short.slice(0, 120));
  for (const [lang, d] of Object.entries(descs)) {
    if (lang === "en") continue;
    await api.setMyDescription(d.long, { language_code: lang as never }).catch(() => {});
    await api
      .setMyShortDescription(d.short.slice(0, 120), { language_code: lang as never })
      .catch(() => {});
  }
}
