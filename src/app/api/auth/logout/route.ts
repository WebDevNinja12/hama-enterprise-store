import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyClearAuthCookies } from "@/lib/clear-auth-cookies";

/**
 * Full logout: revoke admin device session (if any) and clear every auth cookie.
 * Cookies never hold passwords — only a short-lived session token.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (session?.user?.id && session.user.role === "ADMIN") {
      // Revoke all active device sessions for this admin on explicit logout
      // (frees a device slot). Optional query ?all=0 keeps others.
      const all = new URL(req.url).searchParams.get("all") !== "0";
      if (all) {
        await prisma.adminDeviceSession
          .updateMany({
            where: { userId: session.user.id, revokedAt: null },
            data: { revokedAt: new Date() },
          })
          .catch(() => {});
      }
    }
  } catch (e) {
    console.error("[logout]", e);
  }

  const res = NextResponse.json({
    ok: true,
    message: "Signed out. Session cookies cleared.",
  });
  return applyClearAuthCookies(res);
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/auth/logout — clears session cookies",
  });
}
