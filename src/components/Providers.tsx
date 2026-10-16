"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import CartReminder from "@/components/CartReminder";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CartProvider>
          <CartReminder />
          {children}
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
