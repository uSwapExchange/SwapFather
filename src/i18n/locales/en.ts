/**
 * English — the master locale. Every other locale falls back to these strings,
 * so this file defines the full set of keys.
 *
 * Conventions:
 *  - Strings may contain Telegram HTML (parse_mode: "HTML").
 *  - `{placeholders}` are interpolated by the i18n engine.
 *  - Keep button labels short — Telegram truncates long inline buttons on
 *    narrow screens.
 */

export const en = {
  // ---- home ----
  "home.title": "<b>{brand}</b> — buy digital stuff with crypto",
  "home.body":
    "Gift cards, Telegram Stars & Premium, Discord Nitro, VPN time and prepaid cards — paid with the coins you already hold.\n\n<i>No account. No card. Pick a product, send one payment, done.</i>",
  "home.choose": "What would you like to buy?",
  "btn.orders": "🧾 My orders",
  "btn.language": "🌐 Language",
  "btn.help": "❓ Help",
  "btn.home": "🏠 Home",
  "btn.back": "‹ Back",
  "btn.next": "›",
  "btn.prev": "‹",
  "btn.cancel": "✖️ Cancel",
  "btn.search": "🔍 Search",
  "btn.clearSearch": "✖️ Clear",
  "btn.confirm": "✅ Confirm",
  "btn.refresh": "🔄 Refresh",

  // ---- browse ----
  "browse.page": "Page {page}",
  "browse.searchPrompt":
    "🔍 Type what you're looking for (for example: <i>Amazon</i>, <i>Uber</i>, <i>Steam</i>):",
  "browse.noResults": "Nothing found for “{query}”. Try a different search.",
  "browse.results": "Results for “{query}”",
  "browse.stale":
    "This menu is out of date — use the latest message or send /start.",
  "browse.soldout": "sold out",

  // ---- product configure ----
  "amount.title": "<b>{product}</b>",
  "amount.rangeUsd": "Choose an amount ({min}–{max}):",
  "amount.rangeUnits": "How many {unit}? ({min}–{max})",
  "amount.rangeCount": "How many? ({min}–{max})",
  "amount.custom": "✏️ Custom amount",
  "amount.customPrompt":
    "Type an amount between <b>{min}</b> and <b>{max}</b> {unit}:",
  "amount.invalid":
    "That doesn't work — send a number between {min} and {max}.",
  "dest.prompt.telegram_username":
    "Who is this for? Send the Telegram @username, or tap the button to send it to yourself.",
  "dest.prompt.generic": "Where should we deliver it? Send the {label}:",
  "dest.me": "👤 Me ({username})",
  "dest.skip": "⏭ Skip — create new account",
  "dest.invalid": "That doesn't look right — please check it and send again.",

  // ---- pay asset picker ----
  "pay.title": "<b>How do you want to pay?</b>",
  "pay.subtitle": "You're buying: {product}",
  "pay.morecoins": "➕ More coins",
  "pay.popular": "Popular",
  "pay.networkTitle": "<b>Which network for {symbol}?</b>",
  "pay.networkSubtitle": "Same coin — just pick the network you'll send from.",

  // ---- quote ----
  "quote.loading": "⏳ Getting you the best price…",
  "quote.title": "<b>Order summary</b>",
  "quote.youget": "You get",
  "quote.yousend": "You send",
  "quote.deliverto": "Deliver to",
  "quote.via": "on {network}",
  "quote.eta": "Estimated time",
  "quote.etaValue": "~{minutes} min after payment",
  "quote.note":
    "<i>Price locks when you confirm. Send the exact amount shown on the next screen.</i>",
  "quote.error":
    "⚠️ Couldn't get a quote: {reason}\nTry a different amount or payment coin.",
  "quote.confirm": "✅ Confirm & get address",

  // ---- deposit / payment screen ----
  "deposit.title": "<b>Almost there — send your payment</b>",
  "deposit.sendExactly": "Send exactly",
  "deposit.toAddress": "to this {network} address:",
  "deposit.memoWarning": "⚠️ You <b>must</b> include this memo: <code>{memo}</code>",
  "deposit.tapToCopy": "👆 Tap the address to copy it",
  "deposit.expires": "This price is locked until {time}.",
  "deposit.lockNote":
    "🕒 Price locked — best sent within 5 minutes ({time}). Later payments still go through at the live market rate.",
  "deposit.waiting": "⏳ Waiting for your payment…",
  "btn.copyAddress": "📋 Copy address",
  "btn.copyAmount": "📋 Copy amount",
  "btn.cancelOrder": "✖️ Cancel order",

  // ---- order status ----
  "status.awaiting_deposit": "⏳ Waiting for payment",
  "status.detected": "👀 Payment detected — confirming…",
  "status.matched": "✅ Payment received",
  "status.executing": "⚙️ Converting your crypto…",
  "status.delivering": "📦 Delivering your product…",
  "status.completed": "✅ Delivered!",
  "status.failed": "❌ Failed",
  "status.refunding": "↩️ Refunding",
  "status.refunded": "↩️ Refunded",
  "status.expired": "⌛️ Expired",
  "status.cancelled": "✖️ Cancelled",
  "status.held": "⚠️ Needs attention",
  "order.progress": "<b>Order {id}</b> — {product}\n\n{status}",
  "order.completedBody":
    "🎉 <b>Your {product} is here!</b>",
  "order.deliveryHint": "Details below — tap any value to copy it.",
  "order.failedBody":
    "Something went wrong with order {id}. Your funds are safe — contact support and we'll sort it out.",
  "order.expiredBody":
    "Order {id} expired before payment arrived. If you already sent funds, contact support — nothing is lost.",

  // ---- orders list ----
  "orders.title": "<b>Your orders</b>",
  "orders.empty": "No orders yet. Everything you buy shows up here — including your codes, any time you need them again.",
  "orders.item": "{status} {product} — {date}",

  // ---- delivery vault ----
  "vault.title": "<b>Your delivery</b>",
  "vault.pending": "⏳ Preparing your delivery…",
  "vault.reveal": "Tap to reveal (keep it private):",
  "btn.requestLoginCode": "🔑 Request login code",

  // ---- language ----
  "lang.title": "<b>Choose your language</b>",
  "lang.set": "✅ Language set to {language}.",

  // ---- help ----
  "help.title": "<b>How {brand} works</b>",
  "help.body":
    "1️⃣ Pick a product — gift card, Stars, Nitro, VPN, prepaid card\n2️⃣ Choose the amount and who it's for\n3️⃣ Pick a coin and send one payment to the address we give you\n4️⃣ Your product is delivered right here, usually in minutes\n\n💡 <b>Good to know</b>\n• No signup, no KYC — a payment is all it takes\n• Prices are locked when you confirm\n• Codes stay saved under 🧾 My orders\n• Powered by <a href=\"https://uswap.net\">uSwap</a>",
  "help.support": "Questions? {support}",

  // ---- misc ----
  "error.generic": "⚠️ Something went wrong. Please try again.",
  "error.expiredQuote": "That price expired — here's a fresh one.",
  "cancel.done": "Cancelled. Send /start whenever you're ready.",
  "input.useButtons": "Use the buttons on the last message, or send /start to begin.",
} as const;
