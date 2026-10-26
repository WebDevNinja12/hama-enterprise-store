import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { otpEmailHtml, sendEmail } from "@/lib/email";
import { rateLimitIncr } from "@/lib/redis";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email").max(200),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .refine(
      (p) => /[A-Za-z]/.test(p) && /[0-9]/.test(p),
      "Password must include at least one letter and one number"
    ),
});

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = await rateLimitIncr(`register:${ip}`, 8, 60 * 60);
    if (!rl.ok) {
      return NextResponse.json(
        {
          error:
            "Too many registration attempts from this network. Try again later.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = schema.parse(body);
    const email = parsed.email.toLowerCase().trim();
    const name = parsed.name.trim();

    // Never allow creating ADMIN via public register
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.role === "ADMIN") {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }
    if (existing && existing.emailVerified) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(parsed.password, 12);

    if (existing && !existing.emailVerified) {
      await prisma.user.update({
        where: { email },
        data: { name, password: hashed, role: "USER" },
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

    const emailRl = await rateLimitIncr(`register-otp:${email}`, 5, 60 * 60);
    if (!emailRl.ok) {
      return NextResponse.json(
        { error: "Too many codes requested for this email. Try later." },
        { status: 429 }
      );
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
            "Could not send verification email. Please try again shortly.",
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
