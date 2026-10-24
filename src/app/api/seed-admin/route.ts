import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "admin@hamaenterprise.ng";
const ADMIN_PASSWORD = "HamaAdmin2026!";

export async function POST() {
  try {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
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
        message: "Admin password reset and role set to ADMIN",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
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
      message: "Admin created. Change password after first login.",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      created: true,
      updated: false,
    });
  } catch (err) {
    console.error("Seed admin error:", err);
    return NextResponse.json(
      {
        error: "Failed to seed admin",
        detail: String(err),
        hint: "If tables missing, run prisma db push against DATABASE_URL",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ usage: "POST /api/seed-admin" });
}
