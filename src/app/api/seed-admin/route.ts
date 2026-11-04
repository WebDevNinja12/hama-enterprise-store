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
    return req.headers.get("x-bootstrap-secret") === secret;
  }
  const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (secret) {
    return req.headers.get("x-bootstrap-secret") === secret;
  }
  return process.env.NODE_ENV !== "production";
}

async function ensureMustChangeColumn() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false`
    );
  } catch {
    /* column may already exist */
  }
}

export async function POST(req: Request) {
  if (!setupAllowed(req)) {
    return NextResponse.json(
      {
        error:
          "Seed admin is disabled. Set ALLOW_SETUP=true and ADMIN_BOOTSTRAP_SECRET, then remove them after setup.",
      },
      { status: 403 }
    );
  }

  try {
    await ensureMustChangeColumn();

    // Temporary password only if ADMIN_SEED_PASSWORD is set; otherwise random one-time
    const password =
      process.env.ADMIN_SEED_PASSWORD ||
      `Setup-${Math.random().toString(36).slice(2, 10)}!A1`;
    const hashed = await bcrypt.hash(password, 12);

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
      existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });
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
          mustChangePassword: true,
        },
      });

      await prisma.user.updateMany({
        where: { role: "ADMIN", id: { not: existing.id } },
        data: { role: "USER" },
      });

      return NextResponse.json({
        ok: true,
        message:
          "Admin ready. Sign in with the email below, then you will be asked to set a new password.",
        email: ADMIN_EMAIL,
        temporaryPassword: password,
        mustChangePassword: true,
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
        mustChangePassword: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message:
        "Admin created. Sign in, then set your permanent password when prompted.",
      email: ADMIN_EMAIL,
      temporaryPassword: password,
      mustChangePassword: true,
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
