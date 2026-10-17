"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Package, LogOut, User, Shield, Camera, Trash2 } from "lucide-react";

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

const ADMIN_LOGO =
  "https://raw.githubusercontent.com/WebDevNinja12/hama-enterprise-store/main/logo.png";

export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileOk, setProfileOk] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load full profile image from API (not from cookie)
  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res = await fetch("/api/account");
        const data = await res.json();
        if (res.ok && data.user?.image) {
          setAvatarUrl(data.user.image);
        } else if (session?.user?.role === "ADMIN") {
          setAvatarUrl(ADMIN_LOGO);
        }
      } catch {
        if (session?.user?.role === "ADMIN") setAvatarUrl(ADMIN_LOGO);
      }
    })();
  }, [status, session?.user?.role]);

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

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileError("Please choose an image file");
      return;
    }
    if (file.size > 600 * 1024) {
      setProfileError("Image must be under 600KB");
      return;
    }
    setUploading(true);
    setProfileError("");
    setProfileOk("");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      // Update session with SAFE (non-data-URL) values only
      await update({
        image: data.user.image,
        hasCustomImage: data.user.hasCustomImage,
      });
      setAvatarUrl(dataUrl);
      setProfileOk("Profile photo updated");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAccount() {
    const ok = confirm(
      "Delete your account permanently? This cannot be undone."
    );
    if (!ok) return;

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
  const avatar = avatarUrl || (isAdmin ? ADMIN_LOGO : null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 overflow-hidden rounded-full bg-[var(--surface)] ring-2 ring-cyan-500/30">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cyan-400">
                  <User className="h-7 w-7" />
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-cyan-500 text-black shadow hover:bg-cyan-400">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickPhoto}
                disabled={uploading}
              />
            </label>
          </div>
          <div>
            <p className="section-label mb-1">My account</p>
            <h1 className="text-3xl font-bold text-[var(--heading)]">
              {session?.user?.name || "Your account"}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{session?.user?.email}</p>
            {uploading && (
              <p className="text-xs text-cyan-400">Uploading photo...</p>
            )}
            {profileOk && (
              <p className="text-xs text-emerald-400">{profileOk}</p>
            )}
            {profileError && (
              <p className="text-xs text-red-400">{profileError}</p>
            )}
          </div>
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
          <p className="mt-3 text-xs text-[var(--muted)]">
            Tap the camera icon to add or change your profile photo (max 600KB).
          </p>
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

      <div className="card mt-10 border-red-500/20 p-6">
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
