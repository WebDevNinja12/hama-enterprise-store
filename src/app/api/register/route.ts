import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { otpEmailHtml, sendEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    const email = parsed.email.toLowerCase().trim();
    const name = parsed.name.trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.emailVerified) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    // If unverified account exists, update password/name and resend OTP
    const hashed = await bcrypt.hash(parsed.password, 12);

    if (existing && !existing.emailVerified) {
      await prisma.user.update({
        where: { email },
        data: { name, password: hashed },
      });
    } else if (!existing) {
      await prisma.user.create({
        data: {
          name,
          email,
          password: hashed,
          role: "USER",
          emailVerified: null,
        },
      });
    }

    const otp = generateOtp();
    const expires = new Date(Date.now() + OTP_TTL_MS);

    await prisma.verificationToken.deleteMany({
      where: { identifier: `otp:${email}` },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: `otp:${email}`,
        token: otp,
        expires,
      },
    });

    // OTP email goes ONLY to the registering user
    const sent = await sendEmail({
      to: email,
      subject: "Your HAMA ENTERPRISE NG verification code",
      html: otpEmailHtml(otp, "Verify your email"),
      text: `Your HAMA verification code is ${otp}. It expires in 10 minutes.`,
    });

    if (!sent.ok) {
      return NextResponse.json(
        {
          error:
            sent.error ||
            "Could not send verification email. Check RESEND_API_KEY.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      requiresOtp: true,
      email,
      message: `We sent a 6-digit code to ${email}. Enter it to finish registration.`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.errors[0]?.message || "Invalid data";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
