/**
 * Amount + text formatting helpers.
 * All uSwap amounts are raw atomic-unit strings; keep math in BigInt.
 */

/** raw atomic units → human decimal string (trailing zeros trimmed). */
export function rawToHuman(raw: string, decimals: number): string {
  if (decimals === 0) return raw;
  const negative = raw.startsWith("-");
  const digits = negative ? raw.slice(1) : raw;
  const padded = digits.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const frac = padded.slice(-decimals).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${frac ? "." + frac : ""}`;
}

/** human decimal string → raw atomic units (throws on bad input). */
export function humanToRaw(human: string, decimals: number): string {
  const m = human.trim().match(/^(\d+)(?:[.,](\d+))?$/);
  if (!m) throw new Error(`invalid amount: ${human}`);
  const whole = m[1]!;
  const frac = (m[2] ?? "").slice(0, decimals).padEnd(decimals, "0");
  const raw = BigInt(whole + frac).toString();
  return raw;
}

/** Compact USD display: $12.34, $1,234, $0.98 */
export function usd(value: number | string | undefined): string {
  if (value === undefined) return "";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n >= 100 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** Escape text for Telegram HTML parse mode. */
export function esc(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Trim a crypto amount to a sensible number of significant decimals. */
export function niceCrypto(human: string, maxDecimals = 8): string {
  if (!human.includes(".")) return human;
  const [whole, frac] = human.split(".") as [string, string];
  const keep = frac.slice(0, maxDecimals).replace(/0+$/, "");
  return keep ? `${whole}.${keep}` : whole;
}

/** Preset ladders per unit type — what a shop shelf would offer. */
const LADDERS: Record<string, number[]> = {
  USD: [5, 10, 25, 50, 100, 200, 500, 1000, 2000],
  Months: [1, 3, 6, 12, 24],
  Quantity: [50, 100, 250, 500, 1000, 2500, 5000],
  TON: [20, 50, 100, 250, 500, 1000],
};
const DEFAULT_LADDER = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];

/**
 * Build "nice" preset amounts for a product given raw min/max bounds.
 * Returns human-unit strings, at most `count` values, always within bounds.
 */
export function presetAmounts(opts: {
  minRaw: string;
  maxRaw: string;
  decimals: number;
  unitLabel?: string;
  stepRaw?: string;
  optionsRaw?: string[];
  count?: number;
}): string[] {
  const { decimals } = opts;
  const count = opts.count ?? 6;

  // Fixed denominations win outright.
  if (opts.optionsRaw?.length) {
    return opts.optionsRaw.slice(0, 8).map((r) => rawToHuman(r, decimals));
  }

  const min = BigInt(opts.minRaw);
  const max = BigInt(opts.maxRaw);
  const step = opts.stepRaw ? BigInt(opts.stepRaw) : 0n;
  if (min >= max) return [rawToHuman(opts.minRaw, decimals)];

  const scale = 10n ** BigInt(decimals);
  const ladder = LADDERS[opts.unitLabel ?? ""] ?? DEFAULT_LADDER;
  const picks: bigint[] = [];
  for (const n of ladder) {
    const raw = BigInt(n) * scale;
    if (raw < min || raw > max) continue;
    if (step > 0n && raw % step !== 0n) continue;
    picks.push(raw);
    if (picks.length >= count) break;
  }
  // The minimum is always one tap away (cheap first try builds trust).
  if (picks.length === 0 || picks[0]! !== min) {
    if (!picks.includes(min)) picks.unshift(min);
  }
  return picks.slice(0, count).map((r) => rawToHuman(r.toString(), decimals));
}
