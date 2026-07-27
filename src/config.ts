/**
 * Environment configuration. All secrets come from the environment —
 * nothing is ever hard-coded or committed.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

export const config = {
  /** Flagship bot token. Required in single-tenant mode; optional for the fleet. */
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  uswapApiKey: required("USWAP_API_KEY"),
  uswapApiBase: process.env.USWAP_API_BASE ?? "https://partner-api.uswap.net",
  databasePath: process.env.DATABASE_PATH ?? "./data/bestb4u.db",
  adminUserIds: (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number),
} as const;
