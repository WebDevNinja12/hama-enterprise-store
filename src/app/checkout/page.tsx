"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Bitcoin, Lock, Truck, CheckCircle, Building2, Copy } from "lucide-react";
import { useCart } from "@/context/CartContext";

type PaymentMethod = "card" | "bank" | "crypto";

const BANK_DETAILS = {
  bankName: "Access Bank",
  accountName: "HAMA ENTERPRISE NG",
  accountNumber: "0123456789",
  sortCode: "044",
};

export default function CheckoutPage() {
  const { items, subtotal, clearCart, totalItems } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postal: "",
    transferRef: "",
  });

  const shipping = subtotal >= 500 || subtotal === 0 ? 0 : 25;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  function copyAccountNumber() {
    navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-cyan-400" />
        <h1 className="mb-2 text-2xl font-bold text-white">Order placed!</h1>
        <p className="mb-6 text-[var(--muted)]">
          {paymentMethod === "bank"
            ? "Thank you. Your order is pending confirmation of bank transfer. We will notify you once payment is verified."
            : "Thank you for shopping with HAMA ENTERPRISE NG. You will receive a confirmation shortly."}
        </p>
        <Link
          href="/catalog"
          className="btn-primary inline-flex rounded-xl px-6 py-3 text-sm"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold text-white">Nothing to checkout</h1>
        <p className="mb-6 text-[var(--muted)]">Add items to your cart first.</p>
        <Link href="/catalog" className="text-cyan-400 hover:underline">
          Go to Catalog
        </Link>
      </div>
    );
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 900));
    clearCart();
    setDone(true);
    setPlacing(false);
  }

  const methodBtn = (id: PaymentMethod, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setPaymentMethod(id)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${
        paymentMethod === id
          ? "bg-cyan-500 text-black"
          : "border border-[var(--border)] text-[var(--muted)] hover:border-cyan-500/40"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(" ")[0]}</span>
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
        <Lock className="h-3.5 w-3.5 text-cyan-400" />
        <span className="font-medium text-cyan-400">SECURE TRANSMISSION</span>
        <span>· SSL 256-BIT ENCRYPTION</span>
      </div>
      <h1 className="mb-8 text-3xl font-bold text-white">Checkout & Verification</h1>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <div className="card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-cyan-400" />
                <h2 className="font-semibold text-white">Shipping Destination</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">First Name</label>
                  <input
                    required
                    className="input"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Kaelen"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">Last Name</label>
                  <input
                    required
                    className="input"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Cross"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">Street Address</label>
                  <input
                    required
                    className="input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="900 Cyber Way"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">City</label>
                  <input
                    required
                    className="input"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Lagos"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">Postal Code</label>
                  <input
                    required
                    className="input"
                    value={form.postal}
                    onChange={(e) => setForm({ ...form, postal: e.target.value })}
                    placeholder="100001"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cyan-400" />
                <h2 className="font-semibold text-white">Payment Method</h2>
              </div>
              <div className="mb-5 flex flex-wrap gap-2 sm:gap-3">
                {methodBtn("card", "Credit Card", <CreditCard className="h-4 w-4" />)}
                {methodBtn("bank", "Bank Transfer", <Building2 className="h-4 w-4" />)}
                {methodBtn("crypto", "Crypto / QR", <Bitcoin className="h-4 w-4" />)}
              </div>

              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs text-[var(--muted)]">Card Number</label>
                    <input className="input" placeholder="4532 8821 9012 8892" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs text-[var(--muted)]">Expiry</label>
                      <input className="input" placeholder="08/28" required />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-[var(--muted)]">CVV</label>
                      <input className="input" placeholder="•••" type="password" maxLength={4} required />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Demo mode — card data is not charged. Connect Stripe later for real payments.
                  </p>
                </div>
              )}

              {paymentMethod === "bank" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5">
                    <p className="mb-3 text-sm font-medium text-cyan-400">
                      Transfer exactly <span className="text-white">${total.toFixed(2)}</span> to:
                    </p>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-[var(--muted)]">Bank</dt>
                        <dd className="font-medium text-white">{BANK_DETAILS.bankName}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-[var(--muted)]">Account Name</dt>
                        <dd className="font-medium text-white">{BANK_DETAILS.accountName}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[var(--muted)]">Account Number</dt>
                        <dd className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400">
                            {BANK_DETAILS.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={copyAccountNumber}
                            className="rounded p-1 text-[var(--muted)] hover:bg-white/10 hover:text-cyan-400"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          {copied && (
                            <span className="text-xs text-cyan-400">Copied</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-[var(--muted)]">Sort Code</dt>
                        <dd className="font-medium text-white">{BANK_DETAILS.sortCode}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-[var(--muted)]">
                      Transfer reference / narration (optional)
                    </label>
                    <input
                      className="input"
                      value={form.transferRef}
                      onChange={(e) => setForm({ ...form, transferRef: e.target.value })}
                      placeholder="Your name or order note"
                    />
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    After transfer, place the order. We will confirm payment and process
                    shipping. Update these bank details in the code when you have the real account.
                  </p>
                </div>
              )}

              {paymentMethod === "crypto" && (
                <div className="rounded-lg border border-dashed border-cyan-500/30 bg-cyan-500/5 p-6 text-center">
                  <p className="mb-2 text-sm text-[var(--muted)]">
                    Scan the QR code with your wallet app
                  </p>
                  <div className="mx-auto mb-3 flex h-40 w-40 items-center justify-center rounded-xl bg-white text-4xl">
                    ▦
                  </div>
                  <p className="text-xs text-cyan-400">
                    Supports BTC, ETH, USDT · Stripe-ready
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card sticky top-24 p-6">
              <h2 className="mb-4 font-semibold text-white">
                Order Summary ({totalItems})
              </h2>
              <ul className="mb-4 max-h-48 space-y-2 overflow-y-auto text-sm">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-2 text-[var(--muted)]"
                  >
                    <span className="truncate">
                      {item.emoji} {item.name} × {item.quantity}
                    </span>
                    <span className="shrink-0 text-white">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mb-4 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-cyan-400" : ""}>
                    {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="mb-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
                <p className="text-sm text-[var(--muted)]">Total Due</p>
                <p className="text-2xl font-bold text-cyan-400">${total.toFixed(2)}</p>
              </div>
              <button
                type="submit"
                disabled={placing}
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm disabled:opacity-50"
              >
                {placing
                  ? "Processing..."
                  : paymentMethod === "bank"
                    ? "I Have Transferred — Place Order"
                    : "⚡ Secure Place Order"}
              </button>
              <p className="mt-3 text-center text-xs text-[var(--muted)]">
                🔒 Guaranteed secure 256-bit encryption
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
