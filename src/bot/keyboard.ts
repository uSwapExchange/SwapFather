/**
 * Inline keyboard primitives.
 *
 * We build raw Bot API objects instead of grammY's InlineKeyboard class so we
 * can use newer fields (button `style`, `copy_text`) even before typings
 * catch up.
 */

export interface Btn {
  text: string;
  callback_data?: string;
  url?: string;
  copy_text?: { text: string };
  /** Bot API 10.x: "danger" (red), "success" (green), "primary" (blue). */
  style?: "danger" | "success" | "primary";
  /** Bot API 10.x: custom emoji shown before the button text. */
  icon_custom_emoji_id?: string;
}

export type Keyboard = Btn[][];

export function btn(
  text: string,
  callback_data: string,
  style?: Btn["style"],
  iconId?: string,
): Btn {
  const b: Btn = { text, callback_data };
  if (style) b.style = style;
  if (iconId) b.icon_custom_emoji_id = iconId;
  return b;
}

/** Remove Bot-API-10 icon fields (fallback for non-Premium bot owners). */
export function stripIcons(keyboard: Keyboard): Keyboard {
  return keyboard.map((row) =>
    row.map(({ icon_custom_emoji_id: _drop, ...rest }) => rest),
  );
}

export function copyBtn(text: string, value: string): Btn {
  // copy_text is capped at 256 chars by Telegram.
  return { text, copy_text: { text: value.slice(0, 256) } };
}

export function urlBtn(text: string, url: string): Btn {
  return { text, url };
}

/** Lay items out `perRow` per row. */
export function grid(buttons: Btn[], perRow: number): Keyboard {
  const rows: Keyboard = [];
  for (let i = 0; i < buttons.length; i += perRow) {
    rows.push(buttons.slice(i, i + perRow));
  }
  return rows;
}

export function markup(keyboard: Keyboard) {
  return { inline_keyboard: keyboard };
}
