import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: raw } = schema.parse(body);
    const email = raw.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });

    // Always same outer message to avoid email enumeration in production messaging;
    // for this store (no email SMTP yet) we return a token when the account exists.
    if (!user || !user.password) {
      return NextResponse.json({
        ok: true,
        message:
          "If an account exists for that email, you can reset the password.",
        found: false,
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Clear old tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${email}` },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token,
        expires,
      },
    });

    return NextResponse.json({
      ok: true,
      found: true,
      message: "Reset link created. Use it within 1 hour.",
      // Without email delivery configured, return the path so the user can continue.
      resetPath: `/reset-password?token=${token}&email=${encodeURIComponent(email)}`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
