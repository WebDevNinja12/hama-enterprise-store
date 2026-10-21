import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOpayCallbackSignature } from "@/lib/opay";
import {
  sendEmail,
  orderStatusEmailHtml,
  orderStatusSubject,
} from "@/lib/email";

/**
 * OPay payment notification (webhook).
 * Configure this URL in OPay merchant dashboard:
 *   https://hama-enterprise-store.vercel.app/api/webhooks/opay
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const signature =
      (req.headers.get("signature") ||
        req.headers.get("Authorization") ||
        (body.sign as string) ||
        "") as string;

    // In production require valid signature when secret is set
    if (process.env.OPAY_SECRET_KEY) {
      const ok = verifyOpayCallbackSignature(body, signature.replace(/^Bearer\s+/i, ""));
      // Some OPay payloads nest payload under `payload` / `data`
      const nested =
        (body.payload as Record<string, unknown>) ||
        (body.data as Record<string, unknown>) ||
        body;
      const okNested = verifyOpayCallbackSignature(nested, signature.replace(/^Bearer\s+/i, ""));
      if (!ok && !okNested) {
        console.warn("[opay webhook] invalid signature");
        // Still accept if reference matches pending order in sandbox only
        if ((process.env.OPAY_ENV || "sandbox") === "live") {
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      }
    }

    const data =
      (body.data as Record<string, unknown>) ||
      (body.payload as Record<string, unknown>) ||
      body;

    const reference = String(
      data.reference || data.outOrderNo || body.reference || ""
    );
    const status = String(
      data.status || data.orderStatus || body.status || ""
    ).toUpperCase();

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: reference }, { paymentReference: reference }],
      },
    });

    if (!order) {
      console.warn("[opay webhook] unknown reference", reference);
      return NextResponse.json({ ok: true, ignored: true });
    }

    const paid =
      status === "SUCCESS" ||
      status === "SUCCESSFUL" ||
      status === "PAID" ||
      status === "COMPLETED";

    if (paid && order.status === "PENDING") {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PROCESSING",
          paymentReference: reference,
          paymentMethod: "opay",
        },
      });

      const baseUrl =
        process.env.NEXTAUTH_URL ||
        "https://hama-enterprise-store.vercel.app";

      if (updated.customerEmail) {
        sendEmail({
          to: updated.customerEmail,
          subject: orderStatusSubject(updated.orderNumber, "PROCESSING"),
          html: orderStatusEmailHtml({
            orderNumber: updated.orderNumber,
            status: "PROCESSING",
            customerName: updated.shippingName,
            accountUrl: `${baseUrl}/account`,
          }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[opay webhook]", e);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: "HAMA OPay webhook",
    ok: true,
  });
}
