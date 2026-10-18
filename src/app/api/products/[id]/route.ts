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
  imageUrl: z.string().optional().nullable(),
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

    let imageUrl: string | null | undefined = undefined;
    if (data.imageUrl !== undefined) {
      const t = data.imageUrl == null ? "" : String(data.imageUrl).trim();
      if (!t) imageUrl = null;
      else if (!/^https?:\/\//i.test(t) && !t.startsWith("/")) {
        return NextResponse.json(
          { error: "Image URL must start with http:// or https://" },
          { status: 400 }
        );
      } else {
        imageUrl = t;
      }
    }

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
            ...(data.name ? { name: data.name.trim() } : {}),
            ...(data.description ? { description: data.description.trim() } : {}),
            ...(data.category ? { category: data.category.trim() } : {}),
            ...(data.brand !== undefined ? { brand: data.brand } : {}),
            ...(data.price !== undefined ? { price: data.price } : {}),
            ...(data.compareAt !== undefined ? { compareAt: data.compareAt } : {}),
            ...(data.stock !== undefined ? { stock: data.stock } : {}),
            ...(data.rating !== undefined ? { rating: data.rating } : {}),
            ...(data.published !== undefined ? { published: data.published } : {}),
            ...(imageUrl !== undefined ? { imageUrl } : {}),
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
          imageUrl: imageUrl ?? seed.image ?? null,
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
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.description ? { description: data.description.trim() } : {}),
        ...(data.category ? { category: data.category.trim() } : {}),
        ...(data.brand !== undefined ? { brand: data.brand } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.compareAt !== undefined ? { compareAt: data.compareAt } : {}),
        ...(data.stock !== undefined ? { stock: data.stock } : {}),
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
        ...(data.published !== undefined ? { published: data.published } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
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

    if (id.startsWith("seed-") || id.startsWith("real-")) {
      return NextResponse.json({
        ok: true,
        message: "Fallback catalog item hidden from admin list when DB has products",
      });
    }

    await prisma.storeProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete product error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
