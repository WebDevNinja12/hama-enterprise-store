import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Admin-only: ensure columns + search indexes exist */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "StoreProduct"
      ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
    `);

    // Email already unique-indexed by Prisma @@unique

    // Full-text expression index for product search
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
      CREATE INDEX IF NOT EXISTS "StoreProduct_name_trgm_idx"
      ON "StoreProduct" (name);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StoreProduct_published_idx"
      ON "StoreProduct" (published);
    `);

    return NextResponse.json({
      ok: true,
      message: "Schema + search indexes ready",
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
