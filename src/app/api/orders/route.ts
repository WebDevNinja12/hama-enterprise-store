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
  // .max() must come BEFORE .default() or Zod throws at build time
  country: z.string().max(5).default("NG"),
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
        {
          error:
            "Enter a valid Nigerian phone number (e.g. 08012345678 or +2348012345678)",
        },
        { status: 400 }
      );
    }

    const lines: {
      productId: string;
      productName: string;
      productSlug: string;
      quantity: number;
      unitPrice: number;
      stock: number;
    }[] = [];

    let subtotal = 0;

    for (const item of data.items) {
      const product = await prisma.storeProduct.findFirst({
        where: {
          OR: [{ id: item.id }, { slug: item.slug || item.id }],
          active: true,
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.id}` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
            code: "OUT_OF_STOCK",
            productId: product.id,
            stock: product.stock,
          },
          { status: 400 }
        );
      }

      const unit = Number(product.price);
      subtotal += unit * item.quantity;
      lines.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        quantity: item.quantity,
        unitPrice: unit,
        stock: product.stock,
      });
    }

    const shippingCalc = calcShipping({
      state: data.state,
      subtotalNgn: subtotal,
    });
    const shipping = shippingCalc.amount;
    const total = subtotal + shipping;

    const orderNumber = generateOrderNumber();

    const paymentStatus =
      data.paymentMethod === "bank" || data.paymentMethod === "opay"
        ? "PENDING"
        : "PENDING";

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        status: "PENDING",
        paymentStatus,
        subtotal,
        shipping,
        total,
        shippingFirstName: data.firstName,
        shippingLastName: data.lastName,
        shippingEmail: data.email,
        shippingPhone: data.phone,
        shippingAddress: data.address,
        shippingCity: data.city,
        shippingState: data.state,
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

    // Confirm order to customer
    try {
      await sendEmail({
        to: data.email,
        subject: orderStatusSubject("PENDING", orderNumber),
        html: orderStatusEmailHtml({
          orderNumber,
          status: "PENDING",
          customerName: `${data.firstName} ${data.lastName}`.trim(),
          total,
        }),
        text: `Order ${orderNumber} received. Status: PENDING. Total: NGN ${total}`,
      });
    } catch (e) {
      console.error("Order confirmation email failed:", e);
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        shipping: order.shipping,
        subtotal: order.subtotal,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      },
      shippingNote: shippingCalc.note,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid order data" },
        { status: 400 }
      );
    }
    console.error("Create order error:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const orders = await prisma.order.findMany({
      where: isAdmin ? undefined : { userId: session.user.id },
      include: { items: true, user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("List orders error:", err);
    return NextResponse.json(
      { error: "Failed to list orders" },
      { status: 500 }
    );
  }
}
