"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import MediaUploader from "@/components/MediaUploader";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  brand: string;
  image?: string;
  imageUrl?: string;
  stock: number;
  description: string;
  published?: boolean;
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "General",
  brand: "HAMA",
  stock: "10",
  imageUrl: "",
};

type Filter = "ALL" | "OUT" | "LOW" | "IN_STOCK";

export default function AdminProductsPage() {
  const { update } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});
  const [editingImage, setEditingImage] = useState<Record<string, string>>({});

  const touchSession = useCallback(() => {
    update().catch(() => {});
  }, [update]);

  useEffect(() => {
    const id = setInterval(() => {
      update().catch(() => {});
    }, 90_000);
    return () => clearInterval(id);
  }, [update]);

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
    touchSession();
    try {
      const imageUrl = form.imageUrl.trim();
      if (!imageUrl.startsWith("https://")) {
        throw new Error("Image must be an https:// URL (paste link or use Blob upload).");
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          category: form.category,
          brand: form.brand,
          stock: Number(form.stock) || 0,
          imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      setSuccess(`Product "${data.product.name}" saved`);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove product "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSuccess(`Removed "${name}"`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleStockSave(id: string) {
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
      setSuccess("Stock updated");
      load();
      setEditingStock((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stock update failed");
    }
  }

  async function handleImageSave(id: string) {
    const imageUrl = (editingImage[id] || "").trim();
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageUrl || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image update failed");
      setSuccess("Product image updated");
      load();
      setEditingImage((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image update failed");
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
          <h1 className="text-2xl font-bold text-[var(--heading)]">Products</h1>
          <p className="text-sm text-[var(--muted)]">
            Image by https URL (server fetches to verify) or Blob upload · Videos belong in Gallery
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
              onFocus={touchSession}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs text-[var(--muted)]">Description</label>
            <textarea
              className="input min-h-[80px]"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              onFocus={touchSession}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs text-[var(--muted)]">
              Image URL (https — server will fetch and verify)
            </label>
            <input
              className="input"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              onFocus={touchSession}
            />
            {form.imageUrl.startsWith("https://") && (
              <div className="mt-2 h-24 w-24 overflow-hidden rounded-xl border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <p className="mb-2 text-xs text-[var(--muted)]">
              Or upload to Vercel Blob (optional)
            </p>
            <MediaUploader
              kind="image"
              label="Blob image upload"
              value={form.imageUrl.startsWith("https://") && form.imageUrl.includes("blob.vercel-storage.com") ? form.imageUrl : ""}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              onSessionTouch={touchSession}
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
              disabled={saving || !form.imageUrl.startsWith("https://")}
              className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save product"}
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
          <p className="text-sm text-[var(--muted)]">No products yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const out = p.stock <= 0;
            const low = p.stock > 0 && p.stock <= 5;
            const img = p.imageUrl || p.image;
            return (
              <div
                key={p.id}
                className={`card space-y-3 p-4 ${
                  out ? "border-red-500/40" : low ? "border-amber-500/30" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-xl bg-[var(--surface)]">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[var(--muted)]">
                          No img
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--heading)]">{p.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {p.category} · {p.brand}
                      </p>
                      {out && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-400">
                          <AlertTriangle className="h-3 w-3" /> OUT OF STOCK
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
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
                    <p className="font-semibold text-cyan-400">
                      ${Number(p.price).toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2 border-t border-[var(--border)] pt-3">
                  <div className="min-w-[200px] flex-1">
                    <label className="mb-1 block text-xs text-[var(--muted)]">
                      Image URL
                    </label>
                    <input
                      className="input text-sm"
                      placeholder="https://...jpg"
                      value={
                        editingImage[p.id] !== undefined
                          ? editingImage[p.id]
                          : img || ""
                      }
                      onChange={(e) =>
                        setEditingImage((s) => ({
                          ...s,
                          [p.id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  {editingImage[p.id] !== undefined && (
                    <button
                      onClick={() => handleImageSave(p.id)}
                      className="btn-primary px-3 py-2 text-xs"
                    >
                      Save image
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
