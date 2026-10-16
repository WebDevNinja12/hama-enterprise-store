"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, RefreshCw } from "lucide-react";

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  price: string | number;
};

type Order = {
  id: string;
  orderNumber: string;
  customerEmail: string;
  shippingName: string;
  shippingCity: string;
  status: string;
  total: string | number;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: string;
  items: OrderItem[];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="mb-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-sm text-[var(--muted)]">
            Real orders from the database
          </p>
        </div>
        <button
          onClick={load}
          className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
          <p className="mt-1 text-xs opacity-80">
            Tip: sign in as ADMIN, or ensure DATABASE_URL is set and run{" "}
            <code className="rounded bg-black/30 px-1">npx prisma db push</code>
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-[var(--muted)]">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-[var(--muted)]" />
          <p className="text-white">No orders yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Place a test order from checkout to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-cyan-400">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm text-white">{order.shippingName}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {order.customerEmail} · {order.shippingCity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    ${Number(order.total).toFixed(2)}
                  </p>
                  <span className="badge badge-cyan text-[10px]">
                    {order.status}
                  </span>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {order.paymentMethod || "—"}
                    {order.paymentReference
                      ? ` · ${order.paymentReference}`
                      : ""}
                  </p>
                </div>
              </div>
              <ul className="border-t border-[var(--border)] pt-3 text-sm text-[var(--muted)]">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between py-1">
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="text-white">
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
