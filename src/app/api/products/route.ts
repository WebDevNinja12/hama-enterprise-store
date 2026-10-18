import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { assertHttpsImageUrl, verifyRemoteImage } from "@/lib/blob";

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
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS "posterUrl" TEXT`
    );
  } catch (e) {
    console.warn("ensureProductColumns:", e);
  }
}

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.number().positive(),
  compareAt: z.number().positive().optional().nullable(),
  category: z.string().min(1),
  brand: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
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
  emoji: string;
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
    emoji: p.emoji,
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
        { error: "Admin access required. Sign in again as admin." },
        { status: 403 }
      );
    }

    await ensureProductColumns();

    const body = await req.json();
    const data = productSchema.parse(body);
    let slug = data.slug?.trim() || slugify(data.name);

    const exists = await prisma.storeProduct.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;

    let imageUrl: string | null;
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
            "Product image is required. Paste an https:// image URL (or use Blob upload).",
        },
        { status: 400 }
      );
    }

    // Soft verify: log if unreachable, still allow valid https URLs
    // (many CDNs block HEAD/server fetch but work in the browser)
    const check = await verifyRemoteImage(imageUrl);
    if (!check.ok) {
      console.warn("Image verify soft-fail, saving anyway:", imageUrl, check.error);
    }

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
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid product data" },
        { status: 400 }
      );
    }
    const msg = err instanceof Error ? err.message : "Failed to create product";
    console.error("Create product error:", err);

    if (msg.includes("imageUrl") || msg.includes("column") || msg.includes("Unknown arg")) {
      return NextResponse.json(
        {
          error:
            "Database missing imageUrl column. Open Admin → Push schema, then try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
