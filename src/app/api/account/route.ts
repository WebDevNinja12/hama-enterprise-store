import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Update profile (name, image) — any signed-in user */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await req.json();
    const data: { name?: string | null; image?: string | null } = {};

    if (typeof body.name === "string") {
      data.name = body.name.trim().slice(0, 80) || null;
    }
    if (body.image === null) {
      data.image = null;
    } else if (typeof body.image === "string") {
      if (body.image.startsWith("data:") && body.image.length > 2_500_000) {
        return NextResponse.json(
          { error: "Image too large (max ~2MB)" },
          { status: 400 }
        );
      }
      data.image = body.image;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true, image: true, role: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error("Update account error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

/** Delete own account — available to every signed-in customer */
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    await prisma.user.delete({ where: { id: session.user.id } });
    return NextResponse.json({ ok: true, message: "Account deleted" });
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
