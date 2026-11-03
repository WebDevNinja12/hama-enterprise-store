import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  MAX_ADMIN_DEVICES,
  clientIpFromHeaders,
  deviceLabelFromUa,
  ensureAdminDeviceTables,
  isDeviceBlocked,
  notifyAdminSecurity,
  securityAlertHtml,
} from "@/lib/admin-devices";
import {
  checkLoginAllowed,
  recordLoginFailure,
  clearLoginFailures,
} from "@/lib/login-rate-limit";

function randomSessionId() {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function randomCuidLike() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** Hard-clear every open admin device row (Prisma + raw SQL fallback). */
async function resetAllDeviceSessions(userId: string) {
  try {
    await prisma.adminDeviceSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch (e) {
    console.warn("[admin/login] prisma revoke failed, using SQL", e);
  }
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "AdminDeviceSession" SET "revokedAt" = CURRENT_TIMESTAMP WHERE "userId" = $1 AND "revokedAt" IS NULL`,
      userId
    );
  } catch (e) {
    console.warn("[admin/login] SQL revoke failed", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureAdminDeviceTables();

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "")
      .toLowerCase()
      .trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const ip = clientIpFromHeaders(req.headers);
    const userAgent = req.headers.get("user-agent") || "";
    const limitKey = `admin:${email}`;

    const allowed = await checkLoginAllowed(limitKey);
    if (!allowed.ok) {
      return NextResponse.json(
        { error: "Too many failed attempts. Wait 5 minutes.", code: "LOCKED" },
        { status: 429 }
      );
    }

    if (await isDeviceBlocked(ip, userAgent || null)) {
      await notifyAdminSecurity({
        subject: "[HAMA] Blocked device tried admin login",
        html: securityAlertHtml({
          title: "Blocked device login attempt",
          email,
          ip,
          userAgent: userAgent || "(none)",
          when: new Date().toISOString(),
          extra: "This IP/device is on the admin block list.",
        }),
        text: `Blocked admin login from ${ip} for ${email}`,
      });
      return NextResponse.json(
        {
          error: "This device or network is blocked from admin access.",
          code: "DEVICE_BLOCKED",
        },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        name: true,
      },
    });

    if (!user?.password || user.role !== "ADMIN") {
      await recordLoginFailure(limitKey);
      return NextResponse.json(
        { error: "Invalid admin credentials.", code: "INVALID" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await recordLoginFailure(limitKey);
      return NextResponse.json(
        { error: "Invalid admin credentials.", code: "INVALID" },
        { status: 401 }
      );
    }

    await clearLoginFailures(limitKey);

    // Fresh start: always wipe previous device sessions on successful password.
    // (Prevents permanent lockout when cookies expired but DB rows remained.)
    await resetAllDeviceSessions(user.id);

    const sessionId = randomSessionId();
    const label = deviceLabelFromUa(userAgent);

    try {
      await prisma.adminDeviceSession.create({
        data: {
          id: randomCuidLike(),
          userId: user.id,
          sessionId,
          userAgent: userAgent.slice(0, 500) || null,
          ip,
          deviceLabel: label,
        },
      });
    } catch (e) {
      console.warn("[admin/login] prisma create failed, using SQL", e);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "AdminDeviceSession" (id, "userId", "sessionId", "userAgent", ip, "deviceLabel", "lastActiveAt", "createdAt", "revokedAt")
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL)`,
        randomCuidLike(),
        user.id,
        sessionId,
        userAgent.slice(0, 500) || null,
        ip,
        label
      );
    }

    return NextResponse.json({
      ok: true,
      sessionId,
      email: user.email,
      active: 1,
      max: MAX_ADMIN_DEVICES,
      reset: true,
      message: "Previous admin devices signed out. Fresh session created.",
    });
  } catch (err) {
    console.error("[admin/login]", err);
    return NextResponse.json(
      { error: "Login failed. Try again.", detail: String(err) },
      { status: 500 }
    );
  }
}
