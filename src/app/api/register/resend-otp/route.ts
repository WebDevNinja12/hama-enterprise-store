import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { otpEmailHtml, sendEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

const OTP_TTL_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: raw } = schema.parse(body);
    const email = raw.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified. Please sign in." },
        { status: 400 }
      );
    }

    const otp = String(crypto.randomInt(100000, 999999));
    const expires = new Date(Date.now() + OTP_TTL_MS);

    await prisma.verificationToken.deleteMany({
      where: { identifier: `otp:${email}` },
    });
    await prisma.verificationToken.create({
      data: { identifier: `otp:${email}`, token: otp, expires },
    });

    const sent = await sendEmail({
      to: email,
      subject: "Your HAMA ENTERPRISE NG verification code",
      html: otpEmailHtml(otp, "Verify your email"),
      text: `Your HAMA verification code is ${otp}. It expires in 10 minutes.`,
    });

    if (!sent.ok) {
      return NextResponse.json(
        { error: sent.error || "Could not send email" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `A new code was sent to ${email}.`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    console.error("Resend OTP error:", err);
    return NextResponse.json({ error: "Failed to resend" }, { status: 500 });
  }
}
