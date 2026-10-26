import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimitIncr } from "@/lib/redis";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(8),
});

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email: raw, otp } = schema.parse(body);
    const email = raw.toLowerCase().trim();
    const code = otp.trim();

    const ip = clientIp(req);
    const rl = await rateLimitIncr(`verify-otp:${ip}:${email}`, 12, 15 * 60);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: `otp:${email}`,
        token: code,
      },
    });

    if (!record || record.expires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired code. Request a new one." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: `otp:${email}` },
      });
      return NextResponse.json({
        ok: true,
        message: "Email already verified. You can sign in.",
        email,
      });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.deleteMany({
      where: { identifier: `otp:${email}` },
    });

    return NextResponse.json({
      ok: true,
      message: "Email verified. You can sign in now.",
      email,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    console.error("Verify OTP error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
