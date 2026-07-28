import type { Locale } from "../index.ts";

export const de: Partial<Locale> = {
  // ---- home ----
  "home.title": "<b>{brand}</b> — digitale Produkte mit Krypto kaufen",
  "home.body":
    "Geschenkkarten, Telegram Stars & Premium, Discord Nitro, VPN-Zeit und Prepaid-Karten — bezahlt mit den Coins, die du schon hast.\n\n<i>Kein Konto. Keine Karte. Produkt wählen, eine Zahlung senden, fertig.</i>",
  "home.choose": "Was möchtest du kaufen?",
  "btn.orders": "🧾 Meine Bestellungen",
  "btn.language": "🌐 Sprache",
  "btn.help": "❓ Hilfe",
  "btn.home": "🏠 Start",
  "btn.back": "‹ Zurück",
  "btn.next": "›",
  "btn.prev": "‹",
  "btn.cancel": "✖️ Abbrechen",
  "btn.search": "🔍 Suchen",
  "btn.confirm": "✅ Bestätigen",
  "btn.refresh": "🔄 Aktualisieren",

  // ---- browse ----
  "browse.page": "Seite {page}",
  "browse.searchPrompt":
    "🔍 Schreib, wonach du suchst (zum Beispiel: <i>Amazon</i>, <i>Uber</i>, <i>Steam</i>):",
  "browse.noResults": "Nichts gefunden für „{query}“. Versuch eine andere Suche.",
  "browse.results": "Ergebnisse für „{query}“",
  "browse.stale":
    "Dieses Menü ist veraltet — nutze die neueste Nachricht oder sende /start.",
  "browse.soldout": "ausverkauft",

  // ---- product configure ----
  "amount.title": "<b>{product}</b>",
  "amount.rangeUsd": "Wähl einen Betrag ({min}–{max}):",
  "amount.rangeUnits": "Wie viele {unit}? ({min}–{max})",
  "amount.custom": "✏️ Eigener Betrag",
  "amount.customPrompt":
    "Gib einen Betrag zwischen <b>{min}</b> und <b>{max}</b> {unit} ein:",
  "amount.invalid":
    "Das geht so nicht — sende eine Zahl zwischen {min} und {max}.",
  "dest.prompt.telegram_username":
    "Für wen ist das? Sende den Telegram-@username oder tippe auf den Button, um es dir selbst zu schicken.",
  "dest.prompt.generic": "Wohin sollen wir liefern? Sende {label}:",
  "dest.me": "👤 Ich ({username})",
  "dest.skip": "⏭ Überspringen — neues Konto erstellen",
  "dest.invalid": "Das sieht nicht richtig aus — bitte prüfen und nochmal senden.",

  // ---- pay asset picker ----
  "pay.title": "<b>Wie möchtest du bezahlen?</b>",
  "pay.subtitle": "Du kaufst: {product}",
  "pay.morecoins": "➕ Mehr Coins",
  "pay.popular": "Beliebt",
  "pay.networkTitle": "<b>Welches Netzwerk für {symbol}?</b>",
  "pay.networkSubtitle": "Gleicher Coin — wähl einfach das Netzwerk, von dem du sendest.",

  // ---- quote ----
  "quote.loading": "⏳ Wir holen dir den besten Preis…",
  "quote.title": "<b>Bestellübersicht</b>",
  "quote.youget": "Du bekommst",
  "quote.yousend": "Du sendest",
  "quote.deliverto": "Lieferung an",
  "quote.via": "über {network}",
  "quote.eta": "Geschätzte Zeit",
  "quote.etaValue": "~{minutes} Min. nach Zahlung",
  "quote.note":
    "<i>Der Preis wird bei Bestätigung fixiert. Sende genau den Betrag, der auf dem nächsten Bildschirm steht.</i>",
  "quote.error":
    "⚠️ Kein Angebot möglich: {reason}\nVersuch einen anderen Betrag oder einen anderen Coin.",
  "quote.confirm": "✅ Bestätigen & Adresse erhalten",

  // ---- deposit / payment screen ----
  "deposit.title": "<b>Fast geschafft — sende deine Zahlung</b>",
  "deposit.sendExactly": "Sende genau",
  "deposit.toAddress": "an diese {network}-Adresse:",
  "deposit.memoWarning": "⚠️ Du <b>musst</b> dieses Memo angeben: <code>{memo}</code>",
  "deposit.tapToCopy": "👆 Tippe auf die Adresse, um sie zu kopieren",
  "deposit.expires": "Dieser Preis ist bis {time} fixiert.",
  "deposit.waiting": "⏳ Warten auf deine Zahlung…",
  "btn.copyAddress": "📋 Adresse kopieren",
  "btn.copyAmount": "📋 Betrag kopieren",
  "btn.cancelOrder": "✖️ Bestellung abbrechen",

  // ---- order status ----
  "status.awaiting_deposit": "⏳ Warten auf Zahlung",
  "status.detected": "👀 Zahlung erkannt — wird bestätigt…",
  "status.matched": "✅ Zahlung erhalten",
  "status.executing": "⚙️ Deine Krypto wird umgetauscht…",
  "status.delivering": "📦 Dein Produkt wird geliefert…",
  "status.completed": "✅ Geliefert!",
  "status.failed": "❌ Fehlgeschlagen",
  "status.refunding": "↩️ Rückerstattung läuft",
  "status.refunded": "↩️ Rückerstattet",
  "status.expired": "⌛️ Abgelaufen",
  "status.cancelled": "✖️ Abgebrochen",
  "status.held": "⚠️ Braucht Aufmerksamkeit",
  "order.progress": "<b>Bestellung {id}</b> — {product}\n\n{status}",
  "order.completedBody":
    "🎉 <b>Dein {product} ist da!</b>",
  "order.deliveryHint": "Details unten — tippe auf einen Wert, um ihn zu kopieren.",
  "order.failedBody":
    "Bei Bestellung {id} ist etwas schiefgelaufen. Dein Geld ist sicher — melde dich beim Support und wir klären das.",
  "order.expiredBody":
    "Bestellung {id} ist abgelaufen, bevor die Zahlung ankam. Falls du schon gesendet hast, melde dich beim Support — nichts ist verloren.",

  // ---- orders list ----
  "orders.title": "<b>Deine Bestellungen</b>",
  "orders.empty": "Noch keine Bestellungen. Alles, was du kaufst, erscheint hier — inklusive deiner Codes, wann immer du sie wieder brauchst.",
  "orders.item": "{status} {product} — {date}",

  // ---- delivery vault ----
  "vault.title": "<b>Deine Lieferung</b>",
  "vault.pending": "⏳ Deine Lieferung wird vorbereitet…",
  "vault.reveal": "Tippen zum Anzeigen (nicht weitergeben):",
  "btn.requestLoginCode": "🔑 Login-Code anfordern",

  // ---- language ----
  "lang.title": "<b>Wähl deine Sprache</b>",
  "lang.set": "✅ Sprache auf {language} umgestellt.",

  // ---- help ----
  "help.title": "<b>So funktioniert {brand}</b>",
  "help.body":
    "1️⃣ Produkt wählen — Geschenkkarte, Stars, Nitro, VPN, Prepaid-Karte\n2️⃣ Betrag wählen und für wen es ist\n3️⃣ Coin auswählen und eine Zahlung an die Adresse senden, die wir dir geben\n4️⃣ Dein Produkt kommt direkt hier an, meist in Minuten\n\n💡 <b>Gut zu wissen</b>\n• Keine Anmeldung, kein KYC — eine Zahlung reicht\n• Preise werden bei Bestätigung fixiert\n• Codes bleiben unter 🧾 Meine Bestellungen gespeichert\n• Powered by <a href=\"https://uswap.net\">uSwap</a>",
  "help.support": "Fragen? {support}",

  // ---- misc ----
  "error.generic": "⚠️ Etwas ist schiefgelaufen. Bitte versuch es nochmal.",
  "error.expiredQuote": "Der Preis ist abgelaufen — hier ist ein frischer.",
  "cancel.done": "Abgebrochen. Sende /start, wann immer du bereit bist.",
  "input.useButtons": "Nutze die Buttons der letzten Nachricht oder sende /start, um zu beginnen.",
  "amount.rangeCount": "Wie viele? ({min}–{max})",
  "deposit.lockNote": "🕒 Preis fixiert — am besten innerhalb von 5 Minuten senden ({time}). Spätere Zahlungen laufen zum Marktkurs durch.",
  "btn.clearSearch": "✖️ Löschen",
  "btn.swap": "🔄 Krypto tauschen",
  "swap.toTitle": "<b>Was möchtest du erhalten?</b>",
  "swap.toSubtitle": "Tausche jede Coin gegen jede andere — ohne Konto.",
  "swap.addrPrompt": "Sende die <b>{symbol}</b>-Adresse ({network}), die deinen Tausch erhalten soll:",
  "swap.memoPrompt": "Braucht diese Adresse ein <b>Memo/Tag</b>? Sende es jetzt oder überspringe.",
  "swap.amountPrompt": "Wie viel tauschst du? Sende einen Betrag in <b>{symbol}</b> (z. B. <code>0.1</code>) oder in Dollar (z. B. <code>$100</code>):",
  "swap.youreceive": "Du erhältst (geschätzt)",
  "swap.invalidAmount": "Sende eine Zahl wie <code>0.25</code> oder <code>$100</code>.",
  "swap.minDeposit": "Minimum: <b>{min}</b> (≈ {usd})",
  "btn.refundAddr": "↩️ Rückerstattungsadresse hinzufügen",
  "refund.prompt": "Optionales Sicherheitsnetz: sende eine <b>{symbol}</b>-Adresse für automatische Rückerstattung, falls bei dieser Bestellung etwas schiefgeht.",
  "refund.set": "✅ Rückerstattungsadresse für diese Bestellung gespeichert.",
  "swap.receive": "Du erhältst",
  "swap.notset": "nicht gesetzt",
  "btn.flipPair": "🔁",
  "btn.setAmount": "💵 Betrag",
  "btn.setAddress": "📍 Adresse",
  "btn.getQuote": "⚡️ Kurs holen",
  "swap.incomplete": "Lege zuerst Betrag und Empfangsadresse fest.",
};
