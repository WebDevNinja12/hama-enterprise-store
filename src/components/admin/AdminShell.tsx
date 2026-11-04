"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Image as ImageIcon,
  Video,
  Settings,
  Shield,
  LogOut,
  Store,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/about-video", label: "About video", icon: Video },
];

const NAV_SYSTEM = [
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/security", label: "Security", icon: Shield },
];

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname?.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-cyan-500/15 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]"
          : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--heading)]"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400" />
      )}
      <Icon
        className={`h-4 w-4 shrink-0 transition ${
          active ? "text-cyan-400" : "opacity-60 group-hover:opacity-100"
        }`}
      />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="h-3.5 w-3.5 text-cyan-500/70" />}
    </Link>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const email = session?.user?.email || "Admin";
  const initial = (email[0] || "A").toUpperCase();

  const pageTitle =
    NAV.concat(NAV_SYSTEM).find((n) =>
      n.exact ? pathname === n.href : pathname === n.href || pathname?.startsWith(n.href + "/")
    )?.label || "Admin";

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* */
    }
    await signOut({ callbackUrl: "/admin/login" });
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border)] px-4 py-5">
        <Link
          href="/admin"
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 text-sm font-bold text-[#041016] shadow-lg shadow-cyan-500/20">
            H
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-[var(--heading)]">
              HAMA Admin
            </p>
            <p className="truncate text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Enterprise NG
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            Manage
          </p>
          <div className="space-y-0.5">
            {NAV.map((item) => (
              <NavLink key={item.href} {...item} onClick={() => setOpen(false)} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            System
          </p>
          <div className="space-y-0.5">
            {NAV_SYSTEM.map((item) => (
              <NavLink key={item.href} {...item} onClick={() => setOpen(false)} />
            ))}
          </div>
        </div>
      </nav>

      <div className="space-y-3 border-t border-[var(--border)] p-3">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--muted)] transition hover:bg-white/[0.04] hover:text-[var(--heading)]"
        >
          <Store className="h-4 w-4" />
          View storefront
        </Link>
        <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent p-3 ring-1 ring-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300 ring-1 ring-cyan-500/30">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[var(--heading)]">{email}</p>
              <p className="text-[10px] text-[var(--muted)]">Administrator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-2 py-2 text-xs font-medium text-red-300 ring-1 ring-red-500/15 transition hover:bg-red-500/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[16.5rem] shrink-0 border-r border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-2xl lg:block">
        {sidebar}
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-[#041016]">
            H
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--heading)]">{pageTitle}</p>
            <p className="text-[10px] text-[var(--muted)]">HAMA Admin</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl p-2 text-[var(--heading)] ring-1 ring-[var(--border)] transition hover:bg-white/5"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[min(18rem,88vw)] border-r border-[var(--border)] bg-[var(--background)] shadow-2xl">
            {sidebar}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
