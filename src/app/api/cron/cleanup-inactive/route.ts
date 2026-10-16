import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Deletes non-admin users inactive for 6+ months.
 * Call via Vercel Cron or manually with Authorization: Bearer CRON_SECRET
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET;

    if (secret && authHeader !== `Bearer ${secret}`) {
      // Allow if no secret set in dev, but prefer secret in production
      if (process.env.NODE_ENV === "production" && secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await prisma.user.deleteMany({
      where: {
        role: { not: "ADMIN" },
        lastActiveAt: { lt: sixMonthsAgo },
      },
    });

    return NextResponse.json({
      ok: true,
      deleted: result.count,
      cutoff: sixMonthsAgo.toISOString(),
    });
  } catch (err) {
    console.error("Cleanup inactive error:", err);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
