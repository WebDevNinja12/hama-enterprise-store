import Link from "next/link";
import { Star } from "lucide-react";

const products = [
  { id: "1", name: "Synapse-X Headset", slug: "synapse-x", price: 1299, rating: 4.9, category: "Neural", brand: "Nexus Core" },
  { id: "2", name: "HoloLens Pro 3", slug: "hololens-pro-3", price: 849, rating: 4.8, category: "Optics", brand: "AetherDynamics" },
  { id: "3", name: "Q-Cube Core V2", slug: "q-cube-core-v2", price: 3499, rating: 5.0, category: "Quantum", brand: "Vanguard Labs" },
  { id: "4", name: "Titan Arm Bracer", slug: "titan-arm-bracer", price: 2150, rating: 4.7, category: "Exosuit", brand: "Nexus Core" },
  { id: "5", name: "NeuroLink Node Mini", slug: "neurolink-node-mini", price: 499, rating: 4.6, category: "Neural", brand: "AetherDynamics" },
  { id: "6", name: "Vision-X Contacts", slug: "vision-x-contacts", price: 1599, rating: 4.9, category: "Optics", brand: "Vanguard Labs" },
];

export default function CatalogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">Hardware Catalog / 2026 Edition</p>
        <h1 className="text-3xl font-bold text-white">Advanced Tech Inventory</h1>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Link key={p.id} href={`/product/${p.slug}`} className="card group overflow-hidden">
            <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-5xl">
              <span className="absolute left-3 top-3 badge badge-cyan text-[10px]">{p.category.toUpperCase()}</span>
              {p.category === "Neural" && "\ud83e\udde0"}{p.category === "Optics" && "\ud83d\udc41\ufe0f"}{p.category === "Quantum" && "\u269b\ufe0f"}{p.category === "Exosuit" && "\ud83e\uddbe"}
            </div>
            <div className="p-4">
              <p className="text-xs text-[var(--muted)]">{p.brand}</p>
              <h3 className="mb-1 font-semibold text-white group-hover:text-cyan-400">{p.name}</h3>
              <div className="mb-2 flex items-center gap-1 text-xs text-cyan-400"><Star className="h-3 w-3 fill-current" />{p.rating}</div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-white">${p.price.toLocaleString()}</p>
                <button className="btn-primary rounded-lg px-3 py-1.5 text-xs">Add</button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
