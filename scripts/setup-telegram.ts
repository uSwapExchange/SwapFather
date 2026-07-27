/**
 * One-shot Telegram profile setup: commands, description ("What can this bot
 * do?" box) and short description — localized per supported language.
 *
 * Run after deploying or after changing strings:
 *   bun run setup:telegram
 */

import { Bot } from "grammy";
import { config } from "../src/config.ts";

const bot = new Bot(config.telegramBotToken);

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

const DESCRIPTIONS: Record<string, { long: string; short: string }> = {
  en: {
    long:
      "Buy gift cards (Amazon, Apple, Steam-style brands), Telegram Stars & Premium, Discord Nitro, Mullvad VPN and prepaid cards — paid with crypto (BTC, ETH, SOL, USDC, XMR and 50+ more).\n\n• No account, no KYC\n• Delivered here in minutes\n• Powered by uSwap\n\nPress Start to browse the shop.",
    short: "Gift cards, Telegram Stars, Nitro & prepaid cards — paid with crypto. No account needed.",
  },
  es: {
    long:
      "Compra tarjetas de regalo, Telegram Stars y Premium, Discord Nitro, VPN Mullvad y tarjetas prepago — pagando con cripto (BTC, ETH, SOL, USDC, XMR y más de 50).\n\n• Sin cuenta, sin KYC\n• Entrega aquí en minutos\n• Con tecnología de uSwap\n\nPulsa Iniciar para ver la tienda.",
    short: "Tarjetas regalo, Stars, Nitro y prepago — pagando con cripto. Sin cuenta.",
  },
  ru: {
    long:
      "Покупайте подарочные карты, Telegram Stars и Premium, Discord Nitro, VPN Mullvad и предоплаченные карты за криптовалюту (BTC, ETH, SOL, USDC, XMR и ещё 50+).\n\n• Без аккаунта и KYC\n• Доставка прямо сюда за минуты\n• Работает на uSwap\n\nНажмите Start, чтобы открыть магазин.",
    short: "Подарочные карты, Stars, Nitro и карты — за крипту. Без аккаунта.",
  },
};

const bar = (s: string) => console.log(`✓ ${s}`);

// Default (English) + per-language overrides.
await bot.api.setMyCommands(COMMANDS.en!);
bar("commands (default)");
for (const [lang, commands] of Object.entries(COMMANDS)) {
  if (lang === "en") continue;
  await bot.api.setMyCommands(commands, { language_code: lang as never });
  bar(`commands (${lang})`);
}

await bot.api.setMyDescription(DESCRIPTIONS.en!.long);
await bot.api.setMyShortDescription(DESCRIPTIONS.en!.short);
bar("descriptions (default)");
for (const [lang, d] of Object.entries(DESCRIPTIONS)) {
  if (lang === "en") continue;
  await bot.api.setMyDescription(d.long, { language_code: lang as never });
  await bot.api.setMyShortDescription(d.short, { language_code: lang as never });
  bar(`descriptions (${lang})`);
}

console.log("Telegram profile is set up.");
