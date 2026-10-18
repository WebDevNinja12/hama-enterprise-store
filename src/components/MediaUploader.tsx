"use client";

import { useCallback, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ImagePlus, Film, Loader2, X } from "lucide-react";

type Kind = "image" | "video";

type Props = {
  kind: Kind;
  label: string;
  value: string;
  onChange: (url: string) => void;
  onSessionTouch?: () => void;
};

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const VIDEO_ACCEPT = "video/mp4";
const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 20 * 1024 * 1024;

/** Compress image in-browser to ~1200px WebP before Blob upload */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const max = 1200;
  let { width, height } = bitmap;
  if (width > max || height > max) {
    const scale = Math.min(max / width, max / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/webp", 0.82)
  );
  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], name, { type: "image/webp" });
}

export default function MediaUploader({
  kind,
  label,
  value,
  onChange,
  onSessionTouch,
}: Props) {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setError("");
      setProgress(0);
      onSessionTouch?.();

      if (kind === "image") {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setError("Images must be JPEG, PNG, or WebP.");
          return;
        }
        if (file.size > IMAGE_MAX * 2) {
          setError("Image too large (max ~5 MB after compression).");
          return;
        }
      } else {
        if (file.type === "video/quicktime" || file.name.toLowerCase().endsWith(".mov")) {
          setError(
            "iPhone .mov is not supported. Export as MP4 (H.264/AAC) or use YouTube/Vimeo."
          );
          return;
        }
        if (file.type !== "video/mp4") {
          setError("Videos must be MP4 (H.264/AAC).");
          return;
        }
        if (file.size > VIDEO_MAX) {
          setError("Video max 20 MB on free plan. Prefer shorter clips or YouTube/Vimeo.");
          return;
        }
      }

      setBusy(true);
      try {
        let toUpload = file;
        if (kind === "image") {
          setProgress(5);
          toUpload = await compressImage(file);
          if (toUpload.size > IMAGE_MAX) {
            setError("Compressed image still exceeds 5 MB. Use a smaller photo.");
            setBusy(false);
            return;
          }
        }

        const pathname =
          kind === "image"
            ? `products/img-${Date.now()}.webp`
            : `products/vid-${Date.now()}.mp4`;

        const blob = await upload(pathname, toUpload, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          onUploadProgress: ({ percentage }) => {
            setProgress(Math.round(percentage));
          },
        });

        // Save ONLY the https Blob URL returned by Vercel
        if (!blob.url || !blob.url.startsWith("https://")) {
          throw new Error("Upload did not return a valid https Blob URL");
        }
        onChange(blob.url);
        setProgress(100);
      } catch (err) {
        console.error("[MediaUploader]", err);
        const msg =
          err instanceof Error ? err.message : "Upload failed";
        if (msg.includes("403") || msg.toLowerCase().includes("admin")) {
          setError("Session expired. Sign in as admin and try again.");
        } else if (msg.toLowerCase().includes("token")) {
          setError(
            "Blob token missing. Set BLOB_READ_WRITE_TOKEN on Vercel and redeploy."
          );
        } else {
          setError(msg);
        }
      } finally {
        setBusy(false);
      }
    },
    [kind, onChange, onSessionTouch]
  );

  return (
    <div className="space-y-2">
      <label className="block text-xs text-[var(--muted)]">{label}</label>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Preview" className="max-h-40 w-full object-contain" />
          ) : (
            <video
              src={value}
              controls
              playsInline
              muted
              preload="metadata"
              className="max-h-48 w-full bg-black"
            />
          )}
          <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] p-2">
            <p className="truncate text-[10px] text-[var(--muted)]" title={value}>
              {value}
            </p>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
              title="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-center hover:border-cyan-500/40">
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          ) : kind === "image" ? (
            <ImagePlus className="h-6 w-6 text-cyan-400" />
          ) : (
            <Film className="h-6 w-6 text-cyan-400" />
          )}
          <span className="text-xs text-[var(--muted)]">
            {busy
              ? `Uploading… ${progress}%`
              : kind === "image"
                ? "Upload JPEG / PNG / WebP (max 5 MB)"
                : "Upload MP4 H.264 (max 20 MB)"}
          </span>
          <input
            type="file"
            className="hidden"
            accept={kind === "image" ? IMAGE_ACCEPT : VIDEO_ACCEPT}
            disabled={busy}
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
        </label>
      )}

      {busy && (
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full bg-cyan-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {kind === "video" && (
        <p className="text-[10px] text-[var(--muted)]">
          Free plan limits: 1 GB storage / 10 GB bandwidth. Prefer short MP4 or
          YouTube/Vimeo links for long videos. Avoid iPhone .mov.
        </p>
      )}
    </div>
  );
}
