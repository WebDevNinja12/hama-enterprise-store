import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyClearAuthCookies } from "@/lib/clear-auth-cookies";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.id) {
      try {
        await prisma.adminDeviceSession.updateMany({
          where: { userId: session.user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      } catch {
        /* ignore */
      }
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "AdminDeviceSession" SET "revokedAt" = CURRENT_TIMESTAMP WHERE "userId" = $1 AND "revokedAt" IS NULL`,
          session.user.id
        );
      } catch {
        /* ignore */
      }
    }
  } catch (e) {
    console.error("[logout]", e);
  }

  const res = NextResponse.json({
    ok: true,
    message: "Signed out. Session cookies cleared. Admin devices deactivated.",
  });
  return applyClearAuthCookies(res);
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/auth/logout — clears session cookies and admin devices",
  });
}
