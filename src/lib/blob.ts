import { del } from "@vercel/blob";

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
 * Product images: any public https URL (Blob, CDN, Unsplash, etc.).
 * Rejects blob:/data:/relative paths.
 */
export function assertHttpsImageUrl(
  url: string | null | undefined,
  field = "imageUrl"
): string | null {
  if (url == null || String(url).trim() === "") return null;
  const t = String(url).trim();
  if (isInvalidMediaUrl(t)) {
    throw new Error(
      `${field} must be a public https image URL — not a filename, /uploads path, blob: preview, or base64.`
    );
  }
  if (!t.startsWith("https://")) {
    throw new Error(`${field} must use https://`);
  }
  return t;
}

/** Fetch URL to confirm it looks like a real image (HEAD, then short GET). */
export async function verifyRemoteImage(url: string): Promise<{
  ok: boolean;
  contentType?: string;
  error?: string;
}> {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    let type = head.headers.get("content-type") || "";
    if (head.ok && type.startsWith("image/")) {
      return { ok: true, contentType: type };
    }
    // Some CDNs block HEAD — try range GET
    const get = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-1023" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    type = get.headers.get("content-type") || type;
    if ((get.ok || get.status === 206) && type.startsWith("image/")) {
      return { ok: true, contentType: type };
    }
    if (get.ok && !type) {
      // URL reachable; allow (some hosts omit content-type)
      return { ok: true, contentType: type || undefined };
    }
    return {
      ok: false,
      error: `Could not verify image at URL (HTTP ${get.status}). Use a direct https image link.`,
    };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? `Could not fetch image: ${e.message}`
          : "Could not fetch image URL",
    };
  }
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
