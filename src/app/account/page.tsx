"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Package, LogOut, User, Shield } from "lucide-react";

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  price: string | number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: string | number;
  paymentMethod: string | null;
  createdAt: string;
  items: OrderItem[];
};

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (res.ok) setOrders(data.orders || []);
      } catch {
        /* ignore */
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, [status]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-[var(--muted)]">
        Loading account...
      </div>
    );
  }

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label mb-1">My account</p>
          <h1 className="text-3xl font-bold text-[var(--heading)]">
            {session?.user?.name || "Your account"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{session?.user?.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
            >
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <User className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-[var(--heading)]">Profile</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {session?.user?.name || "—"}
          </p>
          <p className="text-xs text-[var(--muted)]">{session?.user?.email}</p>
          {isAdmin && (
            <span className="badge badge-cyan mt-3">ADMIN</span>
          )}
        </div>
        <div className="card p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <Package className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-[var(--heading)]">Orders</p>
          <p className="mt-1 text-2xl font-bold text-[var(--heading)]">
            {loadingOrders ? "—" : orders.length}
          </p>
          <p className="text-xs text-[var(--muted)]">Total orders on this account</p>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-[var(--heading)]">
        Order history
      </h2>

      {loadingOrders ? (
        <p className="text-[var(--muted)]">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-[var(--muted)]" />
          <p className="text-[var(--heading)]">No orders yet</p>
          <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
            When you place an order while signed in, it will show up here.
          </p>
          <Link href="/catalog" className="btn-primary inline-flex px-6 py-2.5 text-sm">
            Browse catalog
          </Link>
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
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--heading)]">
                    ${Number(order.total).toFixed(2)}
                  </p>
                  <span className="badge badge-cyan text-[10px]">
                    {order.status}
                  </span>
                </div>
              </div>
              <ul className="border-t border-[var(--border)] pt-3 text-sm text-[var(--muted)]">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between py-1">
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="text-[var(--heading)]">
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              {order.paymentMethod && (
                <p className="mt-2 text-xs capitalize text-[var(--muted)]">
                  Payment: {order.paymentMethod}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
