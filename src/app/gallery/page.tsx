"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Video, Play } from "lucide-react";

type MediaItem = {
  id: string;
  title: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  poster: string | null;
};

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}

function youtubeEmbed(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    const id = u.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
  } catch {
    /* ignore */
  }
  return url;
}

export default function GalleryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<MediaItem | null>(null);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">
          Gallery
        </p>
        <h1 className="text-3xl font-bold text-[var(--heading)]">
          Images & Videos
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Media published by HAMA ENTERPRISE NG
        </p>
      </div>

      {loading ? (
        <p className="text-[var(--muted)]">Loading gallery...</p>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-[var(--muted)]" />
          <p className="text-[var(--muted)]">No gallery items yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item)}
              className="card group overflow-hidden text-left transition hover:border-cyan-500/40"
            >
              <div className="relative aspect-video bg-[var(--surface)]">
                {item.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : isYouTube(item.url) ? (
                  <div className="relative h-full w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        item.poster ||
                        `https://img.youtube.com/vi/${youtubeEmbed(item.url).split("/").pop()}/hqdefault.jpg`
                      }
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-12 w-12 text-white" />
                    </span>
                  </div>
                ) : (
                  <video
                    src={item.url}
                    poster={item.poster || undefined}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}
                <span className="absolute left-2 top-2 badge badge-cyan text-[10px]">
                  {item.type === "IMAGE" ? "IMAGE" : "VIDEO"}
                </span>
              </div>
              <div className="p-3">
                <p className="font-medium text-[var(--heading)] group-hover:text-cyan-400">
                  {item.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-[var(--card)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <p className="font-semibold text-[var(--heading)]">{active.title}</p>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="text-sm text-[var(--muted)] hover:text-cyan-400"
              >
                Close
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto p-2">
              {active.type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={active.url}
                  alt={active.title}
                  className="mx-auto max-h-[75vh] w-auto max-w-full object-contain"
                />
              ) : isYouTube(active.url) ? (
                <iframe
                  src={youtubeEmbed(active.url)}
                  title={active.title}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={active.url}
                  poster={active.poster || undefined}
                  controls
                  autoPlay
                  className="mx-auto max-h-[75vh] w-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
