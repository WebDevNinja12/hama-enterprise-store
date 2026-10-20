"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  RefreshCw,
  Check,
  X,
  Truck,
  PackageCheck,
  Clock,
  Trash2,
  Phone,
  Mail,
} from "lucide-react";
import { formatNgn } from "@/lib/currency";

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
  customerPhone: string | null;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostal: string;
  status: string;
  total: string | number;
  paymentMethod: string | null;
  paymentReference: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "badge-warning",
  PROCESSING: "badge-cyan",
  SHIPPED: "badge-cyan",
  DELIVERED: "badge-success",
  CANCELLED: "badge-danger",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [clearing, setClearing] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setOrders(data.orders || []);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      setSuccess(
        `Order updated to ${status}. Customer notified by email if configured.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered(ids: string[]) {
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }

  async function clearSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      setError("Select at least one order to clear.");
      return;
    }
    if (
      !confirm(
        `Permanently delete ${ids.length} selected order(s)? This cannot be undone.`
      )
    ) {
      return;
    }
    setClearing(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/orders/clear", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clear failed");
      setOrders((prev) => prev.filter((o) => !selected.has(o.id)));
      setSelected(new Set());
      setSuccess(data.message || `Cleared ${ids.length} order(s)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear orders");
    } finally {
      setClearing(false);
    }
  }

  const filtered =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
  const filteredIds = filtered.map((o) => o.id);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));

  const counts = {
    ALL: orders.length,
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    PROCESSING: orders.filter((o) => o.status === "PROCESSING").length,
    SHIPPED: orders.filter((o) => o.status === "SHIPPED").length,
    DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };

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
          <h1 className="text-2xl font-bold text-[var(--heading)]">
            Order management
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Phone &amp; email shown · status changes email the customer
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={load}
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={clearSelected}
            disabled={clearing || selected.size === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            {clearing ? "Clearing…" : `Clear selected (${selected.size})`}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            "ALL",
            "PENDING",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
          ] as const
        ).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === s
                ? "bg-cyan-500 text-black"
                : "border border-[var(--border)] text-[var(--muted)] hover:border-cyan-500/40"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()} ({
              counts[s]
            })
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {loading ? (
        <p className="text-[var(--muted)]">Loading orders...</p>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-[var(--muted)]" />
          <p className="text-[var(--heading)]">No orders in this filter</p>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={() => toggleAllFiltered(filteredIds)}
              className="h-4 w-4 rounded border-[var(--border)]"
            />
            Select all in this filter ({filtered.length})
          </label>

          {filtered.map((order) => {
            const busy = updatingId === order.id;
            const isDelivered = order.status === "DELIVERED";
            const isChecked = selected.has(order.id);
            return (
              <div
                key={order.id}
                className={`card p-5 ${
                  isChecked ? "ring-1 ring-cyan-500/40" : ""
                }`}
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(order.id)}
                      className="mt-1 h-4 w-4 rounded border-[var(--border)]"
                      aria-label={`Select order ${order.orderNumber}`}
                    />
                    <div>
                      <p className="font-mono text-sm font-semibold text-cyan-400">
                        {order.orderNumber}
                      </p>
                      <p className="text-sm font-medium text-[var(--heading)]">
                        {order.shippingName}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3 text-cyan-400" />
                          {order.customerEmail}
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-[var(--heading)]">
                          <Phone className="h-3 w-3 text-cyan-400" />
                          {order.customerPhone || "No phone on order"}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {order.shippingAddress}, {order.shippingCity}{" "}
                        {order.shippingPostal}
                      </p>
                      {order.paymentMethod && (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Payment: {order.paymentMethod}
                          {order.paymentReference
                            ? ` · Ref: ${order.paymentReference}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--heading)]">
                      {formatNgn(Number(order.total))}
                    </p>
                    <span
                      className={`badge text-[10px] ${
                        STATUS_STYLES[order.status] || "badge-cyan"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                <ul className="mb-4 border-t border-[var(--border)] pt-3 text-sm text-[var(--muted)]">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between py-1">
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="text-[var(--heading)]">
                        {formatNgn(Number(item.price) * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                  {order.status === "PENDING" && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => updateStatus(order.id, "PROCESSING")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" /> Accept
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => updateStatus(order.id, "CANCELLED")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3.5 py-1.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/30 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Decline
                      </button>
                    </>
                  )}

                  {order.status === "PROCESSING" && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => updateStatus(order.id, "SHIPPED")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-3.5 py-1.5 text-xs font-semibold text-cyan-400 ring-1 ring-cyan-500/30 disabled:opacity-50"
                      >
                        <Truck className="h-3.5 w-3.5" /> Mark shipped
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => updateStatus(order.id, "CANCELLED")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3.5 py-1.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/30 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </>
                  )}

                  {order.status === "SHIPPED" && (
                    <button
                      disabled={busy}
                      onClick={() => updateStatus(order.id, "DELIVERED")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30 disabled:opacity-50"
                    >
                      <PackageCheck className="h-3.5 w-3.5" /> Mark delivered
                    </button>
                  )}

                  {order.status === "CANCELLED" && (
                    <button
                      disabled={busy}
                      onClick={() => updateStatus(order.id, "PENDING")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--muted)] hover:border-cyan-500/40 hover:text-cyan-400 disabled:opacity-50"
                    >
                      <Clock className="h-3.5 w-3.5" /> Reopen as pending
                    </button>
                  )}

                  {isDelivered && (
                    <p className="text-xs text-[var(--muted)]">
                      Delivered — status is final.
                    </p>
                  )}

                  {busy && (
                    <span className="text-xs text-[var(--muted)]">
                      Updating &amp; emailing customer...
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-[var(--muted)]">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
