import type { Locale } from "../index.ts";

export const ru: Partial<Locale> = {
  // ---- home ----
  "home.title": "<b>{brand}</b> — покупайте цифровые товары за крипту",
  "home.body":
    "Подарочные карты, Telegram Stars и Premium, Discord Nitro, VPN и предоплаченные карты — за монеты, которые у вас уже есть.\n\n<i>Без аккаунта. Без карты. Выберите товар, отправьте один платёж — готово.</i>",
  "home.choose": "Что хотите купить?",
  "btn.orders": "🧾 Мои заказы",
  "btn.language": "🌐 Язык",
  "btn.help": "❓ Помощь",
  "btn.home": "🏠 Главная",
  "btn.back": "‹ Назад",
  "btn.next": "›",
  "btn.prev": "‹",
  "btn.cancel": "✖️ Отмена",
  "btn.search": "🔍 Поиск",
  "btn.confirm": "✅ Подтвердить",
  "btn.refresh": "🔄 Обновить",

  // ---- browse ----
  "browse.page": "Страница {page}",
  "browse.searchPrompt":
    "🔍 Напишите, что ищете (например: <i>Amazon</i>, <i>Uber</i>, <i>Steam</i>):",
  "browse.noResults": "По запросу «{query}» ничего не найдено. Попробуйте другой запрос.",
  "browse.results": "Результаты по запросу «{query}»",
  "browse.stale":
    "Это меню устарело — используйте последнее сообщение или отправьте /start.",
  "browse.soldout": "распродано",

  // ---- product configure ----
  "amount.title": "<b>{product}</b>",
  "amount.rangeUsd": "Выберите сумму ({min}–{max}):",
  "amount.rangeUnits": "Сколько {unit}? ({min}–{max})",
  "amount.custom": "✏️ Своя сумма",
  "amount.customPrompt":
    "Введите сумму от <b>{min}</b> до <b>{max}</b> {unit}:",
  "amount.invalid":
    "Так не получится — отправьте число от {min} до {max}.",
  "dest.prompt.telegram_username":
    "Для кого это? Отправьте Telegram @username или нажмите кнопку, чтобы отправить себе.",
  "dest.prompt.generic": "Куда доставить? Отправьте {label}:",
  "dest.me": "👤 Мне ({username})",
  "dest.skip": "⏭ Пропустить — создать новый аккаунт",
  "dest.invalid": "Что-то не так — проверьте и отправьте ещё раз.",

  // ---- pay asset picker ----
  "pay.title": "<b>Как хотите оплатить?</b>",
  "pay.subtitle": "Вы покупаете: {product}",
  "pay.morecoins": "➕ Больше монет",
  "pay.popular": "Популярные",
  "pay.networkTitle": "<b>Какая сеть для {symbol}?</b>",
  "pay.networkSubtitle": "Монета та же — просто выберите сеть, из которой будете отправлять.",

  // ---- quote ----
  "quote.loading": "⏳ Ищем для вас лучшую цену…",
  "quote.title": "<b>Детали заказа</b>",
  "quote.youget": "Вы получаете",
  "quote.yousend": "Вы отправляете",
  "quote.deliverto": "Доставка",
  "quote.via": "в сети {network}",
  "quote.eta": "Примерное время",
  "quote.etaValue": "~{minutes} мин после оплаты",
  "quote.note":
    "<i>Цена фиксируется при подтверждении. Отправьте ровно ту сумму, что будет на следующем экране.</i>",
  "quote.error":
    "⚠️ Не удалось получить котировку: {reason}\nПопробуйте другую сумму или другую монету.",
  "quote.confirm": "✅ Подтвердить и получить адрес",

  // ---- deposit / payment screen ----
  "deposit.title": "<b>Почти готово — отправьте платёж</b>",
  "deposit.sendExactly": "Отправьте ровно",
  "deposit.toAddress": "на этот адрес в сети {network}:",
  "deposit.memoWarning": "⚠️ <b>Обязательно</b> укажите этот memo: <code>{memo}</code>",
  "deposit.tapToCopy": "👆 Нажмите на адрес, чтобы скопировать",
  "deposit.expires": "Цена зафиксирована до {time}.",
  "deposit.waiting": "⏳ Ждём ваш платёж…",
  "btn.copyAddress": "📋 Копировать адрес",
  "btn.copyAmount": "📋 Копировать сумму",
  "btn.cancelOrder": "✖️ Отменить заказ",

  // ---- order status ----
  "status.awaiting_deposit": "⏳ Ожидаем оплату",
  "status.detected": "👀 Платёж замечен — подтверждаем…",
  "status.matched": "✅ Платёж получен",
  "status.executing": "⚙️ Конвертируем вашу крипту…",
  "status.delivering": "📦 Доставляем ваш товар…",
  "status.completed": "✅ Доставлено!",
  "status.failed": "❌ Ошибка",
  "status.refunding": "↩️ Возврат средств",
  "status.refunded": "↩️ Средства возвращены",
  "status.expired": "⌛️ Истёк",
  "status.cancelled": "✖️ Отменён",
  "status.held": "⚠️ Требует внимания",
  "order.progress": "<b>Заказ {id}</b> — {product}\n\n{status}",
  "order.completedBody":
    "🎉 <b>Ваш {product} уже здесь!</b>",
  "order.deliveryHint": "Детали ниже — нажмите на любое значение, чтобы скопировать.",
  "order.failedBody":
    "С заказом {id} что-то пошло не так. Ваши средства в безопасности — напишите в поддержку, и мы всё решим.",
  "order.expiredBody":
    "Заказ {id} истёк до поступления оплаты. Если вы уже отправили средства, напишите в поддержку — ничего не потеряно.",

  // ---- orders list ----
  "orders.title": "<b>Ваши заказы</b>",
  "orders.empty": "Заказов пока нет. Всё, что вы покупаете, появится здесь — включая ваши коды, когда бы они ни понадобились.",
  "orders.item": "{status} {product} — {date}",

  // ---- delivery vault ----
  "vault.title": "<b>Ваша доставка</b>",
  "vault.pending": "⏳ Готовим вашу доставку…",
  "vault.reveal": "Нажмите, чтобы показать (никому не показывайте):",
  "btn.requestLoginCode": "🔑 Запросить код входа",

  // ---- language ----
  "lang.title": "<b>Выберите язык</b>",
  "lang.set": "✅ Язык изменён на {language}.",

  // ---- help ----
  "help.title": "<b>Как работает {brand}</b>",
  "help.body":
    "1️⃣ Выберите товар — подарочная карта, Stars, Nitro, VPN, предоплаченная карта\n2️⃣ Укажите сумму и для кого это\n3️⃣ Выберите монету и отправьте один платёж на адрес, который мы дадим\n4️⃣ Товар придёт прямо сюда, обычно за пару минут\n\n💡 <b>Полезно знать</b>\n• Без регистрации и KYC — достаточно одного платежа\n• Цена фиксируется при подтверждении\n• Коды сохраняются в 🧾 Мои заказы\n• Работает на <a href=\"https://uswap.net\">uSwap</a>",
  "help.support": "Вопросы? {support}",

  // ---- misc ----
  "error.generic": "⚠️ Что-то пошло не так. Попробуйте ещё раз.",
  "error.expiredQuote": "Та цена истекла — вот свежая.",
  "cancel.done": "Отменено. Отправьте /start, когда будете готовы.",
  "input.useButtons": "Используйте кнопки в последнем сообщении или отправьте /start, чтобы начать.",
  "amount.rangeCount": "Сколько? ({min}–{max})",
  "deposit.lockNote": "🕒 Цена зафиксирована — лучше отправить в течение 5 минут ({time}). Более поздние платежи пройдут по рыночному курсу.",
  "btn.clearSearch": "✖️ Сбросить",
  "btn.swap": "🔄 Обменять крипту",
  "swap.toTitle": "<b>Что хотите получить?</b>",
  "swap.toSubtitle": "Меняйте любую монету на любую — без аккаунта.",
  "swap.addrPrompt": "Отправьте адрес <b>{symbol}</b> ({network}), на который придёт обмен:",
  "swap.memoPrompt": "Нужен ли для этого адреса <b>memo/tag</b>? Отправьте его или пропустите.",
  "swap.amountPrompt": "Сколько меняем? Отправьте сумму в <b>{symbol}</b> (например <code>0.1</code>) или в долларах (например <code>$100</code>):",
  "swap.youreceive": "Вы получите (примерно)",
  "swap.invalidAmount": "Отправьте число, например <code>0.25</code> или <code>$100</code>.",
};
