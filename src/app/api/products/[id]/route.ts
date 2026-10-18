import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  assertHttpsImageUrl,
  deleteBlobIfOurs,
  verifyRemoteImage,
} from "@/lib/blob";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  price: z.number().positive().optional(),
  compareAt: z.number().positive().nullable().optional(),
  category: z.string().min(1).optional(),
  brand: z.string().optional(),
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

    const existing = await prisma.storeProduct.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const patch: Record<string, unknown> = {};
    if (data.name) patch.name = data.name.trim();
    if (data.description) patch.description = data.description.trim();
    if (data.category) patch.category = data.category.trim();
    if (data.brand !== undefined) patch.brand = data.brand;
    if (data.price !== undefined) patch.price = data.price;
    if (data.compareAt !== undefined) patch.compareAt = data.compareAt;
    if (data.stock !== undefined) patch.stock = data.stock;
    if (data.rating !== undefined) patch.rating = data.rating;
    if (data.published !== undefined) patch.published = data.published;

    if (data.imageUrl !== undefined) {
      try {
        const next = assertHttpsImageUrl(data.imageUrl, "imageUrl");
        if (next) {
          const check = await verifyRemoteImage(next);
          if (!check.ok) {
            return NextResponse.json(
              { error: check.error || "Image URL could not be verified" },
              { status: 400 }
            );
          }
        }
        if (next !== existing.imageUrl) {
          await deleteBlobIfOurs(existing.imageUrl);
        }
        patch.imageUrl = next;
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Invalid image URL" },
          { status: 400 }
        );
      }
    }

    const product = await prisma.storeProduct.update({
      where: { id },
      data: patch,
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
    const existing = await prisma.storeProduct.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await deleteBlobIfOurs(existing.imageUrl);
    await deleteBlobIfOurs(existing.videoUrl);
    await deleteBlobIfOurs(existing.posterUrl);

    await prisma.storeProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete product error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
