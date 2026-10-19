"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CURRENCY_STORAGE_KEY,
  type DisplayCurrency,
  formatMoney,
  formatMoneyBoth,
  NGN_PER_USD,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  toggleCurrency: () => void;
  /** Format NGN-base amount in the selected currency */
  format: (amountNgn: number) => string;
  /** Format with both currencies */
  formatBoth: (amountNgn: number) => string;
  rateLabel: string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>("NGN");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved === "USD" || saved === "NGN") {
        setCurrencyState(saved);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setCurrency = useCallback((c: DisplayCurrency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCurrency = useCallback(() => {
    setCurrency(currency === "NGN" ? "USD" : "NGN");
  }, [currency, setCurrency]);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      toggleCurrency,
      format: (amountNgn: number) => formatMoney(amountNgn, currency),
      formatBoth: (amountNgn: number) => formatMoneyBoth(amountNgn, currency),
      rateLabel: `1 USD ≈ ₦${NGN_PER_USD.toLocaleString()}`,
    }),
    [currency, setCurrency, toggleCurrency]
  );

  // Avoid hydration mismatch: still provide NGN until localStorage read
  if (!ready) {
    return (
      <CurrencyContext.Provider
        value={{
          currency: "NGN",
          setCurrency,
          toggleCurrency,
          format: (a) => formatMoney(a, "NGN"),
          formatBoth: (a) => formatMoneyBoth(a, "NGN"),
          rateLabel: `1 USD ≈ ₦${NGN_PER_USD.toLocaleString()}`,
        }}
      >
        {children}
      </CurrencyContext.Provider>
    );
  }

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return ctx;
}
