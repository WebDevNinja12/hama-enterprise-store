"use client";

import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, totalItems, clearCart } =
    useCart();

  const shipping = subtotal >= 500 || subtotal === 0 ? 0 : 25;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-[var(--muted)]" />
        <h1 className="mb-2 text-2xl font-bold text-white">Your cart is empty</h1>
        <p className="mb-6 text-[var(--muted)]">
          Browse the catalog and add hardware to get started.
        </p>
        <Link
          href="/catalog"
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm"
        >
          Browse Catalog <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>
          <p className="text-sm text-[var(--muted)]">{totalItems} item(s)</p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-red-400 hover:underline"
        >
          Clear cart
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              <Link
                href={`/product/${item.slug}`}
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-3xl"
              >
                {item.emoji}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${item.slug}`}
                  className="font-semibold text-white hover:text-cyan-400"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-cyan-400">
                  ${item.price.toLocaleString()} each
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-[var(--border)]">
                  <button
                    onClick={() => updateQty(item.id, item.quantity - 1)}
                    className="px-2.5 py-1.5 text-white hover:bg-white/5"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, item.quantity + 1)}
                    className="px-2.5 py-1.5 text-white hover:bg-white/5"
                  >
                    +
                  </button>
                </div>
                <p className="w-20 text-right font-semibold text-white">
                  ${(item.price * item.quantity).toLocaleString()}
                </p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <div className="card sticky top-24 p-6">
            <h2 className="mb-4 font-semibold text-white">Order Summary</h2>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Shipping</span>
                <span className={shipping === 0 ? "text-cyan-400" : ""}>
                  {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="mb-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
              <p className="text-sm text-[var(--muted)]">Total</p>
              <p className="text-2xl font-bold text-cyan-400">
                ${total.toFixed(2)}
              </p>
            </div>
            <Link
              href="/checkout"
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/catalog"
              className="mt-3 block text-center text-sm text-cyan-400 hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
