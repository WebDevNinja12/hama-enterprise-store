"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Bitcoin,
  Lock,
  Truck,
  CheckCircle,
  Building2,
  Copy,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

type PaymentMethod = "card" | "bank" | "crypto";

const BANK_DETAILS = {
  bankName: "Access Bank",
  accountName: "HAMA ENTERPRISE NG",
  accountNumber: "0123456789",
  sortCode: "044",
};

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, subtotal, clearCart, totalItems } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
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
    postal: "",
    transferRef: "",
  });

  // Require account
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

  const shipping = subtotal >= 500 || subtotal === 0 ? 0 : 25;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  function copyAccountNumber() {
    navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="mb-2 text-[var(--muted)]">
          {status === "unauthenticated"
            ? "Redirecting to sign in..."
            : "Loading..."}
        </p>
        <p className="text-sm text-[var(--muted)]">
          You need an account to checkout.{" "}
          <Link href="/register?callbackUrl=/checkout" className="text-cyan-400">
            Create one
          </Link>
        </p>
      </div>
    );
  }

  if (orderResult) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-cyan-400" />
        <h1 className="mb-2 text-2xl font-bold text-[var(--heading)]">
          Order confirmed
        </h1>
        <p className="mb-2 text-[var(--muted)]">
          Order number:{" "}
          <span className="font-mono font-semibold text-cyan-400">
            {orderResult.orderNumber}
          </span>
        </p>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Total: ${orderResult.total.toFixed(2)} · {orderResult.paymentMethod}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/catalog"
            className="btn-primary inline-flex rounded-xl px-6 py-3 text-sm"
          >
            Continue shopping
          </Link>
          <Link
            href="/account"
            className="btn-secondary inline-flex rounded-xl px-6 py-3 text-sm"
          >
            View my orders
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold text-[var(--heading)]">
          Nothing to checkout
        </h1>
        <Link href="/catalog" className="text-cyan-400 hover:underline">
          Go to Catalog
        </Link>
      </div>
    );
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setPlacing(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            slug: i.slug,
            price: i.price,
            quantity: i.quantity,
          })),
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || session?.user?.email,
          phone: form.phone || undefined,
          address: form.address,
          city: form.city,
          postal: form.postal,
          country: "NG",
          paymentMethod,
          paymentReference:
            paymentMethod === "bank" ? form.transferRef || undefined : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "AUTH_REQUIRED") {
          router.push("/login?callbackUrl=/checkout");
          return;
        }
        throw new Error(data.error || "Failed to place order");
      }

      clearCart();
      setOrderResult({
        orderNumber: data.order.orderNumber,
        total: data.order.total,
        paymentMethod: data.order.paymentMethod,
        status: data.order.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setPlacing(false);
    }
  }

  const methodBtn = (
    id: PaymentMethod,
    label: string,
    icon: React.ReactNode
  ) => (
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
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
        <Lock className="h-3.5 w-3.5 text-cyan-400" />
        <span className="font-medium text-cyan-400">SECURE CHECKOUT</span>
        <span>· Account required</span>
      </div>
      <h1 className="mb-8 text-3xl font-bold text-[var(--heading)]">Checkout</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder}>
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <div className="card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-cyan-400" />
                <h2 className="font-semibold text-[var(--heading)]">
                  Contact & Shipping
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">
                    First Name
                  </label>
                  <input
                    required
                    className="input"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">
                    Last Name
                  </label>
                  <input
                    required
                    className="input"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">
                    Email (account)
                  </label>
                  <input
                    required
                    type="email"
                    className="input"
                    value={form.email}
                    readOnly
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">
                    Street Address
                  </label>
                  <input
                    required
                    className="input"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">
                    City
                  </label>
                  <input
                    required
                    className="input"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-[var(--muted)]">
                    Postal Code
                  </label>
                  <input
                    required
                    className="input"
                    value={form.postal}
                    onChange={(e) =>
                      setForm({ ...form, postal: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cyan-400" />
                <h2 className="font-semibold text-[var(--heading)]">
                  Payment Method
                </h2>
              </div>
              <div className="mb-5 flex flex-wrap gap-2">
                {methodBtn("card", "Card", <CreditCard className="h-4 w-4" />)}
                {methodBtn("bank", "Bank", <Building2 className="h-4 w-4" />)}
                {methodBtn("crypto", "Crypto", <Bitcoin className="h-4 w-4" />)}
              </div>

              {paymentMethod === "bank" && (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5 text-sm">
                  <p className="mb-2 text-cyan-400">
                    Transfer ${total.toFixed(2)} to {BANK_DETAILS.accountName}
                  </p>
                  <p className="font-mono text-[var(--heading)]">
                    {BANK_DETAILS.accountNumber}{" "}
                    <button type="button" onClick={copyAccountNumber}>
                      <Copy className="inline h-3.5 w-3.5" />
                    </button>
                    {copied && " Copied"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card sticky top-24 p-6">
              <h2 className="mb-4 font-semibold text-[var(--heading)]">
                Order Summary ({totalItems})
              </h2>
              <ul className="mb-4 max-h-48 space-y-2 overflow-y-auto text-sm text-[var(--muted)]">
                {items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span className="truncate">
                      {item.emoji} {item.name} × {item.quantity}
                      {item.stock != null && (
                        <span className="text-[10px]"> (max {item.stock})</span>
                      )}
                    </span>
                    <span className="text-[var(--heading)]">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mb-4 space-y-2 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="mb-5 flex justify-between border-t border-[var(--border)] pt-4">
                <span className="text-[var(--muted)]">Total</span>
                <span className="text-2xl font-bold text-cyan-400">
                  ${total.toFixed(2)}
                </span>
              </div>
              <button
                type="submit"
                disabled={placing}
                className="btn-primary w-full py-3.5 text-sm disabled:opacity-50"
              >
                {placing ? "Placing order..." : "Place order"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
