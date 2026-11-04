import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128),
});

async function ensureColumn() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false`
    );
  } catch {
    /* ignore */
  }
}

/** Admin-only password change (Settings panel). */
export async function POST(req: Request) {
  try {
    await ensureColumn();

    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required. Sign in at /admin/login first." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        email: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    const force = Boolean(user.mustChangePassword);

    if (!force) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }
      if (!user.password) {
        return NextResponse.json(
          { error: "Password login is not configured for this account" },
          { status: 400 }
        );
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    if (currentPassword && currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from the current one" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashed,
          mustChangePassword: false,
        },
      });
    } catch {
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET password = $1, "mustChangePassword" = false WHERE id = $2`,
        hashed,
        user.id
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Password updated. Use the new password the next time you sign in at /admin/login.",
      email: user.email,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || "Invalid password" },
        { status: 400 }
      );
    }
    console.error("[admin/password]", err);
    return NextResponse.json(
      { error: "Could not update password", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    usage: "POST { currentPassword?, newPassword } — admin session required",
  });
}
