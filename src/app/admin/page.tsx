import Link from "next/link";
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  Truck,
  Plus,
  Download,
  Image as ImageIcon,
  ClipboardList,
} from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-[var(--border)] bg-[var(--card)] p-4 md:block">
        <p className="mb-6 text-xs font-bold uppercase tracking-widest text-cyan-400">
          Admin Console
        </p>
        <nav className="space-y-1">
          <button className="flex w-full items-center gap-2.5 rounded-lg bg-cyan-500/15 px-3 py-2.5 text-sm font-medium text-cyan-400">
            Inventory
          </button>
          <Link
            href="/admin/orders"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-white"
          >
            <ClipboardList className="h-4 w-4" /> Orders
          </Link>
          <Link
            href="/admin/gallery"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-white"
          >
            Gallery Media
          </Link>
          <Link
            href="/"
            className="mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-white"
          >
            Exit to Store
          </Link>
        </nav>
      </aside>
      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              Admin Console // Logistics & Inventory
            </p>
            <h1 className="text-2xl font-bold text-white">
              Inventory & Order Fulfillment
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/orders"
              className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            >
              <ClipboardList className="h-4 w-4" /> View Orders
            </Link>
            <Link
              href="/admin/gallery"
              className="btn-secondary flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            >
              <ImageIcon className="h-4 w-4" /> Gallery
            </Link>
          </div>
        </div>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total SKUs", value: "—", icon: Package },
            { label: "Low Stock Alerts", value: "—", icon: AlertTriangle, warn: true },
            { label: "Pending Fulfillment", value: "—", icon: ShoppingCart },
            { label: "In-Transit", value: "—", icon: Truck },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <stat.icon
                className={`mb-3 h-5 w-5 ${
                  stat.warn ? "text-amber-400" : "text-cyan-400"
                }`}
              />
              <p
                className={`text-3xl font-bold ${
                  stat.warn ? "text-amber-400" : "text-white"
                }`}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="card p-6">
          <h2 className="mb-2 font-semibold text-white">Orders are live</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Checkout now saves real orders to PostgreSQL. Open the Orders page to
            review them. Make sure <code className="text-cyan-400">DATABASE_URL</code>{" "}
            is set and you have run <code className="text-cyan-400">npx prisma db push</code>.
          </p>
          <Link href="/admin/orders" className="text-sm font-medium text-cyan-400 hover:underline">
            Go to Orders →
          </Link>
        </div>
      </div>
    </div>
  );
}
