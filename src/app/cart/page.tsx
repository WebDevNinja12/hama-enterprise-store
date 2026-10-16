"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatCountdown, useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    items,
    updateQty,
    removeItem,
    clearCart,
    subtotal,
    totalItems,
    msUntilExpiry,
    daysLeft,
  } = useCart();
  const [, setTick] = useState(0);

  // Live countdown — refresh every 1 second
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-[var(--muted)]" />
        <h1 className="mb-2 text-2xl font-bold text-[var(--heading)]">
          Your cart is empty
        </h1>
        <p className="mb-2 text-sm text-[var(--muted)]">
          Items stay in your cart for up to 7 days.
        </p>
        <Link href="/catalog" className="btn-primary inline-flex px-6 py-3 text-sm">
          Browse catalog
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= 500 ? 0 : 25;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--heading)]">Cart</h1>
          <p className="text-sm text-[var(--muted)]">
            {totalItems} item{totalItems === 1 ? "" : "s"} · each item expires 7
            days after add (live countdown)
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-[var(--muted)] hover:text-red-400"
        >
          Clear cart
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {items.map((item) => {
            const ms = msUntilExpiry(item);
            const days = daysLeft(item);
            const urgent = days <= 2;
            return (
              <div
                key={item.id}
                className="card flex flex-wrap items-center gap-4 p-4"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--surface)] text-3xl">
                  {item.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.slug}`}
                    className="font-semibold text-[var(--heading)] hover:text-cyan-400"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-cyan-400">
                    ${item.price.toLocaleString()}
                  </p>
                  <p
                    className={`mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-semibold tabular-nums ${
                      urgent ? "text-amber-400" : "text-cyan-400"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {formatCountdown(ms)}
                    {urgent && (
                      <span className="font-sans font-medium">
                        · checkout soon
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                    className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted)] hover:text-[var(--heading)]"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-[var(--heading)]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--muted)] hover:text-[var(--heading)]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-2 rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          <div className="card sticky top-24 p-6">
            <h2 className="mb-4 font-semibold text-[var(--heading)]">Summary</h2>
            <div className="mb-4 space-y-2 text-sm text-[var(--muted)]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className={shipping === 0 ? "text-cyan-400" : ""}>
                  {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (est.)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="mb-5 flex justify-between border-t border-[var(--border)] pt-4">
              <span className="text-[var(--muted)]">Total</span>
              <span className="text-xl font-bold text-cyan-400">
                ${total.toFixed(2)}
              </span>
            </div>
            <Link
              href="/checkout"
              className="btn-primary flex w-full items-center justify-center py-3 text-sm"
            >
              Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
