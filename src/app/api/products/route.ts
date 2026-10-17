import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { products as seedProducts } from "@/lib/products";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.number().positive(),
  compareAt: z.number().positive().optional().nullable(),
  category: z.string().min(1),
  brand: z.string().optional(),
  emoji: z.string().optional(),
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
  stock: number;
  rating: number;
  description: string;
  published: boolean;
}) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    compareAt: p.compareAt != null ? Number(p.compareAt) : undefined,
    category: p.category,
    brand: p.brand,
    emoji: p.emoji,
    image: undefined as string | undefined,
    stock: p.stock,
    rating: p.rating,
    description: p.description,
    published: p.published,
    source: "db" as const,
  };
}

/** Public: published only. Admin: ?admin=1 returns DB + seed catalog products */
export async function GET(req: NextRequest) {
  try {
    const adminFlag = req.nextUrl.searchParams.get("admin") === "1";
    let isAdmin = false;

    if (adminFlag) {
      const session = await auth();
      isAdmin = session?.user?.role === "ADMIN";
      if (!isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }

    const dbProducts = await prisma.storeProduct.findMany({
      where: isAdmin ? undefined : { published: true },
      orderBy: { createdAt: "desc" },
    });

    const mapped = dbProducts.map(mapDbProduct);

    if (isAdmin) {
      const dbSlugs = new Set(mapped.map((p) => p.slug));
      const seeds = seedProducts
        .filter((p) => !dbSlugs.has(p.slug))
        .map((p) => ({
          id: `seed-${p.id}`,
          name: p.name,
          slug: p.slug,
          price: p.price,
          compareAt: p.compareAt,
          category: p.category,
          brand: p.brand,
          emoji: p.emoji || "📦",
          image: p.image,
          stock: p.stock,
          rating: p.rating,
          description: p.description,
          published: true,
          source: "seed" as const,
        }));
      const all = [...mapped, ...seeds];
      return NextResponse.json({
        products: all,
        outOfStock: all.filter((p) => p.stock <= 0).length,
        lowStock: all.filter((p) => p.stock > 0 && p.stock <= 5).length,
      });
    }

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
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const data = productSchema.parse(body);
    let slug = data.slug?.trim() || slugify(data.name);

    const exists = await prisma.storeProduct.findUnique({ where: { slug } });
    if (exists) {
      slug = `${slug}-${Date.now().toString(36)}`;
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
        emoji: data.emoji?.trim() || "📦",
        stock: data.stock ?? 0,
        rating: data.rating ?? 5,
        published: data.published ?? true,
      },
    });

    return NextResponse.json({
      ok: true,
      product: mapDbProduct(product),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid product data" },
        { status: 400 }
      );
    }
    console.error("Create product error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
