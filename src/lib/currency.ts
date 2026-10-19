/** Nigerian Naira formatting for HAMA ENTERPRISE NG */

export const CURRENCY = "NGN" as const;
export const CURRENCY_SYMBOL = "₦";

/** Format amount as NGN, e.g. ₦25,000 */
export function formatNgn(amount: number): string {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Compact: ₦1,500.50 when kobo needed */
export function formatNgnExact(amount: number): string {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
