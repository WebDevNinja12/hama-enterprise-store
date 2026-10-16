import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { cartReminderEmailHtml, sendEmail } from "@/lib/email";

const schema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        daysLeft: z.number().int().min(0).max(7),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Sign in to receive cart reminders" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items } = schema.parse(body);

    // Only remind for 1–2 days left
    const due = items.filter((i) => i.daysLeft >= 1 && i.daysLeft <= 2);
    if (due.length === 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const base =
      process.env.NEXTAUTH_URL ||
      process.env.AUTH_URL ||
      "https://hama-enterprise-store.vercel.app";
    const cartUrl = `${base.replace(/\/$/, "")}/cart`;

    const result = await sendEmail({
      to: session.user.email,
      subject: "Your HAMA cart expires soon",
      html: cartReminderEmailHtml(due, cartUrl),
      text: `Cart items expiring soon: ${due.map((i) => i.name).join(", ")}. Visit ${cartUrl}`,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, sent: due.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    console.error("Cart remind error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
