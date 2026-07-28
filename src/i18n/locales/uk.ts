import type { Locale } from "../index.ts";

export const uk: Partial<Locale> = {
  // ---- home ----
  "home.title": "<b>{brand}</b> — купуйте цифрові товари за крипту",
  "home.body":
    "Оберіть товар, оплатіть будь-якою монетою — доставка сюди за лічені хвилини. <i>Без акаунта.</i>",
  "home.choose": "Що бажаєте купити?",
  "btn.orders": "🧾 Мої замовлення",
  "btn.language": "🌐 Мова",
  "btn.help": "❓ Допомога",
  "btn.home": "🏠 Головна",
  "btn.back": "‹ Назад",
  "btn.next": "›",
  "btn.prev": "‹",
  "btn.cancel": "✖️ Скасувати",
  "btn.search": "🔍 Пошук",
  "btn.confirm": "✅ Підтвердити",
  "btn.refresh": "🔄 Оновити",

  // ---- browse ----
  "browse.page": "Сторінка {page}",
  "browse.searchPrompt":
    "🔍 Напишіть, що шукаєте (наприклад: <i>Amazon</i>, <i>Uber</i>, <i>Steam</i>):",
  "browse.noResults": "За запитом «{query}» нічого не знайдено. Спробуйте інший запит.",
  "browse.results": "Результати за запитом «{query}»",
  "browse.stale":
    "Це меню застаріло — скористайтеся останнім повідомленням або надішліть /start.",
  "browse.soldout": "розпродано",

  // ---- product configure ----
  "amount.title": "<b>{product}</b>",
  "amount.rangeUsd": "Оберіть суму ({min}–{max}):",
  "amount.rangeUnits": "Скільки {unit}? ({min}–{max})",
  "amount.custom": "✏️ Своя сума",
  "amount.customPrompt":
    "Введіть суму від <b>{min}</b> до <b>{max}</b> {unit}:",
  "amount.invalid":
    "Так не вийде — надішліть число від {min} до {max}.",
  "dest.prompt.telegram_username":
    "Для кого це? Надішліть Telegram @username або натисніть кнопку, щоб надіслати собі.",
  "dest.prompt.generic": "Куди доставити? Надішліть {label}:",
  "dest.me": "👤 Мені ({username})",
  "dest.skip": "⏭ Пропустити — створити новий акаунт",
  "dest.invalid": "Щось не так — перевірте і надішліть ще раз.",

  // ---- pay asset picker ----
  "pay.title": "<b>Як бажаєте оплатити?</b>",
  "pay.subtitle": "Ви купуєте: {product}",
  "pay.morecoins": "➕ Більше монет",
  "pay.popular": "Популярні",
  "pay.networkTitle": "<b>Яка мережа для {symbol}?</b>",
  "pay.networkSubtitle": "Монета та сама — просто оберіть мережу, з якої надсилатимете.",

  // ---- quote ----
  "quote.loading": "⏳ Шукаємо для вас найкращу ціну…",
  "quote.title": "<b>Деталі замовлення</b>",
  "quote.youget": "Ви отримуєте",
  "quote.yousend": "Ви надсилаєте",
  "quote.deliverto": "Доставка",
  "quote.via": "у мережі {network}",
  "quote.eta": "Орієнтовний час",
  "quote.etaValue": "~{minutes} хв після оплати",
  "quote.note":
    "<i>Ціна фіксується при підтвердженні. Надішліть точно ту суму, що буде на наступному екрані.</i>",
  "quote.error":
    "⚠️ Не вдалося отримати котирування: {reason}\nСпробуйте іншу суму або іншу монету.",
  "quote.confirm": "✅ Підтвердити та отримати адресу",

  // ---- deposit / payment screen ----
  "deposit.title": "<b>Майже готово — надішліть платіж</b>",
  "deposit.sendExactly": "Надішліть рівно",
  "deposit.toAddress": "на цю адресу в мережі {network}:",
  "deposit.memoWarning": "⚠️ <b>Обов'язково</b> вкажіть цей memo: <code>{memo}</code>",
  "deposit.tapToCopy": "👆 Натисніть на адресу, щоб скопіювати",
  "deposit.expires": "Ціна зафіксована до {time}.",
  "deposit.waiting": "⏳ Чекаємо на ваш платіж…",
  "btn.copyAddress": "📋 Копіювати адресу",
  "btn.copyAmount": "📋 Копіювати суму",
  "btn.cancelOrder": "✖️ Скасувати замовлення",

  // ---- order status ----
  "status.awaiting_deposit": "⏳ Очікуємо оплату",
  "status.detected": "👀 Платіж помічено — підтверджуємо…",
  "status.matched": "✅ Платіж отримано",
  "status.executing": "⚙️ Конвертуємо вашу крипту…",
  "status.delivering": "📦 Доставляємо ваш товар…",
  "status.completed": "✅ Доставлено!",
  "status.failed": "❌ Помилка",
  "status.refunding": "↩️ Повернення коштів",
  "status.refunded": "↩️ Кошти повернено",
  "status.expired": "⌛️ Прострочено",
  "status.cancelled": "✖️ Скасовано",
  "status.held": "⚠️ Потребує уваги",
  "order.progress": "<b>Замовлення {id}</b> — {product}\n\n{status}",
  "order.completedBody":
    "🎉 <b>Ваш {product} уже тут!</b>",
  "order.deliveryHint": "Деталі нижче — натисніть на будь-яке значення, щоб скопіювати.",
  "order.failedBody":
    "Із замовленням {id} щось пішло не так. Ваші кошти в безпеці — напишіть у підтримку, і ми все вирішимо.",
  "order.expiredBody":
    "Замовлення {id} прострочене — оплата не надійшла вчасно. Якщо ви вже надіслали кошти, напишіть у підтримку — нічого не втрачено.",

  // ---- orders list ----
  "orders.title": "<b>Ваші замовлення</b>",
  "orders.empty": "Замовлень поки немає. Усе, що ви купуєте, з'явиться тут — разом із кодами, коли б вони не знадобилися.",
  "orders.item": "{status} {product} — {date}",

  // ---- delivery vault ----
  "vault.title": "<b>Ваша доставка</b>",
  "vault.pending": "⏳ Готуємо вашу доставку…",
  "vault.reveal": "Натисніть, щоб показати (нікому не показуйте):",
  "btn.requestLoginCode": "🔑 Запросити код входу",

  // ---- language ----
  "lang.title": "<b>Оберіть мову</b>",
  "lang.set": "✅ Мову змінено на {language}.",

  // ---- help ----
  "help.title": "<b>Як працює {brand}</b>",
  "help.body":
    "1️⃣ Оберіть товар — подарункова картка, Stars, Nitro, VPN, передплачена картка\n2️⃣ Вкажіть суму і для кого це\n3️⃣ Оберіть монету та надішліть один платіж на адресу, яку ми дамо\n4️⃣ Товар прийде прямо сюди, зазвичай за кілька хвилин\n\n💡 <b>Корисно знати</b>\n• Без реєстрації та KYC — достатньо одного платежу\n• Ціна фіксується при підтвердженні\n• Коди зберігаються в 🧾 Мої замовлення\n• Працює на <a href=\"https://uswap.net\">uSwap</a>",
  "help.support": "Питання? {support}",

  // ---- misc ----
  "error.generic": "⚠️ Щось пішло не так. Спробуйте ще раз.",
  "error.expiredQuote": "Та ціна прострочена — ось свіжа.",
  "cancel.done": "Скасовано. Надішліть /start, коли будете готові.",
  "input.useButtons": "Скористайтеся кнопками в останньому повідомленні або надішліть /start, щоб почати.",
  "amount.rangeCount": "Скільки? ({min}–{max})",
  "deposit.lockNote": "🕒 Ціну зафіксовано — краще надіслати протягом 5 хвилин ({time}). Пізніші платежі пройдуть за ринковим курсом.",
  "btn.clearSearch": "✖️ Скинути",
  "btn.swap": "🔄 Обміняти крипту",
  "swap.toTitle": "<b>Що хочете отримати?</b>",
  "swap.toSubtitle": "Міняйте будь-яку монету на будь-яку — без акаунта.",
  "swap.addrPrompt": "Надішліть адресу <b>{symbol}</b> ({network}), на яку прийде обмін:",
  "swap.memoPrompt": "Чи потрібен для цієї адреси <b>memo/tag</b>? Надішліть його або пропустіть.",
  "swap.amountPrompt": "Скільки міняємо? Надішліть суму в <b>{symbol}</b> (напр. <code>0.1</code>) або в доларах (напр. <code>$100</code>):",
  "swap.youreceive": "Ви отримаєте (орієнтовно)",
  "swap.invalidAmount": "Надішліть число, наприклад <code>0.25</code> або <code>$100</code>.",
  "swap.minDeposit": "Мінімум: <b>{min}</b> (≈ {usd})",
  "btn.refundAddr": "↩️ Додати адресу повернення",
  "refund.prompt": "Необов’язкова підстраховка: надішліть адресу <b>{symbol}</b> для автоматичного повернення, якщо із замовленням щось піде не так.",
  "refund.set": "✅ Адресу повернення збережено для цього замовлення.",
  "swap.receive": "Ви отримуєте",
  "swap.notset": "не задано",
  "btn.flipPair": "🔁",
  "btn.setAmount": "💵 Сума",
  "btn.setAddress": "📍 Адреса",
  "btn.getQuote": "⚡️ Отримати курс",
  "swap.incomplete": "Спершу вкажіть суму та адресу отримання.",
  "browse.aisleHint": "{count} товарів — оберіть категорію:",
  "btn.allItems": "🛍 Усі ({count})",
};
