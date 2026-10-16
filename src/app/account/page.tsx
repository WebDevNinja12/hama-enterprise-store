"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Package, LogOut, User, Shield, Trash2 } from "lucide-react";

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
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
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

  async function handleDeleteAccount() {
    const ok = confirm(
      "Delete your account permanently? This cannot be undone. Your orders history tied to this login will be removed with the account."
    );
    if (!ok) return;
    const again = confirm("Are you sure? Type OK in the next step conceptually — this is final.");
    if (!again) return;

    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

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
          {isAdmin && <span className="badge badge-cyan mt-3">ADMIN</span>}
        </div>
        <div className="card p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <Package className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-[var(--heading)]">Orders</p>
          <p className="mt-1 text-2xl font-bold text-[var(--heading)]">
            {loadingOrders ? "—" : orders.length}
          </p>
          <p className="text-xs text-[var(--muted)]">Orders on this account</p>
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
          <Link
            href="/catalog"
            className="btn-primary mt-4 inline-flex px-6 py-2.5 text-sm"
          >
            Browse catalog
          </Link>
        </div>
      ) : (
        <div className="mb-12 space-y-4">
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
            </div>
          ))}
        </div>
      )}

      <div className="card border-red-500/20 p-6">
        <h2 className="mb-1 text-sm font-semibold text-red-400">Danger zone</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Delete your account permanently. Accounts with no activity for 6 months
          are also removed automatically.
        </p>
        {deleteError && (
          <p className="mb-3 text-sm text-red-400">{deleteError}</p>
        )}
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-400 ring-1 ring-red-500/30 hover:bg-red-500/25 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete my account"}
        </button>
      </div>
    </div>
  );
}
