import type { Locale } from "../index.ts";

export const hi: Partial<Locale> = {
  // ---- home ----
  "home.title": "<b>{brand}</b> — क्रिप्टो से डिजिटल चीज़ें खरीदें",
  "home.body":
    "गिफ़्ट कार्ड, Telegram Stars और Premium, Discord Nitro, VPN टाइम और प्रीपेड कार्ड — उन्हीं कॉइन से जो आपके पास पहले से हैं।\n\n<i>न अकाउंट, न कार्ड। प्रोडक्ट चुनें, एक पेमेंट भेजें, हो गया।</i>",
  "home.choose": "क्या खरीदना चाहेंगे?",
  "btn.orders": "🧾 मेरे ऑर्डर",
  "btn.language": "🌐 भाषा",
  "btn.help": "❓ मदद",
  "btn.home": "🏠 होम",
  "btn.back": "‹ वापस",
  "btn.next": "›",
  "btn.prev": "‹",
  "btn.cancel": "✖️ रद्द करें",
  "btn.search": "🔍 खोजें",
  "btn.confirm": "✅ पक्का करें",
  "btn.refresh": "🔄 रिफ्रेश",

  // ---- browse ----
  "browse.page": "पेज {page}",
  "browse.searchPrompt":
    "🔍 लिखें कि आप क्या ढूंढ रहे हैं (जैसे: <i>Amazon</i>, <i>Uber</i>, <i>Steam</i>):",
  "browse.noResults": "“{query}” के लिए कुछ नहीं मिला। कुछ और खोजकर देखें।",
  "browse.results": "“{query}” के नतीजे",
  "browse.stale":
    "यह मेन्यू पुराना हो गया है — सबसे नया मैसेज इस्तेमाल करें या /start भेजें।",
  "browse.soldout": "स्टॉक खत्म",

  // ---- product configure ----
  "amount.title": "<b>{product}</b>",
  "amount.rangeUsd": "रकम चुनें ({min}–{max}):",
  "amount.rangeUnits": "कितने {unit} चाहिए? ({min}–{max})",
  "amount.custom": "✏️ अपनी रकम",
  "amount.customPrompt":
    "<b>{min}</b> और <b>{max}</b> {unit} के बीच कोई रकम लिखें:",
  "amount.invalid":
    "यह नहीं चलेगा — {min} और {max} के बीच का कोई नंबर भेजें।",
  "dest.prompt.telegram_username":
    "यह किसके लिए है? उनका Telegram @username भेजें, या खुद के लिए बटन दबाएँ।",
  "dest.prompt.generic": "कहाँ डिलीवर करें? {label} भेजें:",
  "dest.me": "👤 मैं ({username})",
  "dest.skip": "⏭ छोड़ें — नया अकाउंट बनाएँ",
  "dest.invalid": "यह सही नहीं लग रहा — ज़रा जाँचकर दोबारा भेजें।",

  // ---- pay asset picker ----
  "pay.title": "<b>पेमेंट कैसे करना चाहेंगे?</b>",
  "pay.subtitle": "आप खरीद रहे हैं: {product}",
  "pay.morecoins": "➕ और कॉइन",
  "pay.popular": "लोकप्रिय",
  "pay.networkTitle": "<b>{symbol} के लिए कौन-सा नेटवर्क?</b>",
  "pay.networkSubtitle": "कॉइन वही है — बस वह नेटवर्क चुनें जिससे आप भेजेंगे।",

  // ---- quote ----
  "quote.loading": "⏳ आपके लिए सबसे अच्छा रेट ला रहे हैं…",
  "quote.title": "<b>ऑर्डर की जानकारी</b>",
  "quote.youget": "आपको मिलेगा",
  "quote.yousend": "आप भेजेंगे",
  "quote.deliverto": "डिलीवरी यहाँ",
  "quote.via": "{network} पर",
  "quote.eta": "अनुमानित समय",
  "quote.etaValue": "पेमेंट के बाद ~{minutes} मिनट",
  "quote.note":
    "<i>कन्फर्म करते ही रेट लॉक हो जाता है। अगली स्क्रीन पर दिखी सटीक रकम ही भेजें।</i>",
  "quote.error":
    "⚠️ रेट नहीं मिल पाया: {reason}\nकोई और रकम या पेमेंट कॉइन आज़माएँ।",
  "quote.confirm": "✅ पक्का करें और पता लें",

  // ---- deposit / payment screen ----
  "deposit.title": "<b>बस थोड़ा और — पेमेंट भेजें</b>",
  "deposit.sendExactly": "बिल्कुल इतना भेजें",
  "deposit.toAddress": "इस {network} पते पर:",
  "deposit.memoWarning": "⚠️ यह memo <b>ज़रूर</b> डालें: <code>{memo}</code>",
  "deposit.tapToCopy": "👆 कॉपी करने के लिए पते पर टैप करें",
  "deposit.expires": "यह रेट {time} तक लॉक है।",
  "deposit.waiting": "⏳ आपके पेमेंट का इंतज़ार है…",
  "btn.copyAddress": "📋 पता कॉपी करें",
  "btn.copyAmount": "📋 रकम कॉपी करें",
  "btn.cancelOrder": "✖️ ऑर्डर रद्द करें",

  // ---- order status ----
  "status.awaiting_deposit": "⏳ पेमेंट का इंतज़ार",
  "status.detected": "👀 पेमेंट दिखा — कन्फर्म हो रहा है…",
  "status.matched": "✅ पेमेंट मिल गया",
  "status.executing": "⚙️ आपका क्रिप्टो बदला जा रहा है…",
  "status.delivering": "📦 आपका प्रोडक्ट डिलीवर हो रहा है…",
  "status.completed": "✅ डिलीवर हो गया!",
  "status.failed": "❌ फेल हुआ",
  "status.refunding": "↩️ रिफंड हो रहा है",
  "status.refunded": "↩️ रिफंड हो गया",
  "status.expired": "⌛️ एक्सपायर हो गया",
  "status.cancelled": "✖️ रद्द हुआ",
  "status.held": "⚠️ ध्यान चाहिए",
  "order.progress": "<b>ऑर्डर {id}</b> — {product}\n\n{status}",
  "order.completedBody":
    "🎉 <b>आपका {product} आ गया!</b>",
  "order.deliveryHint": "जानकारी नीचे है — कॉपी करने के लिए किसी भी वैल्यू पर टैप करें।",
  "order.failedBody":
    "ऑर्डर {id} में कुछ गड़बड़ हो गई। आपके पैसे सुरक्षित हैं — सपोर्ट से बात करें, हम सुलझा देंगे।",
  "order.expiredBody":
    "ऑर्डर {id} पेमेंट पहुँचने से पहले एक्सपायर हो गया। अगर आपने पैसे भेज दिए हैं तो सपोर्ट से बात करें — कुछ भी खोया नहीं है।",

  // ---- orders list ----
  "orders.title": "<b>आपके ऑर्डर</b>",
  "orders.empty": "अभी कोई ऑर्डर नहीं। आप जो भी खरीदेंगे वह यहाँ दिखेगा — आपके कोड भी, जब चाहें दोबारा देख लें।",
  "orders.item": "{status} {product} — {date}",

  // ---- delivery vault ----
  "vault.title": "<b>आपकी डिलीवरी</b>",
  "vault.pending": "⏳ आपकी डिलीवरी तैयार हो रही है…",
  "vault.reveal": "देखने के लिए टैप करें (किसी को न दिखाएँ):",
  "btn.requestLoginCode": "🔑 लॉगिन कोड माँगें",

  // ---- language ----
  "lang.title": "<b>अपनी भाषा चुनें</b>",
  "lang.set": "✅ भाषा {language} सेट हो गई।",

  // ---- help ----
  "help.title": "<b>{brand} कैसे काम करता है</b>",
  "help.body":
    "1️⃣ प्रोडक्ट चुनें — गिफ़्ट कार्ड, Stars, Nitro, VPN, प्रीपेड कार्ड\n2️⃣ रकम चुनें और बताएं किसके लिए है\n3️⃣ कोई कॉइन चुनें और हमारे दिए पते पर एक पेमेंट भेजें\n4️⃣ आपका प्रोडक्ट यहीं डिलीवर होगा, आमतौर पर कुछ ही मिनटों में\n\n💡 <b>जानने लायक बातें</b>\n• न साइनअप, न KYC — बस एक पेमेंट काफी है\n• कन्फर्म करते ही रेट लॉक हो जाता है\n• कोड 🧾 मेरे ऑर्डर में सेव रहते हैं\n• <a href=\"https://uswap.net\">uSwap</a> द्वारा संचालित",
  "help.support": "कोई सवाल? {support}",

  // ---- misc ----
  "error.generic": "⚠️ कुछ गड़बड़ हो गई। फिर से कोशिश करें।",
  "error.expiredQuote": "वह रेट एक्सपायर हो गया — यह रहा नया।",
  "cancel.done": "रद्द हो गया। जब तैयार हों, /start भेजें।",
  "input.useButtons": "आखिरी मैसेज के बटन इस्तेमाल करें, या शुरू करने के लिए /start भेजें।",
  "amount.rangeCount": "कितने? ({min}–{max})",
  "deposit.lockNote": "🕒 कीमत लॉक है — 5 मिनट के भीतर ({time}) भेजना बेहतर है। बाद के भुगतान लाइव मार्केट रेट पर पूरे होंगे।",
  "btn.clearSearch": "✖️ हटाएँ",
  "btn.swap": "🔄 क्रिप्टो स्वैप करें",
  "swap.toTitle": "<b>आप क्या पाना चाहते हैं?</b>",
  "swap.toSubtitle": "कोई भी कॉइन किसी भी कॉइन से बदलें — बिना अकाउंट के।",
  "swap.addrPrompt": "वह <b>{symbol}</b> पता ({network}) भेजें जिस पर आपका स्वैप आएगा:",
  "swap.memoPrompt": "क्या इस पते के लिए <b>memo/tag</b> चाहिए? अभी भेजें, या छोड़ें।",
  "swap.amountPrompt": "कितना स्वैप करना है? <b>{symbol}</b> में राशि भेजें (जैसे <code>0.1</code>) या डॉलर में (जैसे <code>$100</code>):",
  "swap.youreceive": "आपको मिलेगा (अनुमानित)",
  "swap.invalidAmount": "कोई संख्या भेजें, जैसे <code>0.25</code> या <code>$100</code>।",
  "swap.minDeposit": "न्यूनतम: <b>{min}</b> (≈ {usd})",
  "btn.refundAddr": "↩️ रिफ़ंड पता जोड़ें",
  "refund.prompt": "वैकल्पिक सुरक्षा: एक <b>{symbol}</b> पता भेजें ताकि इस ऑर्डर में कुछ गलत होने पर अपने आप रिफ़ंड हो जाए।",
  "refund.set": "✅ इस ऑर्डर के लिए रिफ़ंड पता सहेज लिया गया।",
  "swap.receive": "आपको मिलेगा",
  "swap.notset": "सेट नहीं",
  "btn.flipPair": "🔁",
  "btn.setAmount": "💵 राशि",
  "btn.setAddress": "📍 पता",
  "btn.getQuote": "⚡️ भाव पाएँ",
  "swap.incomplete": "पहले राशि और प्राप्ति पता सेट करें।",
};
