import Link from "next/link";
import { Package, ShoppingCart, AlertTriangle, Truck, TrendingUp, Plus, Download } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-[var(--border)] bg-[var(--card)] p-4 md:block">
        <p className="mb-6 text-xs font-bold uppercase tracking-widest text-cyan-400">Admin Console</p>
        <nav className="space-y-1">
          {["Inventory", "Orders", "Analytics"].map((label, i) => (
            <button key={label} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
              i === 0 ? "bg-cyan-500/15 text-cyan-400" : "text-[var(--muted)] hover:bg-white/5 hover:text-white"}`}>{label}</button>
          ))}
          <Link href="/" className="mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-white">Exit to Store</Link>
        </nav>
      </aside>
      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Admin Console // Logistics & Inventory</p>
            <h1 className="text-2xl font-bold text-white">Inventory & Order Fulfillment</h1>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2 rounded-lg px-4 py-2 text-sm"><Download className="h-4 w-4" /> Export</button>
            <button className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm"><Plus className="h-4 w-4" /> New SKU</button>
          </div>
        </div>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total SKUs", value: "1,482", icon: Package },
            { label: "Low Stock Alerts", value: "18", icon: AlertTriangle, warn: true },
            { label: "Pending Fulfillment", value: "64", icon: ShoppingCart },
            { label: "In-Transit", value: "342", icon: Truck },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <stat.icon className={`mb-3 h-5 w-5 ${stat.warn ? "text-amber-400" : "text-cyan-400"}`} />
              <p className={`text-3xl font-bold ${stat.warn ? "text-amber-400" : "text-white"}`}>{stat.value}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-white">Recent Inventory Snapshot</h2>
          <div className="space-y-3 text-sm">
            {[
              { name: "NeuralLink Apex V3", stock: 4, status: "Restock Queued", type: "danger" },
              { name: "SpectraLens Quantum AR", stock: 84, status: "Optimal", type: "success" },
              { name: "NeonDeck Pro Terminal", stock: 2, status: "Delayed", type: "warning" },
              { name: "Aether-Cell Fusion Core", stock: 310, status: "Optimal", type: "success" },
            ].map((row) => (
              <div key={row.name} className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="font-medium text-white">{row.name}</span>
                <span className={row.stock < 10 ? "text-red-400" : "text-[var(--muted)]"}>{row.stock} units</span>
                <span className={`badge text-[10px] ${row.type === "success" ? "badge-success" : row.type === "warning" ? "badge-warning" : "badge-danger"}`}>{row.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
