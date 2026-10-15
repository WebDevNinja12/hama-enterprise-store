"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Image as ImageIcon, Video, Plus, Trash2, ArrowLeft } from "lucide-react";

type MediaItem = {
  id: string;
  title: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  poster: string | null;
  published: boolean;
  sortOrder: number;
};

export default function AdminGalleryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "IMAGE" as "IMAGE" | "VIDEO",
    url: "",
    poster: "",
    published: true,
  });

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setError("Failed to load gallery items");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          url: form.url,
          poster: form.poster || null,
          published: form.published,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setForm({ title: "", type: "IMAGE", url: "", poster: "", published: true });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this media item?")) return;
    try {
      const res = await fetch(`/api/gallery?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await loadItems();
    } catch {
      setError("Failed to delete item");
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-[var(--border)] bg-[var(--card)] p-4 md:block">
        <p className="mb-6 text-xs font-bold uppercase tracking-widest text-cyan-400">Admin Console</p>
        <nav className="space-y-1">
          <Link href="/admin" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-white">
            Inventory
          </Link>
          <button className="flex w-full items-center gap-2.5 rounded-lg bg-cyan-500/15 px-3 py-2.5 text-sm font-medium text-cyan-400">
            Gallery Media
          </button>
          <Link href="/" className="mt-4 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-white">
            Exit to Store
          </Link>
        </nav>
      </aside>

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/admin" className="mb-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline">
              <ArrowLeft className="h-3 w-3" /> Back to Admin
            </Link>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Admin Console // Gallery</p>
            <h1 className="text-2xl font-bold text-white">Images & Videos</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Add media here — it will appear on the main website Gallery page.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Add form */}
        <form onSubmit={handleAdd} className="card mb-8 space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <Plus className="h-4 w-4 text-cyan-400" /> Add Media
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                placeholder="Project Site"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--muted)]">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "IMAGE" | "VIDEO" })}
                className="w-full rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
              >
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-[var(--muted)]">Media URL</label>
              <input
                required
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                placeholder="https://... (image or video file URL)"
              />
            </div>
            {form.type === "VIDEO" && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-[var(--muted)]">Poster image URL (optional)</label>
                <input
                  value={form.poster}
                  onChange={(e) => setForm({ ...form, poster: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                  placeholder="https://... thumbnail for the video"
                />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="rounded"
            />
            Published (show on main Gallery)
          </label>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary rounded-lg px-5 py-2 text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add to Gallery"}
          </button>
        </form>

        {/* List */}
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-white">Gallery Items ({items.length})</h2>
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No media yet. Add your first image or video above.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 border-b border-[var(--border)] pb-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15">
                      {item.type === "IMAGE" ? (
                        <ImageIcon className="h-5 w-5 text-cyan-400" />
                      ) : (
                        <Video className="h-5 w-5 text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="max-w-md truncate text-xs text-[var(--muted)]">{item.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge text-[10px] ${item.published ? "badge-success" : "badge-warning"}`}>
                      {item.published ? "Published" : "Draft"}
                    </span>
                    <span className="text-xs text-[var(--muted)]">{item.type}</span>
                    <button
                      onClick={() => handleDelete(item.id)}
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
      </div>
    </div>
  );
}
