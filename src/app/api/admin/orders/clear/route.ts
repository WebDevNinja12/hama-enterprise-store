import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1, "Select at least one order"),
});

/** Admin-only: delete selected orders (and their line items). */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const json = await req.json();
    const { orderIds } = bodySchema.parse(json);

    const deletedItems = await prisma.orderItem.deleteMany({
      where: { orderId: { in: orderIds } },
    });

    const deletedOrders = await prisma.order.deleteMany({
      where: { id: { in: orderIds } },
    });

    return NextResponse.json({
      ok: true,
      deletedOrders: deletedOrders.count,
      deletedItems: deletedItems.count,
      message: `Cleared ${deletedOrders.count} selected order(s).`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }
    console.error("Clear orders error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to clear orders" },
      { status: 500 }
    );
  }
}
