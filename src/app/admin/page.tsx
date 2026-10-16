"use client";

import Link from "next/link";
import {
  Package,
  ClipboardList,
  Image as ImageIcon,
  Plus,
} from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-[var(--border)] bg-[var(--card)] p-4 md:block">
        <p className="mb-6 text-xs font-bold uppercase tracking-widest text-cyan-400">
          Admin Console
        </p>
        <nav className="space-y-1">
          <Link
            href="/admin"
            className="flex w-full items-center gap-2.5 rounded-lg bg-cyan-500/15 px-3 py-2.5 text-sm font-medium text-cyan-400"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/orders"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-[var(--heading)]"
          >
            <ClipboardList className="h-4 w-4" /> Orders
          </Link>
          <Link
            href="/admin/products"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-[var(--heading)]"
          >
            <Package className="h-4 w-4" /> Products
          </Link>
          <Link
            href="/admin/gallery"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-[var(--heading)]"
          >
            <ImageIcon className="h-4 w-4" /> Gallery
          </Link>
          <Link
            href="/"
            className="mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-[var(--heading)]"
          >
            Exit to Store
          </Link>
        </nav>
      </aside>

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Admin Console
          </p>
          <h1 className="text-2xl font-bold text-[var(--heading)]">Dashboard</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/orders" className="card p-6 hover:border-cyan-500/40">
            <ClipboardList className="mb-3 h-6 w-6 text-cyan-400" />
            <h2 className="font-semibold text-[var(--heading)]">Orders</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Accept, decline, ship, and deliver customer orders
            </p>
          </Link>
          <Link
            href="/admin/products"
            className="card p-6 hover:border-cyan-500/40"
          >
            <Plus className="mb-3 h-6 w-6 text-cyan-400" />
            <h2 className="font-semibold text-[var(--heading)]">Add products</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Create and manage catalog products
            </p>
          </Link>
          <Link
            href="/admin/gallery"
            className="card p-6 hover:border-cyan-500/40"
          >
            <ImageIcon className="mb-3 h-6 w-6 text-cyan-400" />
            <h2 className="font-semibold text-[var(--heading)]">Gallery</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Manage media assets
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
