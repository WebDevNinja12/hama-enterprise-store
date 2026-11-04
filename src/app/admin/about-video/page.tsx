"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Video } from "lucide-react";
import MediaUploader from "@/components/MediaUploader";
import SafeVideo from "@/components/SafeVideo";

export default function AdminAboutVideoPage() {
  const [title, setTitle] = useState("About HAMA");
  const [url, setUrl] = useState("");
  const [poster, setPoster] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/about-video")
      .then((r) => r.json())
      .then((d) => {
        if (d.url) {
          setUrl(d.url);
          setPoster(d.poster || "");
          setTitle(d.title || "About HAMA");
          setPublished(d.published !== false);
          setSaved(true);
        }
      })
      .catch(() => setError("Failed to load current video"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!url.startsWith("https://")) {
        throw new Error("Upload an MP4 to Blob or paste an https:// URL");
      }
      if (url.startsWith("data:")) {
        throw new Error("Base64 videos are not supported. Use Blob upload.");
      }
      const res = await fetch("/api/about-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          url,
          poster: poster || null,
          published,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove the About page promo video?")) return;
    try {
      const res = await fetch("/api/about-video", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setUrl("");
      setPoster("");
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-[var(--muted)]">Loading…</p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline"
        >
          <ArrowLeft className="h-3 w-3" /> Admin
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--heading)]">
          <Video className="h-6 w-6 text-cyan-400" /> About page video
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Upload MP4 via Vercel Blob (max 20 MB). iPhone .mov is not supported.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="card space-y-4 p-6">
        <input
          className="input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <MediaUploader
          kind="video"
          label="Promo video (MP4)"
          value={url.startsWith("https://") ? url : ""}
          onChange={setUrl}
        />

        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">
            Or paste https video URL
          </label>
          <input
            className="input"
            placeholder="https://….public.blob.vercel-storage.com/….mp4"
            value={url.startsWith("https://") ? url : ""}
            onChange={(e) => setUrl(e.target.value.trim())}
          />
        </div>

        <MediaUploader
          kind="image"
          label="Poster image (optional)"
          value={poster.startsWith("https://") ? poster : ""}
          onChange={setPoster}
        />

        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Published
        </label>

        {url.startsWith("https://") && (
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-black">
            <SafeVideo src={url} poster={poster} className="max-h-72 w-full" />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving || !url}
            className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : saved ? "Update video" : "Save video"}
          </button>
          {saved && (
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-full px-4 py-2 text-sm text-red-300 ring-1 ring-red-500/30"
            >
              Remove
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
