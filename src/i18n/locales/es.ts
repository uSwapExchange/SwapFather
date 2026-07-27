import type { Locale } from "../index.ts";

export const es: Partial<Locale> = {
  // ---- home ----
  "home.title": "<b>{brand}</b> — compra productos digitales con cripto",
  "home.body":
    "Tarjetas de regalo, Telegram Stars y Premium, Discord Nitro, tiempo de VPN y tarjetas prepago — pagadas con las monedas que ya tienes.\n\n<i>Sin cuenta. Sin tarjeta. Elige un producto, envía un pago y listo.</i>",
  "home.choose": "¿Qué te gustaría comprar?",
  "btn.orders": "🧾 Mis pedidos",
  "btn.language": "🌐 Idioma",
  "btn.help": "❓ Ayuda",
  "btn.home": "🏠 Inicio",
  "btn.back": "‹ Atrás",
  "btn.next": "›",
  "btn.prev": "‹",
  "btn.cancel": "✖️ Cancelar",
  "btn.search": "🔍 Buscar",
  "btn.confirm": "✅ Confirmar",
  "btn.refresh": "🔄 Actualizar",

  // ---- browse ----
  "browse.page": "Página {page}",
  "browse.searchPrompt":
    "🔍 Escribe lo que buscas (por ejemplo: <i>Amazon</i>, <i>Uber</i>, <i>Steam</i>):",
  "browse.noResults": "No encontramos nada para “{query}”. Prueba con otra búsqueda.",
  "browse.results": "Resultados para “{query}”",
  "browse.stale":
    "Este menú está desactualizado — usa el mensaje más reciente o envía /start.",
  "browse.soldout": "agotado",

  // ---- product configure ----
  "amount.title": "<b>{product}</b>",
  "amount.rangeUsd": "Elige un importe ({min}–{max}):",
  "amount.rangeUnits": "¿Cuántas {unit}? ({min}–{max})",
  "amount.custom": "✏️ Otro importe",
  "amount.customPrompt":
    "Escribe un importe entre <b>{min}</b> y <b>{max}</b> {unit}:",
  "amount.invalid":
    "Eso no funciona — envía un número entre {min} y {max}.",
  "dest.prompt.telegram_username":
    "¿Para quién es? Envía el @usuario de Telegram, o toca el botón para enviártelo a ti.",
  "dest.prompt.generic": "¿Dónde lo entregamos? Envía el {label}:",
  "dest.me": "👤 Yo ({username})",
  "dest.skip": "⏭ Omitir — crear cuenta nueva",
  "dest.invalid": "Eso no parece correcto — revísalo y envíalo de nuevo.",

  // ---- pay asset picker ----
  "pay.title": "<b>¿Cómo quieres pagar?</b>",
  "pay.subtitle": "Estás comprando: {product}",
  "pay.morecoins": "➕ Más monedas",
  "pay.popular": "Populares",
  "pay.networkTitle": "<b>¿Qué red para {symbol}?</b>",
  "pay.networkSubtitle": "Es la misma moneda — solo elige la red desde la que enviarás.",

  // ---- quote ----
  "quote.loading": "⏳ Buscando el mejor precio…",
  "quote.title": "<b>Resumen del pedido</b>",
  "quote.youget": "Recibes",
  "quote.yousend": "Envías",
  "quote.deliverto": "Entrega a",
  "quote.via": "en {network}",
  "quote.eta": "Tiempo estimado",
  "quote.etaValue": "~{minutes} min después del pago",
  "quote.note":
    "<i>El precio se fija al confirmar. Envía el importe exacto que aparece en la siguiente pantalla.</i>",
  "quote.error":
    "⚠️ No pudimos obtener una cotización: {reason}\nPrueba con otro importe u otra moneda de pago.",
  "quote.confirm": "✅ Confirmar y ver dirección",

  // ---- deposit / payment screen ----
  "deposit.title": "<b>Ya casi — envía tu pago</b>",
  "deposit.sendExactly": "Envía exactamente",
  "deposit.toAddress": "a esta dirección de {network}:",
  "deposit.memoWarning": "⚠️ <b>Debes</b> incluir este memo: <code>{memo}</code>",
  "deposit.tapToCopy": "👆 Toca la dirección para copiarla",
  "deposit.expires": "Este precio está fijado hasta las {time}.",
  "deposit.waiting": "⏳ Esperando tu pago…",
  "btn.copyAddress": "📋 Copiar dirección",
  "btn.copyAmount": "📋 Copiar importe",
  "btn.cancelOrder": "✖️ Cancelar pedido",

  // ---- order status ----
  "status.awaiting_deposit": "⏳ Esperando el pago",
  "status.detected": "👀 Pago detectado — confirmando…",
  "status.matched": "✅ Pago recibido",
  "status.executing": "⚙️ Convirtiendo tu cripto…",
  "status.delivering": "📦 Entregando tu producto…",
  "status.completed": "✅ ¡Entregado!",
  "status.failed": "❌ Fallido",
  "status.refunding": "↩️ Reembolsando",
  "status.refunded": "↩️ Reembolsado",
  "status.expired": "⌛️ Expirado",
  "status.cancelled": "✖️ Cancelado",
  "status.held": "⚠️ Requiere atención",
  "order.progress": "<b>Pedido {id}</b> — {product}\n\n{status}",
  "order.completedBody":
    "🎉 <b>¡Tu {product} ya está aquí!</b>",
  "order.deliveryHint": "Detalles abajo — toca cualquier valor para copiarlo.",
  "order.failedBody":
    "Algo salió mal con el pedido {id}. Tus fondos están a salvo — contacta con soporte y lo resolvemos.",
  "order.expiredBody":
    "El pedido {id} expiró antes de que llegara el pago. Si ya enviaste fondos, contacta con soporte — no se pierde nada.",

  // ---- orders list ----
  "orders.title": "<b>Tus pedidos</b>",
  "orders.empty": "Aún no hay pedidos. Todo lo que compres aparece aquí — incluidos tus códigos, cuando los vuelvas a necesitar.",
  "orders.item": "{status} {product} — {date}",

  // ---- delivery vault ----
  "vault.title": "<b>Tu entrega</b>",
  "vault.pending": "⏳ Preparando tu entrega…",
  "vault.reveal": "Toca para revelar (mantenlo en privado):",
  "btn.requestLoginCode": "🔑 Pedir código de acceso",

  // ---- language ----
  "lang.title": "<b>Elige tu idioma</b>",
  "lang.set": "✅ Idioma cambiado a {language}.",

  // ---- help ----
  "help.title": "<b>Cómo funciona {brand}</b>",
  "help.body":
    "1️⃣ Elige un producto — tarjeta de regalo, Stars, Nitro, VPN, tarjeta prepago\n2️⃣ Elige el importe y para quién es\n3️⃣ Elige una moneda y envía un solo pago a la dirección que te damos\n4️⃣ Tu producto se entrega aquí mismo, normalmente en minutos\n\n💡 <b>Bueno saberlo</b>\n• Sin registro, sin KYC — con un pago basta\n• Los precios se fijan al confirmar\n• Los códigos quedan guardados en 🧾 Mis pedidos\n• Con la tecnología de <a href=\"https://uswap.net\">uSwap</a>",
  "help.support": "¿Dudas? {support}",

  // ---- misc ----
  "error.generic": "⚠️ Algo salió mal. Inténtalo de nuevo.",
  "error.expiredQuote": "Ese precio expiró — aquí tienes uno nuevo.",
  "cancel.done": "Cancelado. Envía /start cuando quieras.",
  "input.useButtons": "Usa los botones del último mensaje, o envía /start para empezar.",
  "amount.rangeCount": "¿Cuántos? ({min}–{max})",
  "deposit.lockNote": "🕒 Precio bloqueado — mejor envía en 5 minutos ({time}). Los pagos posteriores se procesan al precio de mercado.",
  "btn.clearSearch": "✖️ Borrar",
  "btn.swap": "🔄 Intercambiar cripto",
  "swap.toTitle": "<b>¿Qué quieres recibir?</b>",
  "swap.toSubtitle": "Cambia cualquier moneda por otra — sin cuenta.",
  "swap.addrPrompt": "Envía la dirección de <b>{symbol}</b> ({network}) que recibirá tu intercambio:",
  "swap.memoPrompt": "¿Esta dirección necesita un <b>memo/tag</b>? Envíalo ahora, o salta este paso.",
  "swap.amountPrompt": "¿Cuánto quieres cambiar? Envía una cantidad en <b>{symbol}</b> (p. ej. <code>0.1</code>) o en dólares (p. ej. <code>$100</code>):",
  "swap.youreceive": "Recibes (estimado)",
  "swap.invalidAmount": "Envía un número como <code>0.25</code> o <code>$100</code>.",
  "swap.minDeposit": "Mínimo: <b>{min}</b> (≈ {usd})",
  "btn.refundAddr": "↩️ Añadir dirección de reembolso",
  "refund.prompt": "Red de seguridad opcional: envía una dirección de <b>{symbol}</b> para reembolsos automáticos si algo sale mal con este pedido.",
  "refund.set": "✅ Dirección de reembolso guardada para este pedido.",
};
