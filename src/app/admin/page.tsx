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
} from "lucide-react";
import { useState } from "react";

export default function AdminHomePage() {
  const { data: session, status } = useSession();
  const [schemaMsg, setSchemaMsg] = useState("");
  const [schemaBusy, setSchemaBusy] = useState(false);

  async function ensureSchema() {
    setSchemaBusy(true);
    setSchemaMsg("");
    try {
      const res = await fetch("/api/admin/ensure-schema", { method: "POST" });
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
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-[var(--muted)]">
        Loading admin...
      </div>
    );
  }

  const links = [
    {
      href: "/admin/products",
      title: "Products",
      desc: "Inventory, stock, images, remove products",
      icon: Package,
    },
    {
      href: "/admin/orders",
      title: "Orders",
      desc: "Accept, ship, deliver, cancel orders",
      icon: ShoppingBag,
    },
    {
      href: "/admin/gallery",
      title: "Gallery",
      desc: "Images/videos + narration for main site",
      icon: ImageIcon,
    },
    {
      href: "/admin/about-video",
      title: "About video",
      desc: "Promo video for About page on main site",
      icon: Video,
    },
    {
      href: "/admin/settings",
      title: "Settings",
      desc: "Change admin password",
      icon: Settings,
    },
    {
      href: "/admin/security",
      title: "Security",
      desc: "Sessions, revoke devices, block list",
      icon: Shield,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--heading)]">Admin panel</h1>
          <p className="text-sm text-[var(--muted)]">
            Signed in as {session.user.email} · HAMA ENTERPRISE NG
          </p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="card p-5 transition hover:border-cyan-500/40"
          >
            <l.icon className="mb-3 h-6 w-6 text-cyan-400" />
            <p className="font-semibold text-[var(--heading)]">{l.title}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{l.desc}</p>
          </Link>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-cyan-400" />
            <div>
              <p className="font-semibold text-[var(--heading)]">Database schema</p>
              <p className="text-xs text-[var(--muted)]">
                Ensure product image URL column exists
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={schemaBusy}
            onClick={ensureSchema}
            className="rounded-full bg-cyan-500/15 px-4 py-2 text-sm text-cyan-300 ring-1 ring-cyan-500/30 disabled:opacity-50"
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
