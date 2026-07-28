import type { Locale } from "../index.ts";

export const fa: Partial<Locale> = {
  // ---- home ----
  "home.title": "<b>{brand}</b> — خرید کالای دیجیتال با کریپتو",
  "home.body":
    "گیفت کارت، Telegram Stars و Premium، Discord Nitro، اشتراک VPN و کارت‌های پیش‌پرداخت — با همان کوینی که همین الان داری.\n\n<i>بدون حساب، بدون کارت بانکی. محصول را انتخاب کن، یک پرداخت بفرست، تمام.</i>",
  "home.choose": "چی می‌خوای بخری؟",
  "btn.orders": "🧾 سفارش‌های من",
  "btn.language": "🌐 زبان",
  "btn.help": "❓ راهنما",
  "btn.home": "🏠 خانه",
  "btn.back": "‹ بازگشت",
  "btn.next": "›",
  "btn.prev": "‹",
  "btn.cancel": "✖️ لغو",
  "btn.search": "🔍 جستجو",
  "btn.confirm": "✅ تأیید",
  "btn.refresh": "🔄 تازه‌سازی",

  // ---- browse ----
  "browse.page": "صفحه {page}",
  "browse.searchPrompt":
    "🔍 بنویس دنبال چی هستی (مثلاً: <i>Amazon</i>، <i>Uber</i>، <i>Steam</i>):",
  "browse.noResults": "چیزی برای «{query}» پیدا نشد. یک عبارت دیگر امتحان کن.",
  "browse.results": "نتایج برای «{query}»",
  "browse.stale":
    "این منو قدیمی شده — از آخرین پیام استفاده کن یا /start بفرست.",
  "browse.soldout": "تمام شد",

  // ---- product configure ----
  "amount.title": "<b>{product}</b>",
  "amount.rangeUsd": "مبلغ را انتخاب کن ({min}–{max}):",
  "amount.rangeUnits": "چند {unit} می‌خوای؟ ({min}–{max})",
  "amount.custom": "✏️ مبلغ دلخواه",
  "amount.customPrompt":
    "یک مقدار بین <b>{min}</b> و <b>{max}</b> {unit} بنویس:",
  "amount.invalid":
    "این قبول نیست — یک عدد بین {min} و {max} بفرست.",
  "dest.prompt.telegram_username":
    "برای کیه؟ @یوزرنیم تلگرامش را بفرست، یا با دکمه برای خودت بگیرش.",
  "dest.prompt.generic": "کجا تحویل بدیم؟ {label} را بفرست:",
  "dest.me": "👤 خودم ({username})",
  "dest.skip": "⏭ رد شو — حساب جدید بساز",
  "dest.invalid": "درست به نظر نمی‌رسه — لطفاً چک کن و دوباره بفرست.",

  // ---- pay asset picker ----
  "pay.title": "<b>چطور می‌خوای پرداخت کنی؟</b>",
  "pay.subtitle": "داری می‌خری: {product}",
  "pay.morecoins": "➕ کوین‌های بیشتر",
  "pay.popular": "محبوب",
  "pay.networkTitle": "<b>برای {symbol} کدام شبکه؟</b>",
  "pay.networkSubtitle": "همان کوین است — فقط شبکه‌ای را انتخاب کن که از آن می‌فرستی.",

  // ---- quote ----
  "quote.loading": "⏳ در حال گرفتن بهترین قیمت برای تو…",
  "quote.title": "<b>خلاصه سفارش</b>",
  "quote.youget": "دریافت می‌کنی",
  "quote.yousend": "می‌فرستی",
  "quote.deliverto": "تحویل به",
  "quote.via": "روی {network}",
  "quote.eta": "زمان تقریبی",
  "quote.etaValue": "حدود {minutes} دقیقه بعد از پرداخت",
  "quote.note":
    "<i>با تأیید، قیمت قفل می‌شود. دقیقاً همان مقداری را بفرست که در صفحه بعد نشان داده می‌شود.</i>",
  "quote.error":
    "⚠️ گرفتن قیمت ممکن نشد: {reason}\nیک مبلغ یا کوین دیگر امتحان کن.",
  "quote.confirm": "✅ تأیید و دریافت آدرس",

  // ---- deposit / payment screen ----
  "deposit.title": "<b>چیزی نمانده — پرداختت را بفرست</b>",
  "deposit.sendExactly": "دقیقاً این مقدار را بفرست",
  "deposit.toAddress": "به این آدرس {network}:",
  "deposit.memoWarning": "⚠️ <b>حتماً</b> این memo را ضمیمه کن: <code>{memo}</code>",
  "deposit.tapToCopy": "👆 برای کپی، روی آدرس بزن",
  "deposit.expires": "این قیمت تا {time} قفل است.",
  "deposit.waiting": "⏳ منتظر پرداخت تو هستیم…",
  "btn.copyAddress": "📋 کپی آدرس",
  "btn.copyAmount": "📋 کپی مقدار",
  "btn.cancelOrder": "✖️ لغو سفارش",

  // ---- order status ----
  "status.awaiting_deposit": "⏳ در انتظار پرداخت",
  "status.detected": "👀 پرداخت دیده شد — در حال تأیید…",
  "status.matched": "✅ پرداخت رسید",
  "status.executing": "⚙️ در حال تبدیل کریپتوی تو…",
  "status.delivering": "📦 در حال تحویل محصول…",
  "status.completed": "✅ تحویل شد!",
  "status.failed": "❌ ناموفق",
  "status.refunding": "↩️ در حال بازپرداخت",
  "status.refunded": "↩️ بازپرداخت شد",
  "status.expired": "⌛️ منقضی شد",
  "status.cancelled": "✖️ لغو شد",
  "status.held": "⚠️ نیاز به بررسی",
  "order.progress": "<b>سفارش {id}</b> — {product}\n\n{status}",
  "order.completedBody":
    "🎉 <b>{product} تو رسید!</b>",
  "order.deliveryHint": "جزئیات پایین است — روی هر مقدار بزن تا کپی شود.",
  "order.failedBody":
    "سفارش {id} به مشکل خورد. پول تو امن است — به پشتیبانی پیام بده تا حلش کنیم.",
  "order.expiredBody":
    "سفارش {id} قبل از رسیدن پرداخت منقضی شد. اگر پول فرستادی، به پشتیبانی پیام بده — چیزی از بین نرفته.",

  // ---- orders list ----
  "orders.title": "<b>سفارش‌های تو</b>",
  "orders.empty": "هنوز سفارشی نداری. هر چیزی بخری اینجا می‌ماند — از جمله کدهایت، هر وقت دوباره لازمشان داشتی.",
  "orders.item": "{status} {product} — {date}",

  // ---- delivery vault ----
  "vault.title": "<b>تحویلی تو</b>",
  "vault.pending": "⏳ در حال آماده‌سازی تحویلی…",
  "vault.reveal": "برای نمایش بزن (خصوصی نگهش دار):",
  "btn.requestLoginCode": "🔑 دریافت کد ورود",

  // ---- language ----
  "lang.title": "<b>زبانت را انتخاب کن</b>",
  "lang.set": "✅ زبان روی {language} تنظیم شد.",

  // ---- help ----
  "help.title": "<b>{brand} چطور کار می‌کند</b>",
  "help.body":
    "1️⃣ یک محصول انتخاب کن — گیفت کارت، Stars، Nitro، VPN، کارت پیش‌پرداخت\n2️⃣ مبلغ و گیرنده را مشخص کن\n3️⃣ یک کوین انتخاب کن و یک پرداخت به آدرسی که می‌دهیم بفرست\n4️⃣ محصولت همین‌جا تحویل می‌شود، معمولاً در چند دقیقه\n\n💡 <b>خوب است بدانی</b>\n• بدون ثبت‌نام، بدون KYC — فقط یک پرداخت کافی است\n• قیمت با تأیید تو قفل می‌شود\n• کدها زیر 🧾 سفارش‌های من ذخیره می‌مانند\n• قدرت‌گرفته از <a href=\"https://uswap.net\">uSwap</a>",
  "help.support": "سؤالی داری؟ {support}",

  // ---- misc ----
  "error.generic": "⚠️ مشکلی پیش آمد. لطفاً دوباره امتحان کن.",
  "error.expiredQuote": "آن قیمت منقضی شد — این هم یک قیمت تازه.",
  "cancel.done": "لغو شد. هر وقت آماده بودی /start بفرست.",
  "input.useButtons": "از دکمه‌های آخرین پیام استفاده کن، یا برای شروع /start بفرست.",
  "amount.rangeCount": "چند عدد؟ ({min}–{max})",
  "deposit.lockNote": "🕒 قیمت قفل شد — بهتر است ظرف ۵ دقیقه ({time}) پرداخت کنید. پرداخت‌های دیرتر با نرخ لحظه‌ای بازار انجام می‌شوند.",
  "btn.clearSearch": "✖️ حذف",
  "btn.swap": "🔄 تبدیل ارز دیجیتال",
  "swap.toTitle": "<b>می‌خواهید چه چیزی دریافت کنید؟</b>",
  "swap.toSubtitle": "هر کوینی را با هر کوین دیگر تبدیل کنید — بدون حساب.",
  "swap.addrPrompt": "آدرس <b>{symbol}</b> ({network}) که تبدیل به آن واریز می‌شود را بفرستید:",
  "swap.memoPrompt": "آیا این آدرس <b>memo/tag</b> لازم دارد؟ الان بفرستید یا رد شوید.",
  "swap.amountPrompt": "چقدر تبدیل می‌کنید؟ مقدار را به <b>{symbol}</b> (مثل <code>0.1</code>) یا دلار (مثل <code>$100</code>) بفرستید:",
  "swap.youreceive": "دریافتی شما (تقریبی)",
  "swap.invalidAmount": "یک عدد بفرستید، مثل <code>0.25</code> یا <code>$100</code>.",
  "swap.minDeposit": "حداقل: <b>{min}</b> (≈ {usd})",
  "btn.refundAddr": "↩️ افزودن آدرس بازپرداخت",
  "refund.prompt": "شبکه امنیتی اختیاری: یک آدرس <b>{symbol}</b> بفرستید تا در صورت بروز مشکل در این سفارش، بازپرداخت خودکار انجام شود.",
  "refund.set": "✅ آدرس بازپرداخت برای این سفارش ذخیره شد.",
  "swap.receive": "دریافت می‌کنید",
  "swap.notset": "تنظیم نشده",
  "btn.flipPair": "🔁",
  "btn.setAmount": "💵 مقدار",
  "btn.setAddress": "📍 آدرس",
  "btn.getQuote": "⚡️ دریافت نرخ",
  "swap.incomplete": "ابتدا مقدار و آدرس دریافت را تنظیم کنید.",
};
