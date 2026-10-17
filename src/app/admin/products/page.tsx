"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  brand: string;
  emoji?: string;
  image?: string;
  stock: number;
  description: string;
  published?: boolean;
  source?: "db" | "seed";
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  compareAt: "",
  category: "General",
  brand: "HAMA",
  stock: "10",
};

type Filter = "ALL" | "OUT" | "LOW" | "IN_STOCK";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products?admin=1");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(
    () => ({
      ALL: products.length,
      OUT: products.filter((p) => p.stock <= 0).length,
      LOW: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
      IN_STOCK: products.filter((p) => p.stock > 5).length,
    }),
    [products]
  );

  const filtered = useMemo(() => {
    if (filter === "OUT") return products.filter((p) => p.stock <= 0);
    if (filter === "LOW") return products.filter((p) => p.stock > 0 && p.stock <= 5);
    if (filter === "IN_STOCK") return products.filter((p) => p.stock > 5);
    return products;
  }, [products, filter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          compareAt: form.compareAt ? Number(form.compareAt) : null,
          category: form.category,
          brand: form.brand,
          stock: Number(form.stock) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      setSuccess(`Product "${data.product.name}" added`);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (id.startsWith("seed-")) {
      setError("Catalog seed products cannot be deleted here. Add a DB copy to manage them.");
      return;
    }
    if (!confirm(`Delete product "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleStockSave(id: string) {
    if (id.startsWith("seed-")) {
      setError("Seed catalog stock is fixed. Create the product in DB to manage stock.");
      return;
    }
    const raw = editingStock[id];
    if (raw === undefined) return;
    const stock = Math.max(0, parseInt(raw, 10) || 0);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock } : p))
      );
      setEditingStock((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
      setSuccess("Stock updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stock update failed");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin"
            className="mb-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
          <h1 className="text-2xl font-bold text-[var(--heading)]">
            All products
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Full catalog (store + admin-added) · out of stock · restock
          </p>
        </div>
        <button
          onClick={load}
          className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-2xl font-bold text-[var(--heading)]">{counts.ALL}</p>
          <p className="text-xs text-[var(--muted)]">All products</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-red-400">{counts.OUT}</p>
          <p className="text-xs text-[var(--muted)]">Out of stock</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-amber-400">{counts.LOW}</p>
          <p className="text-xs text-[var(--muted)]">Low stock (≤5)</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      <div className="card mb-10 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-[var(--heading)]">
          <Plus className="h-4 w-4 text-cyan-400" /> Add product
        </h2>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs text-[var(--muted)]">Name</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs text-[var(--muted)]">
              Description
            </label>
            <textarea
              className="input min-h-[80px]"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="input"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">Stock</label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">Category</label>
            <input
              className="input"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">Brand</label>
            <input
              className="input"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add product"}
            </button>
          </div>
        </form>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["ALL", "All"],
            ["OUT", "Out of stock"],
            ["LOW", "Low stock"],
            ["IN_STOCK", "In stock"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === key
                ? "bg-cyan-500 text-black"
                : "border border-[var(--border)] text-[var(--muted)]"
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      <h2 className="mb-4 font-semibold text-[var(--heading)]">
        Products ({filtered.length})
      </h2>

      {loading ? (
        <p className="text-[var(--muted)]">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">No products in this filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const out = p.stock <= 0;
            const low = p.stock > 0 && p.stock <= 5;
            const isSeed = p.source === "seed" || p.id.startsWith("seed-");
            return (
              <div
                key={p.id}
                className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${
                  out ? "border-red-500/40" : low ? "border-amber-500/30" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-[var(--surface)]">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl">
                        {p.emoji || "📦"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--heading)]">{p.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {p.category} · {p.brand}
                      {isSeed ? " · catalog" : ""}
                    </p>
                    {out && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-400">
                        <AlertTriangle className="h-3 w-3" /> OUT OF STOCK
                      </p>
                    )}
                    {low && (
                      <p className="mt-1 text-xs font-semibold text-amber-400">
                        Low stock
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {!isSeed && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--muted)]">Stock</label>
                      <input
                        type="number"
                        min="0"
                        className="input h-9 w-20 py-1 text-sm"
                        value={
                          editingStock[p.id] !== undefined
                            ? editingStock[p.id]
                            : String(p.stock)
                        }
                        onChange={(e) =>
                          setEditingStock((s) => ({
                            ...s,
                            [p.id]: e.target.value,
                          }))
                        }
                      />
                      {editingStock[p.id] !== undefined && (
                        <button
                          onClick={() => handleStockSave(p.id)}
                          className="btn-primary px-3 py-1.5 text-xs"
                        >
                          Save
                        </button>
                      )}
                    </div>
                  )}
                  {isSeed && (
                    <span className="text-xs text-[var(--muted)]">
                      Stock: {p.stock}
                    </span>
                  )}
                  <p className="font-semibold text-cyan-400">
                    ${Number(p.price).toLocaleString()}
                  </p>
                  {!isSeed && (
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
