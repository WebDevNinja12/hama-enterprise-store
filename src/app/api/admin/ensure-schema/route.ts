import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Admin-only: ensure StoreProduct.imageUrl column exists (PostgreSQL).
 * Safe to call multiple times.
 */
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

    return NextResponse.json({
      ok: true,
      message: "StoreProduct.imageUrl column is ready",
    });
  } catch (err) {
    console.error("ensure-schema error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Schema update failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
