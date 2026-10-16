import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  price: z.number().positive(),
  quantity: z.number().int().min(1).max(99),
});

const orderSchema = z.object({
  items: z.array(itemSchema).min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  postal: z.string().min(1),
  country: z.string().default("NG"),
  paymentMethod: z.enum(["card", "bank", "crypto"]),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HAMA-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = orderSchema.parse(body);

    const subtotal = data.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    const shipping = subtotal >= 500 || subtotal === 0 ? 0 : 25;
    const tax = Number((subtotal * 0.08).toFixed(2));
    const total = Number((subtotal + shipping + tax).toFixed(2));

    const session = await auth();
    let userId: string | undefined = session?.user?.id;

    if (!userId) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (existing) {
        userId = existing.id;
      } else {
        const guest = await prisma.user.create({
          data: {
            email: data.email.toLowerCase(),
            name: `${data.firstName} ${data.lastName}`.trim(),
          },
        });
        userId = guest.id;
      }
    }

    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        customerEmail: data.email.toLowerCase(),
        customerPhone: data.phone || null,
        status: data.paymentMethod === "bank" ? "PENDING" : "PROCESSING",
        subtotal,
        shipping,
        tax,
        total,
        shippingName: `${data.firstName} ${data.lastName}`.trim(),
        shippingAddress: data.address,
        shippingCity: data.city,
        shippingPostal: data.postal,
        shippingCountry: data.country || "NG",
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference || null,
        notes: data.notes || null,
        items: {
          create: data.items.map((item) => ({
            productName: item.name,
            productSlug: item.slug || null,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid order data", details: err.errors },
        { status: 400 }
      );
    }
    console.error("Create order error:", err);
    const message =
      err instanceof Error && err.message.includes("DATABASE_URL")
        ? "Database not configured. Set DATABASE_URL on Vercel."
        : "Failed to create order. Check database connection.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";

    if (isAdmin) {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { items: true },
      });
      return NextResponse.json({ orders });
    }

    if (session?.user?.id) {
      const orders = await prisma.order.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: { items: true },
      });
      return NextResponse.json({ orders });
    }

    return NextResponse.json(
      { error: "Sign in to view orders" },
      { status: 401 }
    );
  } catch (err) {
    console.error("List orders error:", err);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  }
}
