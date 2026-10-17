import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { products as seedProducts } from "@/lib/products";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  price: z.number().positive().optional(),
  compareAt: z.number().positive().nullable().optional(),
  category: z.string().min(1).optional(),
  brand: z.string().optional(),
  emoji: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
  published: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    // Seed products: promote to DB then update
    if (id.startsWith("seed-")) {
      const seedId = id.replace("seed-", "");
      const seed = seedProducts.find((p) => p.id === seedId);
      if (!seed) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      const existing = await prisma.storeProduct.findUnique({ where: { slug: seed.slug } });
      if (existing) {
        const product = await prisma.storeProduct.update({
          where: { id: existing.id },
          data: {
            ...data,
            ...(data.name ? { name: data.name.trim() } : {}),
            ...(data.description ? { description: data.description.trim() } : {}),
            ...(data.category ? { category: data.category.trim() } : {}),
          },
        });
        return NextResponse.json({ ok: true, product });
      }
      const product = await prisma.storeProduct.create({
        data: {
          name: data.name?.trim() || seed.name,
          slug: seed.slug,
          description: data.description?.trim() || seed.description,
          price: data.price ?? seed.price,
          compareAt: data.compareAt ?? seed.compareAt ?? null,
          category: data.category?.trim() || seed.category,
          brand: data.brand || seed.brand,
          emoji: data.emoji || "📦",
          stock: data.stock ?? seed.stock,
          rating: data.rating ?? seed.rating,
          published: data.published ?? true,
        },
      });
      return NextResponse.json({ ok: true, product });
    }

    const product = await prisma.storeProduct.update({
      where: { id },
      data: {
        ...data,
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.description ? { description: data.description.trim() } : {}),
        ...(data.category ? { category: data.category.trim() } : {}),
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("Update product error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await context.params;

    // Remove catalog seed product by writing an unpublished tombstone
    if (id.startsWith("seed-")) {
      const seedId = id.replace("seed-", "");
      const seed = seedProducts.find((p) => p.id === seedId);
      if (!seed) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      const existing = await prisma.storeProduct.findUnique({ where: { slug: seed.slug } });
      if (existing) {
        await prisma.storeProduct.update({
          where: { id: existing.id },
          data: { published: false },
        });
      } else {
        await prisma.storeProduct.create({
          data: {
            name: seed.name,
            slug: seed.slug,
            description: seed.description,
            price: seed.price,
            compareAt: seed.compareAt ?? null,
            category: seed.category,
            brand: seed.brand,
            emoji: "📦",
            stock: 0,
            rating: seed.rating,
            published: false,
          },
        });
      }
      return NextResponse.json({ ok: true, removed: "seed" });
    }

    await prisma.storeProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete product error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
