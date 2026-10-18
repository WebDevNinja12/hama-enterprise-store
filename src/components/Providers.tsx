"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import CartReminder from "@/components/CartReminder";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Avoid refetch on every focus — was causing AdminGuard "Checking access..."
      // and wiping focused form fields on mobile.
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchInterval={0}
    >
      <ThemeProvider>
        <CartProvider>
          <CartReminder />
          {children}
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
