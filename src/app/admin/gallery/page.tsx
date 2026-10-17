"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";

type MediaItem = {
  id: string;
  title: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  poster: string | null;
  narration: string | null;
  published: boolean;
  sortOrder: number;
};

const MAX_FILE_BYTES = 2.5 * 1024 * 1024;

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
    narration: "",
    published: true,
  });

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery?admin=1");
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

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_FILE_BYTES) {
        reject(
          new Error(
            "File too large (max ~2.5MB). Host online and paste the URL instead."
          )
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  }

  async function onPickFile(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "url" | "poster"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (field === "url") {
        if (file.type.startsWith("video/")) {
          setForm((f) => ({ ...f, type: "VIDEO", url: dataUrl }));
        } else {
          setForm((f) => ({ ...f, type: "IMAGE", url: dataUrl }));
        }
      } else {
        setForm((f) => ({ ...f, poster: dataUrl }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

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
          narration: form.narration || null,
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="mb-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
      >
        <ArrowLeft className="h-3 w-3" /> Admin
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-[var(--heading)]">
        Gallery media
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Add images/videos with a short narration for customers. View on{" "}
        <Link href="/gallery" className="text-cyan-400 hover:underline">
          /gallery
        </Link>
        .
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="card mb-8 space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-[var(--heading)]">
          <Plus className="h-4 w-4 text-cyan-400" /> Add media
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="Project site"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Type</label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as "IMAGE" | "VIDEO" })
              }
              className="input"
            >
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-[var(--muted)]">
              Narration (shown to customers)
            </label>
            <textarea
              className="input min-h-[88px]"
              value={form.narration}
              onChange={(e) => setForm({ ...form, narration: e.target.value })}
              placeholder="Describe what the customer is seeing — story, product story, project notes..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-[var(--muted)]">
              Media URL or upload
            </label>
            <input
              value={form.url.startsWith("data:") ? "[Uploaded file]" : form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="input mb-2"
              placeholder="https://... or upload below"
            />
            <input
              type="file"
              accept={form.type === "IMAGE" ? "image/*" : "video/*,image/*"}
              onChange={(e) => onPickFile(e, "url")}
              className="block w-full text-sm text-[var(--muted)]"
            />
            {form.url && (
              <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)]">
                {form.type === "IMAGE" || form.url.startsWith("data:image") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.url}
                    alt="Preview"
                    className="max-h-48 w-full object-contain bg-black/40"
                  />
                ) : (
                  <video
                    src={form.url}
                    controls
                    playsInline
                    className="max-h-48 w-full bg-black/40"
                  />
                )}
              </div>
            )}
          </div>
          {form.type === "VIDEO" && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-[var(--muted)]">
                Poster / thumbnail (optional)
              </label>
              <input
                value={
                  form.poster.startsWith("data:")
                    ? "[Uploaded poster]"
                    : form.poster
                }
                onChange={(e) => setForm({ ...form, poster: e.target.value })}
                className="input mb-2"
                placeholder="https://... thumbnail"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickFile(e, "poster")}
                className="block w-full text-sm text-[var(--muted)]"
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
          Published (show on public Gallery)
        </label>
        <button
          type="submit"
          disabled={saving || !form.url}
          className="btn-primary rounded-lg px-5 py-2 text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add to Gallery"}
        </button>
      </form>

      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-[var(--heading)]">
          Gallery items ({items.length})
        </h2>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No media yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-[var(--border)]"
              >
                <div className="aspect-video bg-[var(--surface)]">
                  {item.type === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.url}
                      poster={item.poster || undefined}
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                      preload="metadata"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-[var(--heading)]">{item.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {item.type} · {item.published ? "Published" : "Draft"}
                  </p>
                  {item.narration && (
                    <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                      {item.narration}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
