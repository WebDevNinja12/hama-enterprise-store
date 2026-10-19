"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Video, Trash2 } from "lucide-react";

const MAX_FILE_BYTES = 2.5 * 1024 * 1024;

export default function AdminAboutVideoPage() {
  const [url, setUrl] = useState("");
  const [poster, setPoster] = useState("");
  const [title, setTitle] = useState("About promo");
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/about-video");
      const data = await res.json();
      if (data.url) {
        setUrl(data.url);
        setPoster(data.poster || "");
        setTitle(data.title || "About promo");
        setSaved(true);
      }
    } catch {
      setError("Failed to load current video");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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

  async function onPickVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function onPickPoster(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPoster(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/about-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="mb-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
      >
        <ArrowLeft className="h-3 w-3" /> Admin
      </Link>
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-[var(--heading)]">
        <Video className="h-6 w-6 text-cyan-400" /> About page video
      </h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Upload or set the short promo video shown on the main website About page
        (replaces the old logo block).{" "}
        <a
          href="https://hama-enterprise-ng.vercel.app/about.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:underline"
        >
          View About page
        </a>
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading...</p>
      ) : (
        <form onSubmit={handleSave} className="card space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="About promo"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">
              Video URL or upload (max ~2.5MB for upload)
            </label>
            <input
              value={url.startsWith("data:") ? "[Uploaded video]" : url}
              onChange={(e) => setUrl(e.target.value)}
              className="input mb-2"
              placeholder="https://...mp4 or upload below"
            />
            <input
              type="file"
              accept="video/*"
              onChange={onPickVideo}
              className="block w-full text-sm text-[var(--muted)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-[var(--muted)]">
              Poster / thumbnail (optional)
            </label>
            <input
              value={poster.startsWith("data:") ? "[Uploaded poster]" : poster}
              onChange={(e) => setPoster(e.target.value)}
              className="input mb-2"
              placeholder="https://...jpg"
            />
            <input
              type="file"
              accept="image/*"
              onChange={onPickPoster}
              className="block w-full text-sm text-[var(--muted)]"
            />
          </div>

          {url && (
            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              <video
                src={url}
                poster={poster || undefined}
                controls
                playsInline
                className="max-h-64 w-full bg-black"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="rounded"
            />
            Published (show on About page)
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || !url}
              className="btn-primary rounded-lg px-5 py-2 text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : saved ? "Update video" : "Save video"}
            </button>
            {saved && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
