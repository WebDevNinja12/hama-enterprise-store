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
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/about-video", label: "About video", icon: Video },
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
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
          : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--heading)]"
      }`}
    >
      <Icon
        className={`h-4.5 w-4.5 shrink-0 ${active ? "text-cyan-400" : "opacity-70 group-hover:opacity-100"}`}
      />
      {label}
    </Link>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const email = session?.user?.email || "Admin";

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
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-[#041016] shadow-lg shadow-cyan-500/20">
            H
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide text-[var(--heading)]">
              HAMA Admin
            </p>
            <p className="truncate text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Enterprise NG
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            onClick={() => setOpen(false)}
          />
        ))}
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        <Link
          href="/"
          className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--muted)] transition hover:bg-white/5 hover:text-[var(--heading)]"
          onClick={() => setOpen(false)}
        >
          <Store className="h-3.5 w-3.5" />
          View storefront
        </Link>
        <div className="rounded-xl bg-white/[0.03] px-3 py-3 ring-1 ring-[var(--border)]">
          <p className="truncate text-xs font-medium text-[var(--heading)]">{email}</p>
          <p className="mt-0.5 text-[10px] text-[var(--muted)]">Administrator</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 px-2 py-2 text-xs font-medium text-red-300 ring-1 ring-red-500/20 transition hover:bg-red-500/20"
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
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-[#041016]">
            H
          </div>
          <span className="text-sm font-semibold text-[var(--heading)]">Admin</span>
        </div>
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-[var(--heading)] ring-1 ring-[var(--border)]"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[min(18rem,85vw)] border-r border-[var(--border)] bg-[var(--background)] shadow-2xl">
            {sidebar}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
