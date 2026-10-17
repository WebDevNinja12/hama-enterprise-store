import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_LOGO =
  "https://raw.githubusercontent.com/WebDevNinja12/hama-enterprise-store/main/logo.png";

/** Get profile including full image (data URL stays out of cookies) */
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let image = user.image;
    if (!image && user.role === "ADMIN") {
      image = ADMIN_LOGO;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Get account error:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

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
      // Cap data URLs so DB does not grow unbounded
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

    // Do NOT return the full data URL to be put into session.update()
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasCustomImage: Boolean(user.image && user.image.startsWith("data:")),
        // short safe image for session only
        image:
          user.image && !user.image.startsWith("data:") && user.image.length < 500
            ? user.image
            : user.role === "ADMIN"
              ? ADMIN_LOGO
              : null,
      },
    });
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
