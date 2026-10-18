import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Migrate data: or external images into Vercel Blob; store only URL in DB.
 * Admin only. Processes a small batch to stay under function timeout.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN missing" },
        { status: 503 }
      );
    }

    const products = await prisma.storeProduct.findMany({
      where: {
        OR: [
          { imageUrl: { startsWith: "data:" } },
          { imageUrl: { startsWith: "http" } },
        ],
      },
      select: { id: true, imageUrl: true, slug: true },
      take: 5,
    });

    const migrated: string[] = [];

    for (const p of products) {
      if (!p.imageUrl) continue;
      // Already on Blob — skip
      if (p.imageUrl.includes("blob.vercel-storage.com")) continue;

      try {
        let body: Blob | Buffer;
        let contentType = "image/jpeg";

        if (p.imageUrl.startsWith("data:")) {
          const m = p.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (!m) continue;
          contentType = m[1];
          body = Buffer.from(m[2], "base64");
        } else {
          const res = await fetch(p.imageUrl, {
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) continue;
          contentType = res.headers.get("content-type") || contentType;
          body = Buffer.from(await res.arrayBuffer());
        }

        const ext = contentType.includes("png")
          ? "png"
          : contentType.includes("webp")
            ? "webp"
            : "jpg";
        const blob = await put(`products/${p.slug}-${Date.now()}.${ext}`, body, {
          access: "public",
          contentType,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        await prisma.storeProduct.update({
          where: { id: p.id },
          data: { imageUrl: blob.url },
        });
        migrated.push(p.id);
      } catch (e) {
        console.error("migrate image", p.id, e);
      }
    }

    return NextResponse.json({
      ok: true,
      migrated: migrated.length,
      ids: migrated,
      note: "Run again until migrated is 0",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
