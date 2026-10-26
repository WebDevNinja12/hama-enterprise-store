import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "admin@hamaenterprise.ng";

function setupAllowed(req: Request): boolean {
  // Production: only with explicit ALLOW_SETUP=true AND matching bootstrap secret
  if (process.env.ALLOW_SETUP === "true") {
    const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!secret) return false;
    const hdr = req.headers.get("x-bootstrap-secret");
    return hdr === secret;
  }
  // Non-production may use secret alone
  const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (secret) {
    return req.headers.get("x-bootstrap-secret") === secret;
  }
  return process.env.NODE_ENV !== "production";
}

export async function POST(req: Request) {
  if (!setupAllowed(req)) {
    return NextResponse.json(
      {
        error:
          "Seed admin is disabled. Set ALLOW_SETUP=true and ADMIN_BOOTSTRAP_SECRET only for emergency setup, then remove them.",
      },
      { status: 403 }
    );
  }

  try {
    const password =
      process.env.ADMIN_SEED_PASSWORD ||
      `Hama-${Math.random().toString(36).slice(2, 10)}!9`;
    const hashed = await bcrypt.hash(password, 12);
    const existing = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existing) {
      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          role: "ADMIN",
          password: hashed,
          name: existing.name || "HAMA Admin",
          emailVerified: existing.emailVerified ?? new Date(),
        },
      });
      return NextResponse.json({
        ok: true,
        message:
          "Admin password reset. Change it after login. Disable ALLOW_SETUP.",
        email: ADMIN_EMAIL,
        password,
        created: false,
        updated: true,
      });
    }

    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "HAMA Admin",
        password: hashed,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Admin created. Change password after login. Disable ALLOW_SETUP.",
      email: ADMIN_EMAIL,
      password,
      created: true,
    });
  } catch (err) {
    console.error("Seed admin error:", err);
    return NextResponse.json(
      { error: "Failed to seed admin", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/seed-admin",
    locked: process.env.ALLOW_SETUP !== "true",
  });
}
