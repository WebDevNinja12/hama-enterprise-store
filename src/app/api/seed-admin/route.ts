import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * One-time bootstrap: create default admin if missing.
 * POST /api/seed-admin
 * Safe to call multiple times — will not overwrite existing admin password.
 */
export async function POST() {
  try {
    const email = "admin@hamaenterprise.ng";
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      // Ensure role is ADMIN
      if (existing.role !== "ADMIN") {
        await prisma.user.update({
          where: { email },
          data: { role: "ADMIN" },
        });
      }
      return NextResponse.json({
        ok: true,
        message: "Admin already exists",
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
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Admin account created",
      email,
      password,
      created: true,
    });
  } catch (err) {
    console.error("Seed admin error:", err);
    return NextResponse.json(
      { error: "Failed to seed admin" },
      { status: 500 }
    );
  }
}
