"use client";

import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { products } from "@/lib/products";
import { useCart } from "@/context/CartContext";

const categories = ["All", "Neural", "Optics", "Quantum", "Exosuit", "Audio", "Wearables"];

export default function CatalogPage() {
  const { addItem } = useCart();
  const [category, setCategory] = useState("All");
  const [added, setAdded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (category === "All") return products;
    return products.filter((p) => p.category === category);
  }, [category]);

  function handleAdd(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    addItem(product);
    setAdded(productId);
    setTimeout(() => setAdded(null), 1200);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">
          Hardware Catalog / 2026 Edition
        </p>
        <h1 className="text-3xl font-bold text-white">Advanced Tech Inventory</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{filtered.length} products</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              category === c
                ? "bg-cyan-500 text-black"
                : "border border-[var(--border)] text-[var(--muted)] hover:border-cyan-500/50 hover:text-cyan-400"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <div key={p.id} className="card group overflow-hidden">
            <Link href={`/product/${p.slug}`}>
              <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-5xl">
                <span className="absolute left-3 top-3 badge badge-cyan text-[10px]">
                  {p.category.toUpperCase()}
                </span>
                {p.emoji}
              </div>
            </Link>
            <div className="p-4">
              <p className="text-xs text-[var(--muted)]">{p.brand}</p>
              <Link href={`/product/${p.slug}`}>
                <h3 className="mb-1 font-semibold text-white group-hover:text-cyan-400">
                  {p.name}
                </h3>
              </Link>
              <div className="mb-2 flex items-center gap-1 text-xs text-cyan-400">
                <Star className="h-3 w-3 fill-current" />
                {p.rating}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-bold text-white">
                    ${p.price.toLocaleString()}
                  </p>
                  {p.compareAt && (
                    <p className="text-xs text-[var(--muted)] line-through">
                      ${p.compareAt.toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleAdd(p.id)}
                  className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {added === p.id ? "Added!" : "Add"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
