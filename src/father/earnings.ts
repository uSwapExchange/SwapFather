export function formatEarningsUsd(value: unknown): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount === 0) return "$0.00";

  const subCent = Math.abs(amount) < 0.01;
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: subCent ? 8 : 2,
  })}`;
}
