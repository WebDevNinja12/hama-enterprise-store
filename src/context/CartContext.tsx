"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product } from "@/lib/products";

const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const REMINDER_WINDOW_MS = 2 * 24 * 60 * 60 * 1000; // last 2 days

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  emoji: string;
  quantity: number;
  /** When item was first added (ms since epoch) */
  addedAt: number;
  /** Last time a reminder email was sent for this line */
  remindedAt?: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  clearCart: () => void;
  markReminded: (ids: string[]) => void;
  totalItems: number;
  subtotal: number;
  msUntilExpiry: (item: CartItem) => number;
  daysLeft: (item: CartItem) => number;
  needsReminder: (item: CartItem) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "hama-cart-v2";

function purgeExpired(list: CartItem[]): CartItem[] {
  const now = Date.now();
  return list.filter((i) => {
    const added = i.addedAt || now;
    return now - added < CART_TTL_MS;
  });
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        setItems(purgeExpired(parsed));
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // Persist + periodic purge every minute
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => {
      setItems((prev) => {
        const next = purgeExpired(prev);
        return next.length === prev.length ? prev : next;
      });
    }, 60_000);
    return () => clearInterval(t);
  }, [ready]);

  const addItem = useCallback((product: Product, qty = 1) => {
    const now = Date.now();
    setItems((prev) => {
      const cleaned = purgeExpired(prev);
      const existing = cleaned.find((i) => i.id === product.id);
      if (existing) {
        return cleaned.map((i) =>
          i.id === product.id
            ? {
                ...i,
                quantity: Math.min(i.quantity + qty, 99),
                // keep original addedAt so 7-day window continues
              }
            : i
        );
      }
      return [
        ...cleaned,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          emoji: product.emoji,
          quantity: qty,
          addedAt: now,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.min(quantity, 99) } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const markReminded = useCallback((ids: string[]) => {
    const now = Date.now();
    setItems((prev) =>
      prev.map((i) => (ids.includes(i.id) ? { ...i, remindedAt: now } : i))
    );
  }, []);

  const msUntilExpiry = useCallback((item: CartItem) => {
    const added = item.addedAt || Date.now();
    return Math.max(0, added + CART_TTL_MS - Date.now());
  }, []);

  const daysLeft = useCallback(
    (item: CartItem) => {
      return Math.ceil(msUntilExpiry(item) / (24 * 60 * 60 * 1000));
    },
    [msUntilExpiry]
  );

  const needsReminder = useCallback(
    (item: CartItem) => {
      const left = msUntilExpiry(item);
      if (left <= 0 || left > REMINDER_WINDOW_MS) return false;
      // remind at most once per item in the window
      if (item.remindedAt && Date.now() - item.remindedAt < REMINDER_WINDOW_MS) {
        return false;
      }
      return true;
    },
    [msUntilExpiry]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      markReminded,
      totalItems,
      subtotal,
      msUntilExpiry,
      daysLeft,
      needsReminder,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      markReminded,
      totalItems,
      subtotal,
      msUntilExpiry,
      daysLeft,
      needsReminder,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (days > 2) return `${days}d left`;
  if (days >= 1) return `${days}d ${hours}h left`;
  if (hours >= 1) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}
