import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Admin-only: permanently delete all orders and order items (order history). */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const deletedItems = await prisma.orderItem.deleteMany({});
    const deletedOrders = await prisma.order.deleteMany({});

    return NextResponse.json({
      ok: true,
      deletedOrders: deletedOrders.count,
      deletedItems: deletedItems.count,
      message: `Cleared ${deletedOrders.count} orders (${deletedItems.count} line items).`,
    });
  } catch (err) {
    console.error("Clear orders error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to clear orders" },
      { status: 500 }
    );
  }
}
