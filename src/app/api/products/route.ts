import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { assertHttpsImageUrl } from "@/lib/blob";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureProductColumns() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT`
    );
  } catch (e) {
    console.warn("ensure imageUrl:", e);
  }
}

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.coerce.number().positive(),
  compareAt: z.coerce.number().positive().optional().nullable(),
  category: z.string().min(1),
  brand: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  stock: z.coerce.number().int().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  published: z.boolean().optional(),
  slug: z.string().optional(),
});

function mapDbProduct(p: {
  id: string;
  name: string;
  slug: string;
  price: { toString(): string } | number;
  compareAt: { toString(): string } | number | null;
  category: string;
  brand: string;
  emoji?: string;
  imageUrl?: string | null;
  stock: number;
  rating: number;
  description: string;
  published: boolean;
}) {
  const imageUrl = p.imageUrl?.trim() || null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    compareAt: p.compareAt != null ? Number(p.compareAt) : undefined,
    category: p.category,
    brand: p.brand,
    emoji: p.emoji || "📦",
    image: imageUrl || undefined,
    imageUrl: imageUrl || undefined,
    stock: p.stock,
    rating: p.rating,
    description: p.description,
    published: p.published,
    source: "db" as const,
  };
}

export async function GET(req: NextRequest) {
  try {
    const adminFlag = req.nextUrl.searchParams.get("admin") === "1";
    const slug = req.nextUrl.searchParams.get("slug");
    let isAdmin = false;

    if (adminFlag) {
      const session = await auth();
      isAdmin = session?.user?.role === "ADMIN";
      if (!isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }

    if (slug) {
      const db = await prisma.storeProduct.findFirst({
        where: isAdmin ? { slug } : { slug, published: true },
      });
      if (db) return NextResponse.json({ product: mapDbProduct(db) });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const dbProducts = await prisma.storeProduct.findMany({
      where: isAdmin ? undefined : { published: true },
      orderBy: { createdAt: "desc" },
    });

    const mapped = dbProducts.map(mapDbProduct);
    return NextResponse.json({
      products: mapped,
      outOfStock: mapped.filter((p) => p.stock <= 0).length,
      lowStock: mapped.filter((p) => p.stock > 0 && p.stock <= 5).length,
    });
  } catch (err) {
    console.error("List products error:", err);
    return NextResponse.json({ products: [], outOfStock: 0, lowStock: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Admin session expired or missing. Sign out, sign in as admin, then try again.",
        },
        { status: 403 }
      );
    }

    await ensureProductColumns();

    const body = await req.json();
    const data = productSchema.parse(body);
    let slug = data.slug?.trim() || slugify(data.name);

    const exists = await prisma.storeProduct.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;

    let imageUrl: string | null = null;
    try {
      imageUrl = assertHttpsImageUrl(data.imageUrl, "imageUrl");
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid image URL" },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error:
            "Product image is required. Paste a full https:// image link (or upload via Blob).",
        },
        { status: 400 }
      );
    }

    try {
      const product = await prisma.storeProduct.create({
        data: {
          name: data.name.trim(),
          slug,
          description: data.description.trim(),
          price: data.price,
          compareAt: data.compareAt ?? null,
          category: data.category.trim(),
          brand: data.brand?.trim() || "HAMA",
          emoji: "📦",
          imageUrl,
          stock: data.stock ?? 0,
          rating: data.rating ?? 5,
          published: data.published ?? true,
        },
      });
      return NextResponse.json({ ok: true, product: mapDbProduct(product) });
    } catch (createErr) {
      console.error("Prisma create failed, trying raw insert:", createErr);

      // Fallback raw insert if Prisma client is out of sync with DB
      const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "StoreProduct"
          (id, name, slug, description, price, category, brand, emoji, "imageUrl", stock, rating, published, "createdAt", "updatedAt")
         VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())`,
        id,
        data.name.trim(),
        slug,
        data.description.trim(),
        data.price,
        data.category.trim(),
        data.brand?.trim() || "HAMA",
        "📦",
        imageUrl,
        data.stock ?? 0,
        data.rating ?? 5
      );

      const product = await prisma.storeProduct.findUnique({ where: { id } });
      if (product) {
        return NextResponse.json({ ok: true, product: mapDbProduct(product) });
      }
      throw createErr;
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid product data" },
        { status: 400 }
      );
    }
    const msg = err instanceof Error ? err.message : "Failed to create product";
    console.error("Create product error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
