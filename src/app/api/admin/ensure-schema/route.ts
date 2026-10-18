import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS "posterUrl" TEXT;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StoreProduct_fts_idx"
      ON "StoreProduct"
      USING GIN (
        to_tsvector(
          'english',
          coalesce(name, '') || ' ' || coalesce(category, '') || ' ' || coalesce(brand, '')
        )
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StoreProduct_published_idx"
      ON "StoreProduct" (published);
    `);

    return NextResponse.json({
      ok: true,
      message: "Schema ready (imageUrl, videoUrl, posterUrl + indexes)",
    });
  } catch (err) {
    console.error("ensure-schema error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Schema update failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
