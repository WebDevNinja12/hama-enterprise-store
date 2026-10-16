import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { resetPasswordEmailHtml, sendEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

const RESET_TTL_MS = 90_000; // 90 seconds

/**
 * Password reset email is ALWAYS sent to the user's own email address — never admin.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: raw } = schema.parse(body);
    const email = raw.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return NextResponse.json({
        ok: true,
        message:
          "If an account exists for that email, a reset link was sent to that address only. It expires in 90 seconds.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + RESET_TTL_MS);

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

    const base =
      process.env.NEXTAUTH_URL ||
      process.env.AUTH_URL ||
      "https://hama-enterprise-store.vercel.app";
    const resetUrl = `${base.replace(/\/$/, "")}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Send ONLY to the user who requested the reset
    const sent = await sendEmail({
      to: email,
      subject: "Reset your HAMA ENTERPRISE NG password (90s)",
      html: resetPasswordEmailHtml(resetUrl),
      text: `Reset your password (expires in 90 seconds): ${resetUrl}`,
    });

    if (!sent.ok) {
      await prisma.verificationToken.deleteMany({ where: { token } });
      return NextResponse.json(
        {
          error:
            sent.error ||
            "Could not send email. Configure RESEND_API_KEY on Vercel.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Reset link sent to ${email}. Open it within 90 seconds.`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
