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
  Plus,
  Box,
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
    desc: "Inventory, images, stock & publish",
    icon: Package,
    accent: "from-cyan-500/25 via-cyan-500/5 to-transparent",
    iconBg: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/25",
  },
  {
    href: "/admin/orders",
    title: "Orders",
    desc: "Accept, ship, deliver, cancel",
    icon: ShoppingBag,
    accent: "from-violet-500/25 via-violet-500/5 to-transparent",
    iconBg: "bg-violet-500/15 text-violet-400 ring-violet-500/25",
  },
  {
    href: "/admin/gallery",
    title: "Gallery",
    desc: "Images, videos & narration",
    icon: ImageIcon,
    accent: "from-emerald-500/25 via-emerald-500/5 to-transparent",
    iconBg: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  },
  {
    href: "/admin/about-video",
    title: "About video",
    desc: "Promo media for About page",
    icon: Video,
    accent: "from-amber-500/25 via-amber-500/5 to-transparent",
    iconBg: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
  },
  {
    href: "/admin/settings",
    title: "Settings",
    desc: "Email & password",
    icon: Settings,
    accent: "from-sky-500/25 via-sky-500/5 to-transparent",
    iconBg: "bg-sky-500/15 text-sky-400 ring-sky-500/25",
  },
  {
    href: "/admin/security",
    title: "Security",
    desc: "Sessions & access control",
    icon: Shield,
    accent: "from-rose-500/25 via-rose-500/5 to-transparent",
    iconBg: "bg-rose-500/15 text-rose-400 ring-rose-500/25",
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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
      setStats({
        products: 0,
        outOfStock: 0,
        lowStock: 0,
        orders: 0,
        pending: 0,
      });
    } finally {
      setStatsBusy(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      loadStats();
    }
  }, [status, session, loadStats]);

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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
      </div>
    );
  }

  const name =
    session.user?.name?.split(" ")[0] ||
    session.user?.email?.split("@")[0] ||
    "Admin";

  const kpis = [
    {
      label: "Products",
      value: stats?.products ?? "—",
      icon: Box,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      href: "/admin/products",
    },
    {
      label: "Pending orders",
      value: stats?.pending ?? "—",
      icon: Clock,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      href: "/admin/orders",
    },
    {
      label: "Out of stock",
      value: stats?.outOfStock ?? "—",
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      href: "/admin/products",
    },
    {
      label: "Total orders",
      value: stats?.orders ?? "—",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/admin/orders",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-cyan-500/[0.12] via-[var(--card)] to-transparent p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-400/90">
              {greeting()}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">
              {name}
            </h1>
            <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
              Manage products, orders, and store content for HAMA ENTERPRISE NG.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/products"
              className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              Add product
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[var(--heading)] ring-1 ring-[var(--border)] transition hover:bg-white/5"
            >
              <ShoppingBag className="h-4 w-4 text-violet-400" />
              Orders
            </Link>
            <button
              type="button"
              onClick={loadStats}
              disabled={statsBusy}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2.5 text-sm text-[var(--muted)] ring-1 ring-[var(--border)] transition hover:text-[var(--heading)] disabled:opacity-50"
              title="Refresh stats"
            >
              <RefreshCw className={`h-4 w-4 ${statsBusy ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="card group flex items-center gap-4 p-4 transition hover:border-cyan-500/30 hover:shadow-[0_0_30px_-12px_rgba(34,211,238,0.2)]"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${k.bg} ${k.color}`}
            >
              <k.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[var(--muted)]">{k.label}</p>
              <p className="text-xl font-bold tracking-tight text-[var(--heading)]">
                {statsBusy && stats === null ? "…" : k.value}
              </p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-[var(--muted)] opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </section>

      {(stats?.outOfStock ?? 0) > 0 || (stats?.lowStock ?? 0) > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {(stats?.outOfStock ?? 0) > 0 && (
              <>
                <strong>{stats?.outOfStock}</strong> out of stock
              </>
            )}
            {(stats?.outOfStock ?? 0) > 0 && (stats?.lowStock ?? 0) > 0 && " · "}
            {(stats?.lowStock ?? 0) > 0 && (
              <>
                <strong>{stats?.lowStock}</strong> low stock (≤5)
              </>
            )}
          </span>
          <Link
            href="/admin/products"
            className="ml-auto text-xs font-medium text-amber-300 underline-offset-2 hover:underline"
          >
            Review products
          </Link>
        </div>
      ) : null}

      {/* Modules */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Workspace
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group card relative overflow-hidden p-5 transition duration-200 hover:border-cyan-500/35 hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.25)]"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.accent} opacity-70 transition group-hover:opacity-100`}
              />
              <div className="relative">
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${t.iconBg}`}
                >
                  <t.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-[var(--heading)]">{t.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{t.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cyan-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="card p-5">
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
      </section>
    </div>
  );
}
