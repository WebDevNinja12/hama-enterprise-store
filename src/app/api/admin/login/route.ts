import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  MAX_ADMIN_DEVICES,
  clientIpFromHeaders,
  deviceLabelFromUa,
  ensureAdminDeviceTables,
  isDeviceBlocked,
  countActiveAdminSessions,
  pruneStaleAdminSessions,
  revokeAllAdminSessions,
  revokeOldestAdminSession,
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

export async function POST(req: NextRequest) {
  try {
    await ensureAdminDeviceTables();

    const body = await req.json();
    const email = String(body.email || "")
      .toLowerCase()
      .trim();
    const password = String(body.password || "");
    /** If true and password is valid, revoke every device then sign in */
    const forceClearDevices = Boolean(body.forceClearDevices);

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

    // Cookies may have expired while DB still listed old devices — free those slots
    const pruned = await pruneStaleAdminSessions(user.id);

    if (forceClearDevices) {
      await revokeAllAdminSessions(user.id);
    }

    let active = await countActiveAdminSessions(user.id);

    if (active >= MAX_ADMIN_DEVICES) {
      // Still full after prune: drop the oldest to allow this legitimate password login
      await revokeOldestAdminSession(user.id);
      active = await countActiveAdminSessions(user.id);
    }

    if (active >= MAX_ADMIN_DEVICES) {
      await notifyAdminSecurity({
        subject: "[HAMA] Admin login blocked — device limit (3)",
        html: securityAlertHtml({
          title: "Admin device limit reached",
          email: user.email,
          ip,
          userAgent: userAgent || "(none)",
          when: new Date().toISOString(),
          extra: `Already ${active} active sessions (max ${MAX_ADMIN_DEVICES}).`,
        }),
        text: `Admin login blocked for ${user.email} from ${ip}.`,
      });
      return NextResponse.json(
        {
          error: `Maximum ${MAX_ADMIN_DEVICES} admin devices are still active. Sign in again with "Clear other devices" or wait for sessions to expire.`,
          code: "DEVICE_LIMIT",
          active,
          max: MAX_ADMIN_DEVICES,
          pruned,
          canForceClear: true,
        },
        { status: 403 }
      );
    }

    const sessionId = randomSessionId();
    const label = deviceLabelFromUa(userAgent);

    await prisma.adminDeviceSession.create({
      data: {
        userId: user.id,
        sessionId,
        userAgent: userAgent.slice(0, 500) || null,
        ip,
        deviceLabel: label,
      },
    });

    return NextResponse.json({
      ok: true,
      sessionId,
      email: user.email,
      active: active + 1,
      max: MAX_ADMIN_DEVICES,
      pruned,
      forced: forceClearDevices,
    });
  } catch (err) {
    console.error("[admin/login]", err);
    return NextResponse.json(
      { error: "Login failed. Try again.", detail: String(err) },
      { status: 500 }
    );
  }
}
