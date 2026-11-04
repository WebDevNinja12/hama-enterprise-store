"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Image as ImageIcon, Film } from "lucide-react";
import MediaUploader from "@/components/MediaUploader";
import SafeVideo from "@/components/SafeVideo";

type Item = {
  id: string;
  title: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  poster?: string | null;
  narration?: string | null;
  published: boolean;
  sortOrder: number;
};

export default function AdminGalleryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "IMAGE" as "IMAGE" | "VIDEO",
    url: "",
    poster: "",
    narration: "",
    published: true,
  });

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery?admin=1", { credentials: "include" });
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError("Failed to load gallery items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!form.url.startsWith("https://")) {
        throw new Error("Upload a file to Blob or paste an https:// URL");
      }
      if (form.url.startsWith("data:")) {
        throw new Error("Base64 data URLs are not allowed. Use Blob upload.");
      }
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title.trim() || "Gallery item",
          type: form.type,
          url: form.url,
          poster: form.poster || null,
          narration: form.narration.trim() || null,
          published: form.published,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setForm({
        title: "",
        type: "IMAGE",
        url: "",
        poster: "",
        narration: "",
        published: true,
      });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}" from gallery?`)) return;
    try {
      const res = await fetch(`/api/gallery?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline"
        >
          <ArrowLeft className="h-3 w-3" /> Admin
        </Link>
        <h1 className="text-2xl font-bold text-[var(--heading)]">Gallery media</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Upload images/videos to Vercel Blob (https URLs only). Videos must be MP4.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="card space-y-4 p-6">
        <h2 className="font-semibold text-[var(--heading)]">Add media</h2>

        <div className="flex flex-wrap gap-2">
          {(["IMAGE", "VIDEO"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  type: t,
                  url: "",
                  poster: t === "IMAGE" ? "" : f.poster,
                }))
              }
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ring-1 ${
                form.type === t
                  ? "bg-cyan-500/15 text-cyan-300 ring-cyan-500/40"
                  : "text-[var(--muted)] ring-[var(--border)]"
              }`}
            >
              {t === "IMAGE" ? (
                <ImageIcon className="h-4 w-4" />
              ) : (
                <Film className="h-4 w-4" />
              )}
              {t}
            </button>
          ))}
        </div>

        <input
          className="input"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <MediaUploader
          kind={form.type === "VIDEO" ? "video" : "image"}
          label={form.type === "VIDEO" ? "Video (MP4)" : "Image"}
          value={form.url}
          onChange={(url) => setForm((f) => ({ ...f, url }))}
        />

        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">
            Or paste https URL
          </label>
          <input
            className="input"
            placeholder="https://….public.blob.vercel-storage.com/…"
            value={form.url.startsWith("https://") ? form.url : ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              setForm((f) => ({ ...f, url: v }));
            }}
          />
        </div>

        {form.type === "VIDEO" && (
          <MediaUploader
            kind="image"
            label="Poster image (optional)"
            value={form.poster}
            onChange={(poster) => setForm((f) => ({ ...f, poster }))}
          />
        )}

        <textarea
          className="input min-h-[80px]"
          placeholder="Narration (shown to customers on main site)"
          value={form.narration}
          onChange={(e) => setForm({ ...form, narration: e.target.value })}
        />

        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          Published (available via API for main site)
        </label>

        <button
          type="submit"
          disabled={saving || !form.url}
          className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add to gallery"}
        </button>
      </form>

      <div>
        <h2 className="mb-3 font-semibold text-[var(--heading)]">
          Gallery items ({items.length})
        </h2>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No media yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-[var(--border)]"
              >
                <div className="aspect-video bg-black/40">
                  {item.type === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <SafeVideo
                      src={item.url}
                      poster={item.poster}
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--heading)]">{item.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {item.type} · {item.published ? "Published" : "Draft"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {item.narration ? (
                    <p className="mt-2 rounded-lg bg-cyan-500/10 p-2 text-sm leading-relaxed text-[var(--heading)]">
                      {item.narration}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-amber-400">No narration yet</p>
                  )}
                  <p className="mt-2 truncate text-[10px] text-[var(--muted)]" title={item.url}>
                    {item.url}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
