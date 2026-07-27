/**
 * Tiny i18n engine.
 *
 * - Locales are flat string maps with `{placeholder}` interpolation.
 * - The user's Telegram `language_code` picks the locale automatically;
 *   an explicit /language choice (stored in the session) overrides it.
 * - Anything missing in a locale falls back to English, so partial
 *   translations are always safe to ship.
 */

import { en } from "./locales/en.ts";
import { es } from "./locales/es.ts";
import { ru } from "./locales/ru.ts";
import { zh } from "./locales/zh.ts";
import { fr } from "./locales/fr.ts";
import { de } from "./locales/de.ts";
import { pt } from "./locales/pt.ts";
import { uk } from "./locales/uk.ts";
import { fa } from "./locales/fa.ts";
import { hi } from "./locales/hi.ts";

export type LocaleKey = keyof typeof en;
export type Locale = Record<LocaleKey, string>;

const locales: Record<string, Partial<Locale>> = {
  en,
  es,
  ru,
  zh,
  fr,
  de,
  pt,
  uk,
  fa,
  hi,
};

export const SUPPORTED_LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ru", label: "Русский" },
  { code: "zh", label: "中文" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "uk", label: "Українська" },
  { code: "fa", label: "فارسی" },
  { code: "hi", label: "हिन्दी" },
];

/** Map a Telegram language_code (e.g. "pt-br", "zh-hans") to a supported locale. */
export function resolveLanguage(languageCode: string | undefined): string {
  if (!languageCode) return "en";
  const base = languageCode.toLowerCase().split("-")[0] ?? "en";
  return base in locales ? base : "en";
}

export type Translator = (key: LocaleKey, params?: Record<string, string | number>) => string;

export function getTranslator(lang: string): Translator {
  const locale = locales[lang] ?? en;
  return (key, params) => {
    let text = locale[key] ?? en[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };
}
