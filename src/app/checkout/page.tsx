"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Lock,
  Truck,
  CheckCircle,
  Building2,
  Copy,
  Phone,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import {
  NIGERIA_STATES,
  FREE_SHIPPING_MIN,
  calcShipping,
  isValidNgPhone,
} from "@/lib/shipping";

type PaymentMethod = "card" | "bank";

const BANK_DETAILS = {
  bankName: process.env.NEXT_PUBLIC_BANK_NAME || "Bank name not configured",
  accountName:
    process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "HAMA ENTERPRISE NG",
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "—",
  sortCode: process.env.NEXT_PUBLIC_BANK_SORT_CODE || "",
};
const bankConfigured = Boolean(
  process.env.NEXT_PUBLIC_BANK_NAME &&
    process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME &&
    process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER
);
const onlinePayEnabled = Boolean(process.env.NEXT_PUBLIC_OPAY_PUBLIC_KEY);

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, subtotal, clearCart, totalItems } = useCart();
  const { format, formatBoth, currency } = useCurrency();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [orderResult, setOrderResult] = useState<{
    orderNumber: string;
    total: number;
    paymentMethod: string;
    status: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Lagos",
    postal: "",
    transferRef: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      setForm((f) => ({
        ...f,
        email: session.user?.email || f.email,
        firstName: f.firstName || (session.user?.name || "").split(" ")[0] || "",
        lastName:
          f.lastName ||
          (session.user?.name || "").split(" ").slice(1).join(" ") ||
          "",
      }));
    }
  }, [session]);

  const shipping = useMemo(
    () => calcShipping(form.state, subtotal),
    [form.state, subtotal]
  );
  const total = subtotal + shipping;

  function copyAccountNumber() {
    if (!bankConfigured) return;
    navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function methodBtn(
    id: PaymentMethod,
    label: string,
    icon: React.ReactNode
  ) {
    const active = paymentMethod === id;
    return (
      <button
        type="button"
        key={id}
        onClick={() => setPaymentMethod(id)}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ring-1 transition ${
          active
            ? "bg-cyan-500/15 text-cyan-300 ring-cyan-500/40"
            : "text-[var(--muted)] ring-[var(--border)] hover:text-[var(--heading)]"
        }`}
      >
        {icon}
        {label}
      </button>
    );
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!session?.user?.id) {
      setError("Sign in required to checkout.");
      return;
    }
    if (!isValidNgPhone(form.phone)) {
      setError("Enter a valid Nigerian phone number.");
      return;
    }
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (paymentMethod === "bank" && !bankConfigured) {
      setError(
        "Bank transfer is not configured yet. Contact support or try again later."
      );
      return;
    }
    if (paymentMethod === "card" && !onlinePayEnabled) {
      setError("Card payment is not available yet. Use bank transfer.");
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.id,
            name: i.name,
            slug: i.slug,
            price: i.price,
            quantity: i.quantity,
          })),
          customerEmail: form.email.trim().toLowerCase(),
          customerPhone: form.phone.trim(),
          shippingName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          shippingAddress: form.address.trim(),
          shippingCity: form.city.trim(),
          shippingState: form.state,
          shippingPostal: form.postal.trim() || "000000",
          shippingCountry: "NG",
          paymentMethod,
          paymentReference: form.transferRef.trim() || undefined,
          notes:
            paymentMethod === "bank"
              ? `Bank transfer to ${BANK_DETAILS.accountNumber}. Ref: ${form.transferRef || "n/a"}`
              : undefined,
          subtotal,
          shipping,
          total,
          currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place order");
      clearCart();
      setOrderResult({
        orderNumber: data.order?.orderNumber || data.orderNumber,
        total,
        paymentMethod,
        status: data.order?.status || "PENDING",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setPlacing(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-[var(--muted)]">
        Loading checkout…
      </div>
    );
  }

  if (orderResult) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
        <h1 className="text-2xl font-bold text-[var(--heading)]">Order placed</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Order <span className="font-mono text-cyan-400">{orderResult.orderNumber}</span>
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Total {format(orderResult.total)} · {orderResult.paymentMethod}
        </p>
        {orderResult.paymentMethod === "bank" && (
          <p className="mt-4 text-sm text-amber-200/90">
            Your order is <strong>pending</strong> until HAMA confirms your bank
            transfer. Keep your transfer receipt.
          </p>
        )}
        <Link href="/account" className="btn-primary mt-8 inline-flex px-6 py-2.5 text-sm">
          View my orders
        </Link>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-[var(--heading)]">Your cart is empty</p>
        <Link href="/catalog" className="btn-primary mt-6 inline-flex px-6 py-2.5 text-sm">
          Browse catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-[var(--heading)]">Checkout</h1>
      <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Truck className="h-4 w-4 text-cyan-400" />
              <h2 className="font-semibold text-[var(--heading)]">Shipping</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="input"
                placeholder="First name"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <input
                className="input"
                placeholder="Last name"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
              <input
                className="input sm:col-span-2"
                type="email"
                placeholder="Email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <div className="sm:col-span-2">
                <label className="mb-1 flex items-center gap-1 text-xs text-[var(--muted)]">
                  <Phone className="h-3 w-3" /> Phone (Nigeria)
                </label>
                <input
                  className="input"
                  placeholder="0801 234 5678"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <input
                className="input sm:col-span-2"
                placeholder="Address"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <input
                className="input"
                placeholder="City"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <select
                className="input"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              >
                {NIGERIA_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Postal (optional)"
                value={form.postal}
                onChange={(e) => setForm({ ...form, postal: e.target.value })}
              />
            </div>
            {subtotal >= FREE_SHIPPING_MIN && (
              <p className="mt-3 text-xs text-emerald-400">
                Free shipping threshold reached
              </p>
            )}
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-400" />
              <h2 className="font-semibold text-[var(--heading)]">Payment method</h2>
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              {methodBtn("bank", "Bank transfer", <Building2 className="h-4 w-4" />)}
              {onlinePayEnabled &&
                methodBtn("card", "Card", <CreditCard className="h-4 w-4" />)}
            </div>
            {!bankConfigured && paymentMethod === "bank" && (
              <p className="mb-3 text-xs text-amber-400">
                Bank account details are not set yet. Add NEXT_PUBLIC_BANK_* on
                Vercel, or contact support.
              </p>
            )}

            {paymentMethod === "bank" && bankConfigured && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5 text-sm">
                <p className="mb-2 text-cyan-400">
                  Transfer {format(total)} to {BANK_DETAILS.accountName}
                </p>
                <p className="mb-1 text-xs text-[var(--muted)]">{formatBoth(total)}</p>
                <p className="text-[var(--muted)]">{BANK_DETAILS.bankName}</p>
                <p className="font-mono text-[var(--heading)]">
                  {BANK_DETAILS.accountNumber}{" "}
                  <button type="button" onClick={copyAccountNumber} aria-label="Copy">
                    <Copy className="inline h-3.5 w-3.5" />
                  </button>
                  {copied && " Copied"}
                </p>
                {BANK_DETAILS.sortCode && (
                  <p className="text-xs text-[var(--muted)]">
                    Sort/code: {BANK_DETAILS.sortCode}
                  </p>
                )}
                <label className="mb-1.5 mt-3 block text-xs text-[var(--muted)]">
                  Transfer reference (optional)
                </label>
                <input
                  className="input"
                  value={form.transferRef}
                  onChange={(e) =>
                    setForm({ ...form, transferRef: e.target.value })
                  }
                  placeholder="Bank transfer reference"
                />
              </div>
            )}

            {paymentMethod === "card" && (
              <p className="text-sm text-[var(--muted)]">
                Card payment via OPay will open after order confirmation when
                fully enabled.
              </p>
            )}
          </div>

          <p className="text-xs text-[var(--muted)]">
            By placing an order you agree to our{" "}
            <Link href="/terms" className="text-cyan-400 hover:underline">
              Terms
            </Link>
            ,{" "}
            <Link href="/privacy" className="text-cyan-400 hover:underline">
              Privacy Policy
            </Link>
            , and{" "}
            <Link href="/refund" className="text-cyan-400 hover:underline">
              Refund Policy
            </Link>
            .
          </p>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={placing}
            className="btn-primary w-full py-3 text-sm disabled:opacity-50 sm:w-auto sm:px-10"
          >
            {placing ? "Placing order…" : `Place order · ${format(total)}`}
          </button>
        </div>

        <div className="lg:col-span-2">
          <div className="card sticky top-24 p-6">
            <h2 className="mb-4 font-semibold text-[var(--heading)]">Summary</h2>
            <ul className="mb-4 space-y-2 text-sm text-[var(--muted)]">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span>
                    {i.name} × {i.quantity}
                  </span>
                  <span className="text-[var(--heading)]">
                    {format(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-1 border-t border-[var(--border)] pt-3 text-sm">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Subtotal</span>
                <span>{format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Shipping</span>
                <span>{format(shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[var(--heading)]">
                <span>Total</span>
                <span className="text-cyan-400">{format(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
