"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import CartReminder from "@/components/CartReminder";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchInterval={0}
    >
      <ThemeProvider>
        <CurrencyProvider>
          <CartProvider>
            <CartReminder />
            {children}
          </CartProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
