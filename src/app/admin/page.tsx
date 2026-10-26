"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingBag,
  Image as ImageIcon,
  Video,
  Shield,
  Database,
  CheckCircle2,
} from "lucide-react";

export default function AdminHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schemaMsg, setSchemaMsg] = useState("");
  const [schemaBusy, setSchemaBusy] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/account");
    }
  }, [status, session, router]);

  async function ensureSchema() {
    setSchemaBusy(true);
    setSchemaMsg("");
    try {
      const res = await fetch("/api/admin/ensure-schema", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSchemaMsg(data.message || "Schema ready");
    } catch (err) {
      setSchemaMsg(err instanceof Error ? err.message : "Failed");
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
      href: "/admin/security",
      title: "Security",
      desc: "Devices (max 3), revoke sessions, block IPs",
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
          <p className="text-sm text-[var(--muted)]">HAMA ENTERPRISE NG store controls</p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="card p-5 transition hover:border-cyan-500/40">
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
            onClick={ensureSchema}
            disabled={schemaBusy}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {schemaBusy ? "Updating..." : "Push schema (imageUrl)"}
          </button>
        </div>
        {schemaMsg && (
          <p className="mt-3 flex items-center gap-2 text-sm text-cyan-400">
            <CheckCircle2 className="h-4 w-4" />
            {schemaMsg}
          </p>
        )}
      </div>
    </div>
  );
}
