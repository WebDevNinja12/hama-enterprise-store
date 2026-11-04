"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Image as ImageIcon,
  Video,
  Shield,
  Settings,
  Database,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Stats = {
  products: number;
  outOfStock: number;
  lowStock: number;
  orders: number;
  pending: number;
};

const tiles = [
  {
    href: "/admin/products",
    title: "Products",
    desc: "Add, edit stock, images, publish",
    icon: Package,
    accent: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
  },
  {
    href: "/admin/orders",
    title: "Orders",
    desc: "Accept, ship, deliver, cancel",
    icon: ShoppingBag,
    accent: "from-violet-500/20 to-violet-500/5",
    iconColor: "text-violet-400",
  },
  {
    href: "/admin/gallery",
    title: "Gallery",
    desc: "Media + narration for main site",
    icon: ImageIcon,
    accent: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    href: "/admin/about-video",
    title: "About video",
    desc: "Promo video on About page",
    icon: Video,
    accent: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    href: "/admin/settings",
    title: "Settings",
    desc: "Email & password",
    icon: Settings,
    accent: "from-sky-500/20 to-sky-500/5",
    iconColor: "text-sky-400",
  },
  {
    href: "/admin/security",
    title: "Security",
    desc: "Sessions & device control",
    icon: Shield,
    accent: "from-rose-500/20 to-rose-500/5",
    iconColor: "text-rose-400",
  },
];

export default function AdminHomePage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [schemaMsg, setSchemaMsg] = useState("");
  const [schemaBusy, setSchemaBusy] = useState(false);
  const [statsBusy, setStatsBusy] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsBusy(true);
    try {
      const [pRes, oRes] = await Promise.all([
        fetch("/api/products?admin=1", { credentials: "include" }),
        fetch("/api/orders", { credentials: "include" }),
      ]);
      const pData = await pRes.json().catch(() => ({}));
      const oData = await oRes.json().catch(() => ({}));
      const products = Array.isArray(pData.products) ? pData.products : [];
      const orders = Array.isArray(oData.orders) ? oData.orders : [];
      setStats({
        products: products.length,
        outOfStock: products.filter((p: { stock?: number }) => Number(p.stock) <= 0)
          .length,
        lowStock: products.filter(
          (p: { stock?: number }) => Number(p.stock) > 0 && Number(p.stock) <= 5
        ).length,
        orders: orders.length,
        pending: orders.filter(
          (o: { status?: string }) =>
            o.status === "PENDING" || o.status === "PROCESSING"
        ).length,
      });
    } catch {
      setStats({ products: 0, outOfStock: 0, lowStock: 0, orders: 0, pending: 0 });
    } finally {
      setStatsBusy(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") loadStats();
  }, [session, loadStats]);

  async function ensureSchema() {
    setSchemaBusy(true);
    setSchemaMsg("");
    try {
      const res = await fetch("/api/admin/ensure-schema", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      setSchemaMsg(data.message || data.error || (res.ok ? "Schema OK" : "Failed"));
    } catch {
      setSchemaMsg("Request failed");
    } finally {
      setSchemaBusy(false);
    }
  }

  if (status === "loading" || session?.user?.role !== "ADMIN") {
    return (
      <div className="py-20 text-center text-sm text-[var(--muted)]">
        Loading dashboard…
      </div>
    );
  }

  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name =
    session.user.name?.split(" ")[0] ||
    session.user.email?.split("@")[0] ||
    "Admin";

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-400/90">
              HAMA ENTERPRISE NG · Admin
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">
              {greet}, {name}
            </h1>
            <p className="mt-1 max-w-lg text-sm text-[var(--muted)]">
              Manage products, orders, and store content from one place.
            </p>
          </div>
          <button
            type="button"
            onClick={loadStats}
            disabled={statsBusy}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-[var(--muted)] ring-1 ring-[var(--border)] transition hover:text-[var(--heading)] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${statsBusy ? "animate-spin" : ""}`} />
            Refresh stats
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Products",
            value: stats?.products ?? "—",
            icon: Package,
            hint: "In catalog",
            color: "text-cyan-400",
          },
          {
            label: "Out of stock",
            value: stats?.outOfStock ?? "—",
            icon: AlertTriangle,
            hint: "Need restock",
            color: "text-amber-400",
          },
          {
            label: "Orders",
            value: stats?.orders ?? "—",
            icon: TrendingUp,
            hint: "Recent list",
            color: "text-violet-400",
          },
          {
            label: "Pending",
            value: stats?.pending ?? "—",
            icon: Clock,
            hint: "Need action",
            color: "text-rose-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="card flex items-start gap-3 p-4 transition hover:border-cyan-500/25"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ${s.color}`}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">{s.label}</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--heading)]">
                {s.value}
              </p>
              <p className="text-[10px] text-[var(--muted)]">{s.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {(stats?.outOfStock ?? 0) > 0 && (
        <Link
          href="/admin/products"
          className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 transition hover:bg-amber-500/15"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            {stats?.outOfStock} product(s) out of stock
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-amber-300">
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}

      {/* Modules */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Modules
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group card relative overflow-hidden p-5 transition hover:border-cyan-500/35 hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.25)]"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.accent} opacity-60 transition group-hover:opacity-100`}
              />
              <div className="relative">
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-black/20 ring-1 ring-white/10 ${t.iconColor}`}
                >
                  <t.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-[var(--heading)]">{t.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                  {t.desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cyan-400 opacity-0 transition group-hover:opacity-100">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-[var(--heading)]">Database tools</p>
              <p className="text-xs text-[var(--muted)]">
                Ensure media columns and admin flags exist
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={schemaBusy}
            onClick={ensureSchema}
            className="rounded-full bg-cyan-500/15 px-4 py-2 text-sm text-cyan-300 ring-1 ring-cyan-500/30 transition hover:bg-cyan-500/25 disabled:opacity-50"
          >
            {schemaBusy ? "Running…" : "Ensure schema"}
          </button>
        </div>
        {schemaMsg && (
          <p className="mt-3 text-xs text-[var(--muted)]">{schemaMsg}</p>
        )}
      </div>
    </div>
  );
}
