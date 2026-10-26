import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_LOGO =
  "https://raw.githubusercontent.com/WebDevNinja12/hama-enterprise-store/main/logo.png";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let image = user.image;
    if (user.role === "ADMIN" && (!image || image.startsWith("data:"))) {
      image = ADMIN_LOGO;
    }

    return NextResponse.json({
      user: {
        ...user,
        image,
        hasCustomImage: Boolean(user.image && user.image.startsWith("data:")),
      },
    });
  } catch (err) {
    console.error("Get account error:", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

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
      if (body.image.startsWith("data:") && body.image.length > 800_000) {
        return NextResponse.json(
          { error: "Image too large (max ~600KB). Use a smaller photo." },
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

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasCustomImage: Boolean(user.image && user.image.startsWith("data:")),
        image:
          user.image &&
          !user.image.startsWith("data:") &&
          user.image.length < 500
            ? user.image
            : user.role === "ADMIN"
              ? ADMIN_LOGO
              : null,
      },
    });
  } catch (err) {
    console.error("Update account error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

/** Delete own account — detach orders, remove related rows first */
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const userId = session.user.id;

    // Admins should not self-delete via this path without care
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (me?.role === "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Admin accounts cannot be deleted here. Contact a system operator.",
        },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: { userId },
        data: { userId: null },
      });
      await tx.cartItem.deleteMany({ where: { userId } });
      await tx.review.deleteMany({ where: { userId } });
      await tx.adminDeviceSession.deleteMany({ where: { userId } }).catch(() => {});
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ ok: true, message: "Account deleted" });
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json(
      { error: "Failed to delete account. You may still have linked data." },
      { status: 500 }
    );
  }
}
