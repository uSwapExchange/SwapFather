import type { Locale } from "../index.ts";

export const zh: Partial<Locale> = {
  // ---- home ----
  "home.title": "<b>{brand}</b> — 用加密货币购买数字商品",
  "home.body":
    "礼品卡、Telegram Stars 和 Premium、Discord Nitro、VPN 时长、预付卡 — 用你手里的币直接付款。\n\n<i>无需账号，无需银行卡。选好商品，付一笔款，搞定。</i>",
  "home.choose": "想买点什么？",
  "btn.orders": "🧾 我的订单",
  "btn.language": "🌐 语言",
  "btn.help": "❓ 帮助",
  "btn.home": "🏠 首页",
  "btn.back": "‹ 返回",
  "btn.next": "›",
  "btn.prev": "‹",
  "btn.cancel": "✖️ 取消",
  "btn.search": "🔍 搜索",
  "btn.confirm": "✅ 确认",
  "btn.refresh": "🔄 刷新",

  // ---- browse ----
  "browse.page": "第 {page} 页",
  "browse.searchPrompt":
    "🔍 输入你想找的东西（比如：<i>Amazon</i>、<i>Uber</i>、<i>Steam</i>）：",
  "browse.noResults": "没找到“{query}”相关的结果，换个词试试吧。",
  "browse.results": "“{query}”的搜索结果",
  "browse.stale":
    "这个菜单已过期 — 请使用最新消息，或发送 /start。",
  "browse.soldout": "已售罄",

  // ---- product configure ----
  "amount.title": "<b>{product}</b>",
  "amount.rangeUsd": "选择金额（{min}–{max}）：",
  "amount.rangeUnits": "要多少{unit}？（{min}–{max}）",
  "amount.custom": "✏️ 自定义金额",
  "amount.customPrompt":
    "输入一个 <b>{min}</b> 到 <b>{max}</b> 之间的数量（{unit}）：",
  "amount.invalid":
    "这个不行 — 请发送 {min} 到 {max} 之间的数字。",
  "dest.prompt.telegram_username":
    "这是买给谁的？发送对方的 Telegram @用户名，或点按钮发给自己。",
  "dest.prompt.generic": "要送到哪里？请发送{label}：",
  "dest.me": "👤 我（{username}）",
  "dest.skip": "⏭ 跳过 — 创建新账号",
  "dest.invalid": "看起来不太对 — 请检查后重新发送。",

  // ---- pay asset picker ----
  "pay.title": "<b>你想怎么付款？</b>",
  "pay.subtitle": "你正在购买：{product}",
  "pay.morecoins": "➕ 更多币种",
  "pay.popular": "热门",
  "pay.networkTitle": "<b>{symbol} 用哪条网络？</b>",
  "pay.networkSubtitle": "同一种币 — 选你转账时用的网络即可。",

  // ---- quote ----
  "quote.loading": "⏳ 正在为你获取最优价格…",
  "quote.title": "<b>订单摘要</b>",
  "quote.youget": "你将获得",
  "quote.yousend": "你需支付",
  "quote.deliverto": "送达至",
  "quote.via": "通过 {network}",
  "quote.eta": "预计时间",
  "quote.etaValue": "付款后约 {minutes} 分钟",
  "quote.note":
    "<i>确认后价格即锁定。请按下一屏显示的金额准确转账。</i>",
  "quote.error":
    "⚠️ 无法获取报价：{reason}\n换个金额或换种支付币试试。",
  "quote.confirm": "✅ 确认并获取地址",

  // ---- deposit / payment screen ----
  "deposit.title": "<b>就差一步 — 完成付款</b>",
  "deposit.sendExactly": "请准确发送",
  "deposit.toAddress": "到这个 {network} 地址：",
  "deposit.memoWarning": "⚠️ <b>必须</b>附上此 memo：<code>{memo}</code>",
  "deposit.tapToCopy": "👆 点按地址即可复制",
  "deposit.expires": "此价格锁定至 {time}。",
  "deposit.waiting": "⏳ 等待你的付款…",
  "btn.copyAddress": "📋 复制地址",
  "btn.copyAmount": "📋 复制金额",
  "btn.cancelOrder": "✖️ 取消订单",

  // ---- order status ----
  "status.awaiting_deposit": "⏳ 等待付款",
  "status.detected": "👀 检测到付款 — 确认中…",
  "status.matched": "✅ 付款已收到",
  "status.executing": "⚙️ 正在兑换你的加密货币…",
  "status.delivering": "📦 正在发货…",
  "status.completed": "✅ 已送达！",
  "status.failed": "❌ 失败",
  "status.refunding": "↩️ 退款中",
  "status.refunded": "↩️ 已退款",
  "status.expired": "⌛️ 已过期",
  "status.cancelled": "✖️ 已取消",
  "status.held": "⚠️ 需要处理",
  "order.progress": "<b>订单 {id}</b> — {product}\n\n{status}",
  "order.completedBody":
    "🎉 <b>你的{product}到啦！</b>",
  "order.deliveryHint": "详情见下方 — 点按任意内容即可复制。",
  "order.failedBody":
    "订单 {id} 出了点问题。你的资金是安全的 — 联系客服，我们会帮你解决。",
  "order.expiredBody":
    "订单 {id} 在付款到达前已过期。如果你已经转了账，请联系客服 — 资金不会丢失。",

  // ---- orders list ----
  "orders.title": "<b>你的订单</b>",
  "orders.empty": "还没有订单。你买的所有东西都会显示在这里 — 包括兑换码，随时都能回来查看。",
  "orders.item": "{status} {product} — {date}",

  // ---- delivery vault ----
  "vault.title": "<b>你的商品</b>",
  "vault.pending": "⏳ 正在准备发货…",
  "vault.reveal": "点按查看（注意保密）：",
  "btn.requestLoginCode": "🔑 获取登录码",

  // ---- language ----
  "lang.title": "<b>选择语言</b>",
  "lang.set": "✅ 语言已设置为{language}。",

  // ---- help ----
  "help.title": "<b>{brand} 使用方法</b>",
  "help.body":
    "1️⃣ 选一个商品 — 礼品卡、Stars、Nitro、VPN、预付卡\n2️⃣ 选择金额和收货人\n3️⃣ 选一种币，按我们给的地址付一笔款\n4️⃣ 商品直接在这里送达，通常几分钟搞定\n\n💡 <b>小贴士</b>\n• 无需注册，无需 KYC — 付款即可\n• 确认后价格即锁定\n• 兑换码保存在 🧾 我的订单里\n• 由 <a href=\"https://uswap.net\">uSwap</a> 提供技术支持",
  "help.support": "有问题？{support}",

  // ---- misc ----
  "error.generic": "⚠️ 出了点问题，请重试。",
  "error.expiredQuote": "刚才的价格过期了 — 这是新的报价。",
  "cancel.done": "已取消。想买的时候随时发送 /start。",
  "input.useButtons": "请使用最新消息上的按钮，或发送 /start 开始。",
  "amount.rangeCount": "购买数量？（{min}–{max}）",
  "deposit.lockNote": "🕒 价格已锁定——最好在 5 分钟内（{time}）付款。之后的付款将按实时市场价完成。",
  "btn.clearSearch": "✖️ 清除",
};
