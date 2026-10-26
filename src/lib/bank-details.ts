/**
 * Bank transfer details for checkout.
 * Set on Vercel (Production) — no custom domain required:
 *   NEXT_PUBLIC_BANK_NAME
 *   NEXT_PUBLIC_BANK_ACCOUNT_NAME
 *   NEXT_PUBLIC_BANK_ACCOUNT_NUMBER
 *   NEXT_PUBLIC_BANK_SORT_CODE (optional)
 */
export type BankDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  sortCode?: string;
  configured: boolean;
};

export function getBankDetails(): BankDetails {
  const bankName = (process.env.NEXT_PUBLIC_BANK_NAME || "").trim();
  const accountName = (process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "").trim();
  const accountNumber = (process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "").trim();
  const sortCode = (process.env.NEXT_PUBLIC_BANK_SORT_CODE || "").trim();

  const configured = Boolean(bankName && accountName && accountNumber);

  return {
    bankName: bankName || "Bank name not set",
    accountName: accountName || "HAMA ENTERPRISE NG",
    accountNumber: accountNumber || "—",
    sortCode: sortCode || undefined,
    configured,
  };
}

/** Card/OPay only when public key is present */
export function isOnlinePayEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_OPAY_PUBLIC_KEY ||
      process.env.OPAY_PUBLIC_KEY
  );
}
