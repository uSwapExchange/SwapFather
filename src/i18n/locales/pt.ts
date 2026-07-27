import type { Locale } from "../index.ts";

export const pt: Partial<Locale> = {
  // ---- home ----
  "home.title": "<b>Best B4U</b> — compre produtos digitais com cripto",
  "home.body":
    "Cartões-presente, Telegram Stars e Premium, Discord Nitro, tempo de VPN e cartões pré-pagos — pagos com as moedas que você já tem.\n\n<i>Sem conta. Sem cartão. Escolha um produto, envie um pagamento e pronto.</i>",
  "home.choose": "O que você quer comprar?",
  "btn.orders": "🧾 Meus pedidos",
  "btn.language": "🌐 Idioma",
  "btn.help": "❓ Ajuda",
  "btn.home": "🏠 Início",
  "btn.back": "‹ Voltar",
  "btn.next": "›",
  "btn.prev": "‹",
  "btn.cancel": "✖️ Cancelar",
  "btn.search": "🔍 Buscar",
  "btn.confirm": "✅ Confirmar",
  "btn.refresh": "🔄 Atualizar",

  // ---- browse ----
  "browse.page": "Página {page}",
  "browse.searchPrompt":
    "🔍 Digite o que você procura (por exemplo: <i>Amazon</i>, <i>Uber</i>, <i>Steam</i>):",
  "browse.noResults": "Nada encontrado para “{query}”. Tente outra busca.",
  "browse.results": "Resultados para “{query}”",
  "browse.stale":
    "Este menu está desatualizado — use a mensagem mais recente ou envie /start.",
  "browse.soldout": "esgotado",

  // ---- product configure ----
  "amount.title": "<b>{product}</b>",
  "amount.rangeUsd": "Escolha um valor ({min}–{max}):",
  "amount.rangeUnits": "Quantas {unit}? ({min}–{max})",
  "amount.custom": "✏️ Outro valor",
  "amount.customPrompt":
    "Digite um valor entre <b>{min}</b> e <b>{max}</b> {unit}:",
  "amount.invalid":
    "Assim não dá — envie um número entre {min} e {max}.",
  "dest.prompt.telegram_username":
    "É para quem? Envie o @usuário do Telegram, ou toque no botão para enviar para você mesmo.",
  "dest.prompt.generic": "Onde devemos entregar? Envie o {label}:",
  "dest.me": "👤 Eu ({username})",
  "dest.skip": "⏭ Pular — criar conta nova",
  "dest.invalid": "Isso não parece certo — confira e envie de novo.",

  // ---- pay asset picker ----
  "pay.title": "<b>Como você quer pagar?</b>",
  "pay.subtitle": "Você está comprando: {product}",
  "pay.morecoins": "➕ Mais moedas",
  "pay.popular": "Populares",
  "pay.networkTitle": "<b>Qual rede para {symbol}?</b>",
  "pay.networkSubtitle": "Mesma moeda — só escolha a rede de onde você vai enviar.",

  // ---- quote ----
  "quote.loading": "⏳ Buscando o melhor preço…",
  "quote.title": "<b>Resumo do pedido</b>",
  "quote.youget": "Você recebe",
  "quote.yousend": "Você envia",
  "quote.deliverto": "Entregar para",
  "quote.via": "na {network}",
  "quote.eta": "Tempo estimado",
  "quote.etaValue": "~{minutes} min após o pagamento",
  "quote.note":
    "<i>O preço trava quando você confirma. Envie o valor exato mostrado na próxima tela.</i>",
  "quote.error":
    "⚠️ Não conseguimos uma cotação: {reason}\nTente outro valor ou outra moeda de pagamento.",
  "quote.confirm": "✅ Confirmar e ver endereço",

  // ---- deposit / payment screen ----
  "deposit.title": "<b>Quase lá — envie seu pagamento</b>",
  "deposit.sendExactly": "Envie exatamente",
  "deposit.toAddress": "para este endereço {network}:",
  "deposit.memoWarning": "⚠️ Você <b>precisa</b> incluir este memo: <code>{memo}</code>",
  "deposit.tapToCopy": "👆 Toque no endereço para copiar",
  "deposit.expires": "Este preço fica travado até {time}.",
  "deposit.waiting": "⏳ Aguardando seu pagamento…",
  "btn.copyAddress": "📋 Copiar endereço",
  "btn.copyAmount": "📋 Copiar valor",
  "btn.cancelOrder": "✖️ Cancelar pedido",

  // ---- order status ----
  "status.awaiting_deposit": "⏳ Aguardando pagamento",
  "status.detected": "👀 Pagamento detectado — confirmando…",
  "status.matched": "✅ Pagamento recebido",
  "status.executing": "⚙️ Convertendo sua cripto…",
  "status.delivering": "📦 Entregando seu produto…",
  "status.completed": "✅ Entregue!",
  "status.failed": "❌ Falhou",
  "status.refunding": "↩️ Reembolsando",
  "status.refunded": "↩️ Reembolsado",
  "status.expired": "⌛️ Expirado",
  "status.cancelled": "✖️ Cancelado",
  "status.held": "⚠️ Precisa de atenção",
  "order.progress": "<b>Pedido {id}</b> — {product}\n\n{status}",
  "order.completedBody":
    "🎉 <b>Seu {product} chegou!</b>",
  "order.deliveryHint": "Detalhes abaixo — toque em qualquer valor para copiar.",
  "order.failedBody":
    "Algo deu errado com o pedido {id}. Seus fundos estão seguros — fale com o suporte e a gente resolve.",
  "order.expiredBody":
    "O pedido {id} expirou antes do pagamento chegar. Se você já enviou os fundos, fale com o suporte — nada se perde.",

  // ---- orders list ----
  "orders.title": "<b>Seus pedidos</b>",
  "orders.empty": "Nenhum pedido ainda. Tudo o que você comprar aparece aqui — inclusive seus códigos, sempre que precisar deles de novo.",
  "orders.item": "{status} {product} — {date}",

  // ---- delivery vault ----
  "vault.title": "<b>Sua entrega</b>",
  "vault.pending": "⏳ Preparando sua entrega…",
  "vault.reveal": "Toque para revelar (mantenha em sigilo):",
  "btn.requestLoginCode": "🔑 Pedir código de login",

  // ---- language ----
  "lang.title": "<b>Escolha seu idioma</b>",
  "lang.set": "✅ Idioma definido para {language}.",

  // ---- help ----
  "help.title": "<b>Como o Best B4U funciona</b>",
  "help.body":
    "1️⃣ Escolha um produto — cartão-presente, Stars, Nitro, VPN, cartão pré-pago\n2️⃣ Escolha o valor e para quem é\n3️⃣ Escolha uma moeda e envie um único pagamento para o endereço que fornecemos\n4️⃣ Seu produto é entregue aqui mesmo, geralmente em minutos\n\n💡 <b>Bom saber</b>\n• Sem cadastro, sem KYC — basta um pagamento\n• Os preços travam quando você confirma\n• Os códigos ficam salvos em 🧾 Meus pedidos\n• Tecnologia <a href=\"https://uswap.net\">uSwap</a>",
  "help.support": "Dúvidas? @uSwapSupport",

  // ---- misc ----
  "error.generic": "⚠️ Algo deu errado. Tente de novo.",
  "error.expiredQuote": "Esse preço expirou — aqui vai um novo.",
  "cancel.done": "Cancelado. Envie /start quando quiser.",
  "input.useButtons": "Use os botões da última mensagem, ou envie /start para começar.",
  "amount.rangeCount": "Quantos? ({min}–{max})",
  "deposit.lockNote": "🕒 Preço travado — envie em até 5 minutos ({time}). Pagamentos depois disso saem pelo preço de mercado.",
  "btn.clearSearch": "✖️ Limpar",
};
