import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, stockMaxEmailHtml } from "@/lib/email";

const schema = z.object({
  productName: z.string().min(1),
  productId: z.string().optional(),
  stock: z.number().int().min(0),
  reason: z.enum(["max_reached", "out_of_stock"]).optional(),
});

/** Notify all admins when a product hits max / out of stock */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });

    const emails = admins.map((a) => a.email).filter(Boolean);
    const fallback = process.env.ADMIN_NOTIFY_EMAIL;
    if (fallback) emails.push(fallback);

    const unique = [...new Set(emails)];
    if (unique.length === 0) {
      console.warn("[stock] No admin emails to notify");
      return NextResponse.json({ ok: true, notified: 0 });
    }

    const subject =
      data.stock <= 0
        ? `Sold out: ${data.productName}`
        : `Stock max reached: ${data.productName}`;

    let sent = 0;
    for (const to of unique) {
      const r = await sendEmail({
        to,
        subject,
        html: stockMaxEmailHtml(data.productName, data.stock),
        text: `${data.productName} stock is ${data.stock}. Reason: ${data.reason || "max"}`,
      });
      if (r.ok) sent++;
    }

    return NextResponse.json({ ok: true, notified: sent });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    console.error("Stock notify error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
