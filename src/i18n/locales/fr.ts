import type { Locale } from "../index.ts";

export const fr: Partial<Locale> = {
  // ---- home ----
  "home.title": "<b>{brand}</b> — achetez du digital en crypto",
  "home.body":
    "Cartes cadeaux, Telegram Stars et Premium, Discord Nitro, abonnements VPN et cartes prépayées — payés avec les cryptos que vous avez déjà.\n\n<i>Pas de compte. Pas de carte. Choisissez un produit, envoyez un paiement, c'est fait.</i>",
  "home.choose": "Qu'est-ce qui vous ferait plaisir ?",
  "btn.orders": "🧾 Mes commandes",
  "btn.language": "🌐 Langue",
  "btn.help": "❓ Aide",
  "btn.home": "🏠 Accueil",
  "btn.back": "‹ Retour",
  "btn.next": "›",
  "btn.prev": "‹",
  "btn.cancel": "✖️ Annuler",
  "btn.search": "🔍 Rechercher",
  "btn.confirm": "✅ Confirmer",
  "btn.refresh": "🔄 Actualiser",

  // ---- browse ----
  "browse.page": "Page {page}",
  "browse.searchPrompt":
    "🔍 Tapez ce que vous cherchez (par exemple : <i>Amazon</i>, <i>Uber</i>, <i>Steam</i>) :",
  "browse.noResults": "Aucun résultat pour « {query} ». Essayez autre chose.",
  "browse.results": "Résultats pour « {query} »",
  "browse.stale":
    "Ce menu n'est plus à jour — utilisez le dernier message ou envoyez /start.",
  "browse.soldout": "épuisé",

  // ---- product configure ----
  "amount.title": "<b>{product}</b>",
  "amount.rangeUsd": "Choisissez un montant ({min}–{max}) :",
  "amount.rangeUnits": "Combien de {unit} ? ({min}–{max})",
  "amount.custom": "✏️ Montant libre",
  "amount.customPrompt":
    "Entrez un montant entre <b>{min}</b> et <b>{max}</b> {unit} :",
  "amount.invalid":
    "Ça ne marche pas — envoyez un nombre entre {min} et {max}.",
  "dest.prompt.telegram_username":
    "C'est pour qui ? Envoyez le @pseudo Telegram, ou touchez le bouton pour vous l'envoyer à vous-même.",
  "dest.prompt.generic": "Où doit-on livrer ? Envoyez le {label} :",
  "dest.me": "👤 Moi ({username})",
  "dest.skip": "⏭ Passer — nouveau compte",
  "dest.invalid": "Ça ne semble pas correct — vérifiez et renvoyez.",

  // ---- pay asset picker ----
  "pay.title": "<b>Comment voulez-vous payer ?</b>",
  "pay.subtitle": "Vous achetez : {product}",
  "pay.morecoins": "➕ Plus de cryptos",
  "pay.popular": "Populaires",
  "pay.networkTitle": "<b>Quel réseau pour {symbol} ?</b>",
  "pay.networkSubtitle": "Même crypto — choisissez simplement le réseau d'envoi.",

  // ---- quote ----
  "quote.loading": "⏳ Recherche du meilleur prix…",
  "quote.title": "<b>Récapitulatif de commande</b>",
  "quote.youget": "Vous recevez",
  "quote.yousend": "Vous envoyez",
  "quote.deliverto": "Livraison à",
  "quote.via": "sur {network}",
  "quote.eta": "Délai estimé",
  "quote.etaValue": "~{minutes} min après paiement",
  "quote.note":
    "<i>Le prix est bloqué à la confirmation. Envoyez le montant exact affiché à l'écran suivant.</i>",
  "quote.error":
    "⚠️ Impossible d'obtenir un devis : {reason}\nEssayez un autre montant ou une autre crypto.",
  "quote.confirm": "✅ Confirmer et payer",

  // ---- deposit / payment screen ----
  "deposit.title": "<b>Presque fini — envoyez votre paiement</b>",
  "deposit.sendExactly": "Envoyez exactement",
  "deposit.toAddress": "à cette adresse {network} :",
  "deposit.memoWarning": "⚠️ Vous <b>devez</b> inclure ce mémo : <code>{memo}</code>",
  "deposit.tapToCopy": "👆 Touchez l'adresse pour la copier",
  "deposit.expires": "Ce prix est bloqué jusqu'à {time}.",
  "deposit.waiting": "⏳ En attente de votre paiement…",
  "btn.copyAddress": "📋 Copier l'adresse",
  "btn.copyAmount": "📋 Copier le montant",
  "btn.cancelOrder": "✖️ Annuler la commande",

  // ---- order status ----
  "status.awaiting_deposit": "⏳ En attente du paiement",
  "status.detected": "👀 Paiement détecté — confirmation…",
  "status.matched": "✅ Paiement reçu",
  "status.executing": "⚙️ Conversion de votre crypto…",
  "status.delivering": "📦 Livraison de votre produit…",
  "status.completed": "✅ Livré !",
  "status.failed": "❌ Échec",
  "status.refunding": "↩️ Remboursement en cours",
  "status.refunded": "↩️ Remboursé",
  "status.expired": "⌛️ Expiré",
  "status.cancelled": "✖️ Annulé",
  "status.held": "⚠️ Attention requise",
  "order.progress": "<b>Commande {id}</b> — {product}\n\n{status}",
  "order.completedBody":
    "🎉 <b>Votre {product} est arrivé !</b>",
  "order.deliveryHint": "Détails ci-dessous — touchez une valeur pour la copier.",
  "order.failedBody":
    "Un souci avec la commande {id}. Vos fonds sont en sécurité — contactez le support et on règle ça.",
  "order.expiredBody":
    "La commande {id} a expiré avant l'arrivée du paiement. Si vous avez déjà envoyé des fonds, contactez le support — rien n'est perdu.",

  // ---- orders list ----
  "orders.title": "<b>Vos commandes</b>",
  "orders.empty": "Aucune commande pour l'instant. Tout ce que vous achetez apparaît ici — y compris vos codes, à retrouver quand vous voulez.",
  "orders.item": "{status} {product} — {date}",

  // ---- delivery vault ----
  "vault.title": "<b>Votre livraison</b>",
  "vault.pending": "⏳ Préparation de votre livraison…",
  "vault.reveal": "Touchez pour révéler (gardez-le pour vous) :",
  "btn.requestLoginCode": "🔑 Demander un code",

  // ---- language ----
  "lang.title": "<b>Choisissez votre langue</b>",
  "lang.set": "✅ Langue définie sur {language}.",

  // ---- help ----
  "help.title": "<b>Comment fonctionne {brand}</b>",
  "help.body":
    "1️⃣ Choisissez un produit — carte cadeau, Stars, Nitro, VPN, carte prépayée\n2️⃣ Choisissez le montant et le destinataire\n3️⃣ Choisissez une crypto et envoyez un seul paiement à l'adresse fournie\n4️⃣ Votre produit est livré ici même, généralement en quelques minutes\n\n💡 <b>Bon à savoir</b>\n• Pas d'inscription, pas de KYC — un paiement suffit\n• Les prix sont bloqués à la confirmation\n• Vos codes restent enregistrés dans 🧾 Mes commandes\n• Propulsé par <a href=\"https://uswap.net\">uSwap</a>",
  "help.support": "Des questions ? {support}",

  // ---- misc ----
  "error.generic": "⚠️ Une erreur est survenue. Veuillez réessayer.",
  "error.expiredQuote": "Ce prix a expiré — en voici un nouveau.",
  "cancel.done": "Annulé. Envoyez /start quand vous voulez.",
  "input.useButtons": "Utilisez les boutons du dernier message, ou envoyez /start pour commencer.",
  "amount.rangeCount": "Combien ? ({min}–{max})",
  "deposit.lockNote": "🕒 Prix bloqué — envoie de préférence sous 5 minutes ({time}). Les paiements plus tardifs passent au prix du marché.",
  "btn.clearSearch": "✖️ Effacer",
};
