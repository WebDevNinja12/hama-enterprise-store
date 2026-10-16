import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: raw, otp } = schema.parse(body);
    const email = raw.toLowerCase().trim();
    const code = otp.trim();

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
