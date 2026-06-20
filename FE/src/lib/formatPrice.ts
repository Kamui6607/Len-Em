/**
 * Format a number as Vietnamese currency (VND).
 * 
 * Examples:
 *   249000 → "249.000₫"
 *   1250000 → "1.250.000₫"
 *   340000000 → "340.000.000₫"
 *   0 → "0₫"
 */
export function formatPrice(amount: number): string {
  if (amount === 0) return "0₫";
  return `${Number(amount).toLocaleString("vi-VN")}₫`;
}

/**
 * Format a number as Vietnamese currency without the ₫ symbol (for use in tables, etc.)
 */
export function formatPriceShort(amount: number): string {
  if (amount === 0) return "0";
  return Number(amount).toLocaleString("vi-VN");
}