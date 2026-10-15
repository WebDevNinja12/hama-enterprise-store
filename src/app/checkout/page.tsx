"use client";

import { useState } from "react";
import { CreditCard, Bitcoin, Lock, Truck } from "lucide-react";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
        <Lock className="h-3.5 w-3.5 text-cyan-400" />
        <span className="font-medium text-cyan-400">SECURE TRANSMISSION</span>
        <span>· SSL 256-BIT ENCRYPTION</span>
      </div>
      <h1 className="mb-8 text-3xl font-bold text-white">Checkout & Verification</h1>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-cyan-400" />
              <h2 className="font-semibold text-white">Shipping Destination</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-xs text-[var(--muted)]">First Name</label><input className="input" placeholder="Kaelen" /></div>
              <div><label className="mb-1.5 block text-xs text-[var(--muted)]">Last Name</label><input className="input" placeholder="Cross" /></div>
              <div className="sm:col-span-2"><label className="mb-1.5 block text-xs text-[var(--muted)]">Street Address</label><input className="input" placeholder="900 Cyber Way" /></div>
              <div><label className="mb-1.5 block text-xs text-[var(--muted)]">City</label><input className="input" placeholder="Lagos" /></div>
              <div><label className="mb-1.5 block text-xs text-[var(--muted)]">Postal Code</label><input className="input" placeholder="100001" /></div>
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-cyan-400" />
              <h2 className="font-semibold text-white">Payment Method</h2>
            </div>
            <div className="mb-5 flex gap-3">
              <button onClick={() => setPaymentMethod("card")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  paymentMethod === "card" ? "bg-cyan-500 text-black" : "border border-[var(--border)] text-[var(--muted)]"}`}>
                <CreditCard className="h-4 w-4" /> Credit Card
              </button>
              <button onClick={() => setPaymentMethod("crypto")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  paymentMethod === "crypto" ? "bg-cyan-500 text-black" : "border border-[var(--border)] text-[var(--muted)]"}`}>
                <Bitcoin className="h-4 w-4" /> Crypto / QR
              </button>
            </div>
            {paymentMethod === "card" ? (
              <div className="space-y-4">
                <div><label className="mb-1.5 block text-xs text-[var(--muted)]">Card Number</label><input className="input" placeholder="4532 8821 9012 8892" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="mb-1.5 block text-xs text-[var(--muted)]">Expiry</label><input className="input" placeholder="08/28" /></div>
                  <div><label className="mb-1.5 block text-xs text-[var(--muted)]">CVV</label><input className="input" placeholder="•••" type="password" maxLength={4} /></div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-cyan-500/30 bg-cyan-500/5 p-6 text-center">
                <p className="mb-2 text-sm text-[var(--muted)]">Scan the QR code with your wallet app</p>
                <div className="mx-auto mb-3 flex h-40 w-40 items-center justify-center rounded-xl bg-white text-4xl">▦</div>
                <p className="text-xs text-cyan-400">Supports BTC, ETH, USDT · Powered by Stripe</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card sticky top-24 p-6">
            <h2 className="mb-4 font-semibold text-white">Order Summary</h2>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between text-[var(--muted)]"><span>Subtotal</span><span>$1,777.00</span></div>
              <div className="flex justify-between text-[var(--muted)]"><span>Shipping</span><span className="text-cyan-400">FREE</span></div>
              <div className="flex justify-between text-[var(--muted)]"><span>Tax</span><span>$142.16</span></div>
            </div>
            <div className="mb-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
              <p className="text-sm text-[var(--muted)]">Total Due</p>
              <p className="text-2xl font-bold text-cyan-400">$1,919.16</p>
            </div>
            <button className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm">
              ⚡ Secure Place Order
            </button>
            <p className="mt-3 text-center text-xs text-[var(--muted)]">🔒 Guaranteed secure 256-bit encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
}
