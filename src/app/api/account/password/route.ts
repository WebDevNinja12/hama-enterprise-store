import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

/** Change password while logged in */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user?.password) {
      return NextResponse.json(
        { error: "Password login is not set for this account" },
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

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ ok: true, message: "Password updated" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }
    console.error("Change password error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
