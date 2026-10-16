"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Package } from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  brand: string;
  emoji: string;
  stock: number;
  description: string;
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  compareAt: "",
  category: "General",
  brand: "HAMA",
  emoji: "📦",
  stock: "10",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
          emoji: form.emoji || "📦",
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="mb-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
      >
        <ArrowLeft className="h-3 w-3" /> Admin
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-[var(--heading)]">
        Products
      </h1>

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
              placeholder="Product name"
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
              placeholder="Product description"
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
            <label className="mb-1.5 block text-xs text-[var(--muted)]">
              Compare at (optional)
            </label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.compareAt}
              onChange={(e) => setForm({ ...form, compareAt: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">Category</label>
            <input
              className="input"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Neural, Audio, ..."
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
          <div>
            <label className="mb-1.5 block text-xs text-[var(--muted)]">Emoji</label>
            <input
              className="input"
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              placeholder="📦"
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

      <h2 className="mb-4 font-semibold text-[var(--heading)]">
        Catalog products ({products.length})
      </h2>
      {loading ? (
        <p className="text-[var(--muted)]">Loading...</p>
      ) : products.length === 0 ? (
        <div className="card p-8 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">
            No admin-added products yet. Seed catalog items still show on the
            store.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="card flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.emoji}</span>
                <div>
                  <p className="font-medium text-[var(--heading)]">{p.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {p.category} · {p.brand} · stock {p.stock}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-cyan-400">
                  ${Number(p.price).toLocaleString()}
                </p>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
