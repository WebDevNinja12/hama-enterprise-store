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

/** Client may send ids only — prices come from the database (anti-tamper). */
const itemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
  // Ignore client price if present — never trust it
  name: z.string().optional(),
  price: z.number().optional(),
});

const orderSchema = z.object({
  items: z.array(itemSchema).min(1).max(50),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().max(200),
  phone: z.string().min(10, "Phone number is required").max(20),
  address: z.string().min(1).max(300),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postal: z.string().min(1).max(20),
  country: z.string().default("NG").max(5),
  paymentMethod: z.enum(["card", "bank", "crypto", "opay"]),
  paymentReference: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
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

    // Resolve every line from DB — never trust client price/name
    type Line = {
      productId: string;
      productName: string;
      productSlug: string;
      quantity: number;
      unitPrice: number;
      stock: number;
    };
    const lines: Line[] = [];

    for (const item of data.items) {
      const dbProduct = await prisma.storeProduct.findFirst({
        where: {
          OR: [
            { id: item.id },
            ...(item.slug ? [{ slug: item.slug }] : []),
          ],
          published: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stock: true,
        },
      });

      if (!dbProduct) {
        return NextResponse.json(
          {
            error: `Product not found or unavailable (${item.slug || item.id}).`,
            code: "PRODUCT_MISSING",
          },
          { status: 400 }
        );
      }

      if (dbProduct.stock < item.quantity) {
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

      const unitPrice = Number(dbProduct.price);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        return NextResponse.json(
          { error: `Invalid price for "${dbProduct.name}". Contact support.` },
          { status: 400 }
        );
      }

      lines.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        productSlug: dbProduct.slug,
        quantity: item.quantity,
        unitPrice,
        stock: dbProduct.stock,
      });
    }

    const subtotal = lines.reduce(
      (sum, l) => sum + l.unitPrice * l.quantity,
      0
    );
    const { shipping } = calcShipping(subtotal, data.state);
    const tax = Number((subtotal * 0.075).toFixed(2));
    const total = Number((subtotal + shipping + tax).toFixed(2));
    const orderNumber = generateOrderNumber();
    const initialStatus =
      data.paymentMethod === "bank" || data.paymentMethod === "opay"
        ? "PENDING"
        : "PROCESSING";

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
          create: lines.map((l) => ({
            productName: l.productName,
            productSlug: l.productSlug,
            quantity: l.quantity,
            price: l.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    for (const l of lines) {
      const nextStock = Math.max(0, l.stock - l.quantity);
      await prisma.storeProduct.update({
        where: { id: l.productId },
        data: { stock: nextStock },
      });
      if (nextStock <= 0) {
        await notifyAdminsStock(l.productName, nextStock);
      }
    }

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
