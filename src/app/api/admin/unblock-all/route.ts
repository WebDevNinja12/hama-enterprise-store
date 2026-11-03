import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureAdminDeviceTables } from "@/lib/admin-devices";

/**
 * POST { email, password }
 * Clears ALL blocked devices and ALL admin device sessions for a valid admin.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureAdminDeviceTables().catch(() => {});

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Admin email and password required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, role: true },
    });

    if (!user?.password || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    let blockedCleared = 0;
    let sessionsCleared = 0;

    try {
      const b = await prisma.blockedAdminDevice.deleteMany({});
      blockedCleared = b.count;
    } catch {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "BlockedAdminDevice"`);
        blockedCleared = -1; // unknown count
      } catch (e) {
        console.warn("[unblock-all] blocked", e);
      }
    }

    try {
      const s = await prisma.adminDeviceSession.deleteMany({});
      sessionsCleared = s.count;
    } catch {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "AdminDeviceSession"`);
        sessionsCleared = -1;
      } catch (e) {
        console.warn("[unblock-all] sessions", e);
      }
    }

    // Also mark any remaining as revoked
    try {
      await prisma.adminDeviceSession.updateMany({
        where: { revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      /* */
    }

    return NextResponse.json({
      ok: true,
      message:
        "All blocked devices and admin device sessions cleared. You can sign in now.",
      blockedCleared,
      sessionsCleared,
    });
  } catch (err) {
    console.error("[unblock-all]", err);
    return NextResponse.json(
      { error: "Failed to clear devices", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/admin/unblock-all with { email, password } of an ADMIN",
  });
}
