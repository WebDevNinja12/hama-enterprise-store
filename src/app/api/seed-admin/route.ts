import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Bootstrap / repair admin account.
 * POST /api/seed-admin
 * - Creates admin@hamaenterprise.ng if missing
 * - Ensures role=ADMIN and emailVerified set
 * - Does NOT reset password if admin already exists (use /api/admin/bootstrap for that)
 */
export async function POST() {
  try {
    const email = "admin@hamaenterprise.ng";
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.update({
        where: { email },
        data: {
          role: "ADMIN",
          emailVerified: existing.emailVerified ?? new Date(),
        },
      });
      return NextResponse.json({
        ok: true,
        message: "Admin already exists (role + verified ensured)",
        email,
        created: false,
      });
    }

    const password = "HamaAdmin2026!";
    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        name: "HAMA Admin",
        password: hashed,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Admin account created. Change password after first login.",
      email,
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
    usage: "POST /api/seed-admin to create default admin if missing",
  });
}
