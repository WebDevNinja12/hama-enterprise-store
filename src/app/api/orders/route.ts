import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  sendEmail,
  stockMaxEmailHtml,
  orderStatusEmailHtml,
  orderStatusSubject,
} from "@/lib/email";
import { calcShipping, isValidNgPhone } from "@/lib/shipping";

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
  phone: z.string().min(10, "Phone number is required"),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
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

async function notifyAdminsStock(productName: string, stock: number) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });
    const emails = [
      ...admins.map((a) => a.email),
      process.env.ADMIN_NOTIFY_EMAIL,
    ].filter(Boolean) as string[];

    for (const to of [...new Set(emails)]) {
      await sendEmail({
        to,
        subject:
          stock <= 0
            ? `Sold out: ${productName}`
            : `Low / max stock: ${productName}`,
        html: stockMaxEmailHtml(productName, stock),
        text: `${productName} stock is now ${stock}`,
      });
    }
  } catch (e) {
    console.error("Admin stock notify failed:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Please sign in or create an account to checkout",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = orderSchema.parse(body);

    if (!isValidNgPhone(data.phone)) {
      return NextResponse.json(
        { error: "Enter a valid phone number (e.g. 0803 123 4567)." },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const email = (session.user.email || data.email).toLowerCase().trim();

    for (const item of data.items) {
      const dbProduct = await prisma.storeProduct.findFirst({
        where: {
          OR: [{ id: item.id }, ...(item.slug ? [{ slug: item.slug }] : [])],
        },
      });
      if (dbProduct && dbProduct.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `"${dbProduct.name}" has only ${dbProduct.stock} left (max reached).`,
            code: "STOCK_MAX",
            productName: dbProduct.name,
            stock: dbProduct.stock,
          },
          { status: 400 }
        );
      }
    }

    const subtotal = data.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    const { shipping } = calcShipping(subtotal, data.state);
    const tax = Number((subtotal * 0.075).toFixed(2));
    const total = Number((subtotal + shipping + tax).toFixed(2));
    const orderNumber = generateOrderNumber();
    const initialStatus =
      data.paymentMethod === "bank" ? "PENDING" : "PROCESSING";

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        customerEmail: email,
        customerPhone: data.phone.trim(),
        status: initialStatus,
        subtotal,
        shipping,
        tax,
        total,
        shippingName: `${data.firstName} ${data.lastName}`.trim(),
        shippingAddress: `${data.address}, ${data.state}`,
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

    for (const item of data.items) {
      const dbProduct = await prisma.storeProduct.findFirst({
        where: {
          OR: [{ id: item.id }, ...(item.slug ? [{ slug: item.slug }] : [])],
        },
      });
      if (!dbProduct) continue;

      const nextStock = Math.max(0, dbProduct.stock - item.quantity);
      await prisma.storeProduct.update({
        where: { id: dbProduct.id },
        data: { stock: nextStock },
      });

      if (nextStock <= 0) {
        await notifyAdminsStock(dbProduct.name, nextStock);
      }
    }

    // Confirmation email to customer
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.AUTH_URL ||
      "https://hama-enterprise-store.vercel.app";

    sendEmail({
      to: email,
      subject: orderStatusSubject(order.orderNumber, initialStatus),
      html: orderStatusEmailHtml({
        orderNumber: order.orderNumber,
        status: initialStatus,
        customerName: order.shippingName,
        accountUrl: `${baseUrl}/account`,
      }),
      text: `Order ${order.orderNumber} placed. Status: ${initialStatus}. View: ${baseUrl}/account`,
    }).catch((e) => console.error("[email] order confirmation failed:", e));

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
        {
          error: err.errors[0]?.message || "Invalid order data",
          details: err.errors,
        },
        { status: 400 }
      );
    }
    console.error("Create order error:", err);
    return NextResponse.json(
      { error: "Failed to create order. Check database connection." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please sign in to view orders" },
        { status: 401 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";

    const orders = await prisma.order.findMany({
      where: isAdmin ? undefined : { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true },
    });

    return NextResponse.json({ orders, isAdmin });
  } catch (err) {
    console.error("List orders error:", err);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  }
}
