import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Creates all required tables on a fresh database.
 * Safe to call multiple times (IF NOT EXISTS).
 */
export async function POST(req: Request) {
  try {
    const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (secret) {
      const hdr = req.headers.get("x-bootstrap-secret");
      // Allow without header if secret not required for empty-db bootstrap
      if (hdr && hdr !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const statements = [
      `DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
      `DO $$ BEGIN CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO'); EXCEPTION WHEN duplicate_object THEN null; END $$`,

      `CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" TIMESTAMP(3),
        image TEXT,
        password TEXT,
        role "Role" NOT NULL DEFAULT 'USER',
        "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS "Account" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE (provider, "providerAccountId")
      )`,

      `CREATE TABLE IF NOT EXISTS "Session" (
        id TEXT PRIMARY KEY,
        "sessionToken" TEXT NOT NULL UNIQUE,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        expires TIMESTAMP(3) NOT NULL
      )`,

      `CREATE TABLE IF NOT EXISTS "VerificationToken" (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires TIMESTAMP(3) NOT NULL,
        UNIQUE (identifier, token)
      )`,

      `CREATE TABLE IF NOT EXISTS "Category" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        image TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS "Product" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        "compareAt" DECIMAL(10,2),
        sku TEXT NOT NULL UNIQUE,
        stock INTEGER NOT NULL DEFAULT 0,
        "minStock" INTEGER NOT NULL DEFAULT 5,
        images TEXT[] NOT NULL DEFAULT '{}',
        featured BOOLEAN NOT NULL DEFAULT false,
        "categoryId" TEXT NOT NULL REFERENCES "Category"(id),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS "StoreProduct" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        "compareAt" DECIMAL(10,2),
        category TEXT NOT NULL,
        brand TEXT NOT NULL DEFAULT 'HAMA',
        emoji TEXT NOT NULL DEFAULT '📦',
        "imageUrl" TEXT,
        "videoUrl" TEXT,
        "posterUrl" TEXT,
        stock INTEGER NOT NULL DEFAULT 0,
        rating DOUBLE PRECISION NOT NULL DEFAULT 5,
        published BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS "CartItem" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "productId" TEXT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("userId", "productId")
      )`,

      `CREATE TABLE IF NOT EXISTS "Order" (
        id TEXT PRIMARY KEY,
        "orderNumber" TEXT NOT NULL UNIQUE,
        "userId" TEXT REFERENCES "User"(id),
        "customerEmail" TEXT NOT NULL,
        "customerPhone" TEXT,
        status "OrderStatus" NOT NULL DEFAULT 'PENDING',
        subtotal DECIMAL(10,2) NOT NULL,
        shipping DECIMAL(10,2) NOT NULL DEFAULT 0,
        tax DECIMAL(10,2) NOT NULL DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        "shippingName" TEXT NOT NULL,
        "shippingAddress" TEXT NOT NULL,
        "shippingCity" TEXT NOT NULL,
        "shippingPostal" TEXT NOT NULL,
        "shippingCountry" TEXT NOT NULL DEFAULT 'NG',
        "paymentMethod" TEXT,
        "paymentReference" TEXT,
        "paymentIntentId" TEXT,
        "stripeSessionId" TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS "OrderItem" (
        id TEXT PRIMARY KEY,
        "orderId" TEXT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
        "productId" TEXT REFERENCES "Product"(id),
        "productName" TEXT NOT NULL,
        "productSlug" TEXT,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL
      )`,

      `CREATE TABLE IF NOT EXISTS "Review" (
        id TEXT PRIMARY KEY,
        rating INTEGER NOT NULL,
        comment TEXT,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "productId" TEXT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("userId", "productId")
      )`,

      `CREATE TABLE IF NOT EXISTS "GalleryMedia" (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type "MediaType" NOT NULL,
        url TEXT NOT NULL,
        poster TEXT,
        narration TEXT,
        published BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS "SiteMedia" (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        title TEXT,
        url TEXT NOT NULL,
        poster TEXT,
        published BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    const results: string[] = [];
    for (const sql of statements) {
      try {
        await prisma.$executeRawUnsafe(sql);
        results.push("ok");
      } catch (e) {
        results.push(`err: ${String(e).slice(0, 120)}`);
      }
    }

    // Verify User table
    const users = await prisma.user.count().catch(() => -1);

    return NextResponse.json({
      ok: users >= 0,
      userTableReady: users >= 0,
      steps: results.length,
      errors: results.filter((r) => r.startsWith("err")).length,
    });
  } catch (err) {
    console.error("db-init error:", err);
    return NextResponse.json(
      { error: "db-init failed", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ usage: "POST /api/db-init" });
}
