/**
 * Base currency for the store is NGN.
 * Admin enters prices in Naira.
 * Customers can view NGN or USD (converted).
 */

export type DisplayCurrency = "NGN" | "USD";

/** Approximate rate: how many Naira = 1 US Dollar (update as needed) */
export const NGN_PER_USD = 1600;

export const CURRENCY_STORAGE_KEY = "hama-display-currency";

export function ngnToUsd(amountNgn: number): number {
  return (Number(amountNgn) || 0) / NGN_PER_USD;
}

export function usdToNgn(amountUsd: number): number {
  return (Number(amountUsd) || 0) * NGN_PER_USD;
}

/** Format a NGN base amount in the chosen display currency */
export function formatMoney(
  amountNgn: number,
  currency: DisplayCurrency = "NGN"
): string {
  const n = Number(amountNgn) || 0;
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(ngnToUsd(n));
  }
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Show both: primary + secondary in parentheses */
export function formatMoneyBoth(amountNgn: number, primary: DisplayCurrency): string {
  const secondary: DisplayCurrency = primary === "NGN" ? "USD" : "NGN";
  return `${formatMoney(amountNgn, primary)} (${formatMoney(amountNgn, secondary)})`;
}

/** @deprecated use formatMoney(..., "NGN") */
export function formatNgn(amount: number): string {
  return formatMoney(amount, "NGN");
}

export function formatNgnExact(amount: number): string {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
