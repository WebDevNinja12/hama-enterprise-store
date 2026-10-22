/**
 * Stripe removed — HAMA uses OPay + bank transfer.
 * Stub kept so any leftover imports do not break the build.
 */
export function getStripe(): never {
  throw new Error("Stripe is not configured. Use OPay or bank transfer.");
}

export const stripe = null;
