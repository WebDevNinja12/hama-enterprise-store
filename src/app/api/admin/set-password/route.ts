import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  newPassword: z.string().min(8).max(128),
  currentPassword: z.string().optional(),
});

/**
 * First login / forced password set for admin.
 * If mustChangePassword is true, currentPassword is not required.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { newPassword, currentPassword } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.mustChangePassword) {
      // Normal change requires current password
      if (!currentPassword || !user.password) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        mustChangePassword: false,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Password saved. You can use this password for future admin logins.",
      email: user.email,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    console.error("[admin/set-password]", err);
    return NextResponse.json({ error: "Could not set password" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ mustChangePassword: false }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mustChangePassword: true, email: true },
    });
    return NextResponse.json({
      mustChangePassword: Boolean(user?.mustChangePassword),
      email: user?.email,
    });
  } catch {
    return NextResponse.json({ mustChangePassword: false });
  }
}
