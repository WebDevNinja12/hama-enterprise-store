import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email().max(200),
});

async function ensureColumn() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false`
    );
  } catch {
    /* */
  }
}

/** Current admin profile */
export async function GET() {
  try {
    await ensureColumn();
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user,
      suggestedEmail: "hamaenterprisestore01@gmail.com",
    });
  } catch (err) {
    console.error("[admin/profile GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** Change admin email (logged-in admin only) */
export async function PATCH(req: Request) {
  try {
    await ensureColumn();
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { email } = emailSchema.parse(body);
    const nextEmail = email.toLowerCase().trim();

    const taken = await prisma.user.findFirst({
      where: {
        email: nextEmail,
        id: { not: session.user.id },
      },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json(
        { error: "That email is already used by another account" },
        { status: 409 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email: nextEmail,
        emailVerified: new Date(),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({
      ok: true,
      message: `Admin email updated to ${user.email}. Sign in with this email next time.`,
      user,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    console.error("[admin/profile PATCH]", err);
    return NextResponse.json(
      { error: "Could not update email", detail: String(err) },
      { status: 500 }
    );
  }
}
