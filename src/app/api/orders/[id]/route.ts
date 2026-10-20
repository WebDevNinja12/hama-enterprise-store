import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";
import {
  sendEmail,
  orderStatusEmailHtml,
  orderStatusSubject,
} from "@/lib/email";

const statusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { status, notes } = statusSchema.parse(body);

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existing.status === "DELIVERED") {
      return NextResponse.json(
        {
          error:
            "Delivered orders are final and cannot be reopened or changed.",
        },
        { status: 400 }
      );
    }

    const previousStatus = existing.status;

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: status as OrderStatus,
        ...(notes !== undefined ? { notes } : {}),
      },
      include: { items: true },
    });

    // Email customer when status actually changes
    if (status !== previousStatus && order.customerEmail) {
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.AUTH_URL ||
        "https://hama-enterprise-store.vercel.app";

      sendEmail({
        to: order.customerEmail,
        subject: orderStatusSubject(order.orderNumber, status),
        html: orderStatusEmailHtml({
          orderNumber: order.orderNumber,
          status,
          customerName: order.shippingName,
          accountUrl: `${baseUrl}/account`,
        }),
        text: `Order ${order.orderNumber} is now ${status}. View orders: ${baseUrl}/account`,
      }).catch((e) => console.error("[email] order status notify failed:", e));
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        notes: order.notes,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid status", details: err.errors },
        { status: 400 }
      );
    }
    console.error("Update order error:", err);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("Get order error:", err);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}
