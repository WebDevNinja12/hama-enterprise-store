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

const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  emoji: string;
  quantity: number;
  stock: number;
  addedAt: number;
  remindedAt?: number;
};

export type AddResult =
  | { ok: true; atMax?: boolean }
  | { ok: false; reason: "out_of_stock" | "max_reached" };

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => AddResult;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => AddResult;
  clearCart: () => void;
  markReminded: (ids: string[]) => void;
  totalItems: number;
  subtotal: number;
  msUntilExpiry: (item: CartItem) => number;
  daysLeft: (item: CartItem) => number;
  needsReminder: (item: CartItem) => boolean;
  getQtyInCart: (id: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "hama-cart-v3";

function purgeExpired(list: CartItem[]): CartItem[] {
  const now = Date.now();
  return list.filter((i) => now - (i.addedAt || now) < CART_TTL_MS);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(purgeExpired(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

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

  const getQtyInCart = useCallback(
    (id: string) => items.find((i) => i.id === id)?.quantity ?? 0,
    [items]
  );

  const addItem = useCallback((product: Product, qty = 1): AddResult => {
    const maxStock = Math.max(0, product.stock ?? 0);
    if (maxStock <= 0) return { ok: false, reason: "out_of_stock" };

    let result: AddResult = { ok: true };
    const now = Date.now();

    setItems((prev) => {
      const cleaned = purgeExpired(prev);
      const existing = cleaned.find((i) => i.id === product.id);
      const currentQty = existing?.quantity ?? 0;

      if (currentQty >= maxStock) {
        result = { ok: false, reason: "max_reached" };
        return cleaned;
      }

      const nextQty = Math.min(currentQty + qty, maxStock);
      if (nextQty === currentQty && currentQty > 0) {
        result = { ok: false, reason: "max_reached" };
        return cleaned;
      }

      result = { ok: true, atMax: nextQty >= maxStock };

      if (existing) {
        return cleaned.map((i) =>
          i.id === product.id
            ? { ...i, quantity: nextQty, stock: maxStock }
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
          quantity: nextQty,
          stock: maxStock,
          addedAt: now,
        },
      ];
    });

    return result;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, quantity: number): AddResult => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return { ok: true };
    }

    let result: AddResult = { ok: true };
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const maxStock = i.stock ?? 99;
        if (quantity > maxStock) {
          result = { ok: false, reason: "max_reached" };
          return { ...i, quantity: maxStock };
        }
        return { ...i, quantity: Math.min(quantity, maxStock) };
      })
    );
    return result;
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const markReminded = useCallback((ids: string[]) => {
    const now = Date.now();
    setItems((prev) =>
      prev.map((i) => (ids.includes(i.id) ? { ...i, remindedAt: now } : i))
    );
  }, []);

  const msUntilExpiry = useCallback((item: CartItem) => {
    return Math.max(0, (item.addedAt || Date.now()) + CART_TTL_MS - Date.now());
  }, []);

  const daysLeft = useCallback(
    (item: CartItem) => Math.ceil(msUntilExpiry(item) / (24 * 60 * 60 * 1000)),
    [msUntilExpiry]
  );

  const needsReminder = useCallback(
    (item: CartItem) => {
      const left = msUntilExpiry(item);
      if (left <= 0 || left > REMINDER_WINDOW_MS) return false;
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
      getQtyInCart,
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
      getQtyInCart,
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
