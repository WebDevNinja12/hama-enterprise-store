import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "hamaenterprisestore01@gmail.com"
)
  .toLowerCase()
  .trim();

const LEGACY_ADMIN_EMAILS = ["admin@hamaenterprise.ng"];

function setupAllowed(req: Request): boolean {
  if (process.env.ALLOW_SETUP === "true") {
    const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!secret) return false;
    const hdr = req.headers.get("x-bootstrap-secret");
    return hdr === secret;
  }
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

    // Prefer existing row: new email, then legacy emails, then any ADMIN
    let existing = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!existing) {
      for (const legacy of LEGACY_ADMIN_EMAILS) {
        existing = await prisma.user.findUnique({ where: { email: legacy } });
        if (existing) break;
      }
    }

    if (!existing) {
      existing = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
    }

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          email: ADMIN_EMAIL,
          role: "ADMIN",
          password: hashed,
          name: existing.name || "HAMA Admin",
          emailVerified: existing.emailVerified ?? new Date(),
        },
      });

      // Demote other accounts that still claim ADMIN (except this one)
      await prisma.user.updateMany({
        where: { role: "ADMIN", id: { not: existing.id } },
        data: { role: "USER" },
      });

      return NextResponse.json({
        ok: true,
        message:
          "Admin updated (email + password). Change password after login. Disable ALLOW_SETUP.",
        email: ADMIN_EMAIL,
        password,
        created: false,
        updated: true,
        previousEmail: existing.email,
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
    adminEmail: ADMIN_EMAIL,
    locked: process.env.ALLOW_SETUP !== "true",
  });
}
