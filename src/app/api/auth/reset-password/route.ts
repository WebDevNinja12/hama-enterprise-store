import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: raw, token, password } = schema.parse(body);
    const email = raw.toLowerCase().trim();

    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (
      !record ||
      record.identifier !== `reset:${email}` ||
      record.expires < new Date()
    ) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Request a new one." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email },
      data: { password: hashed },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({
      ok: true,
      message: "Password updated. You can sign in now.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data. Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
