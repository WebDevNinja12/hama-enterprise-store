import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  secret: z.string().min(8),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const bootstrap = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!bootstrap) {
    return NextResponse.json(
      { error: "Bootstrap disabled. Set ADMIN_BOOTSTRAP_SECRET on Vercel." },
      { status: 403 }
    );
  }
  try {
    const data = bodySchema.parse(await req.json());
    if (data.secret !== bootstrap) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }
    const email = data.email.toLowerCase().trim();
    const hash = await bcrypt.hash(data.password, 12);
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hash,
          role: "ADMIN",
          emailVerified: new Date(),
          lastActiveAt: new Date(),
        },
      });
    } else {
      await prisma.user.create({
        data: {
          email,
          name: "Admin",
          password: hash,
          role: "ADMIN",
          emailVerified: new Date(),
        },
      });
    }
    return NextResponse.json({
      ok: true,
      message:
        "Admin ready. Login at /admin/login then remove ADMIN_BOOTSTRAP_SECRET.",
      email,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.errors[0]?.message || "Invalid" },
        { status: 400 }
      );
    }
    console.error("[bootstrap]", e);
    return NextResponse.json(
      { error: "Bootstrap failed. Check DATABASE_URL." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    enabled: Boolean(process.env.ADMIN_BOOTSTRAP_SECRET),
  });
}
