import { del } from "@vercel/blob";

/** Vercel Blob public URL host pattern */
export function isVercelBlobUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return (
      u.hostname.endsWith(".public.blob.vercel-storage.com") ||
      u.hostname.endsWith(".blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

/** Reject blob: previews, data URLs, local paths, bare filenames */
export function isInvalidMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith("blob:")) return true;
  if (t.startsWith("data:")) return true;
  if (t.startsWith("/uploads")) return true;
  if (!t.startsWith("http://") && !t.startsWith("https://")) return true;
  return false;
}

/**
 * Saved product media must be https Blob URLs (or legacy https during transition).
 * Strict mode: only Blob host.
 */
export function assertProductMediaUrl(
  url: string | null | undefined,
  opts?: { strictBlob?: boolean; field?: string }
): string | null {
  if (url == null || String(url).trim() === "") return null;
  const t = String(url).trim();
  if (isInvalidMediaUrl(t)) {
    throw new Error(
      `${opts?.field || "Media"} must be an https URL from Vercel Blob — not a filename, /uploads path, blob: preview, or base64.`
    );
  }
  if (!t.startsWith("https://")) {
    throw new Error(`${opts?.field || "Media"} must use https://`);
  }
  if (opts?.strictBlob !== false && !isVercelBlobUrl(t)) {
    // Allow unsplash / external https only when not strict
    if (opts?.strictBlob === true) {
      throw new Error(
        `${opts?.field || "Media"} must be a Vercel Blob URL (*.public.blob.vercel-storage.com)`
      );
    }
  }
  return t;
}

export async function deleteBlobIfOurs(url: string | null | undefined) {
  if (!url || !isVercelBlobUrl(url)) return;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  } catch (e) {
    console.warn("Blob delete failed:", url, e);
  }
}

export function randomSuffix() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
