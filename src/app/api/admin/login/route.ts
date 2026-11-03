import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  clientIpFromHeaders,
  deviceLabelFromUa,
  ensureAdminDeviceTables,
} from "@/lib/admin-devices";
import {
  checkLoginAllowed,
  recordLoginFailure,
  clearLoginFailures,
} from "@/lib/login-rate-limit";
import { randomBytes } from "crypto";

function randomSessionId() {
  return randomBytes(24).toString("hex");
}

async function wipeEverything() {
  try {
    await prisma.blockedAdminDevice.deleteMany({});
  } catch {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "BlockedAdminDevice"`);
    } catch {
      /* */
    }
  }
  try {
    await prisma.adminDeviceSession.deleteMany({});
  } catch {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "AdminDeviceSession"`);
    } catch {
      /* */
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureAdminDeviceTables().catch(() => {});

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").toLowerCase().trim();
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

    // Do NOT check isDeviceBlocked here — unblocks happen on successful password

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, role: true, name: true },
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

    // Fresh start: clear block list + every device session
    await wipeEverything();

    const sessionId = randomSessionId();
    const label = deviceLabelFromUa(userAgent);
    const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

    try {
      await prisma.adminDeviceSession.create({
        data: {
          id,
          userId: user.id,
          sessionId,
          userAgent: userAgent.slice(0, 500) || null,
          ip,
          deviceLabel: label,
        },
      });
    } catch {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "AdminDeviceSession" (id, "userId", "sessionId", "userAgent", ip, "deviceLabel", "lastActiveAt", "createdAt")
           VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
          id,
          user.id,
          sessionId,
          userAgent.slice(0, 500) || null,
          ip,
          label
        );
      } catch (e) {
        console.warn("[admin/login] device row optional", e);
      }
    }

    return NextResponse.json({
      ok: true,
      sessionId,
      email: user.email,
      active: 1,
      reset: true,
      unblocked: true,
      message: "All blocks and device sessions cleared. Fresh session created.",
    });
  } catch (err) {
    console.error("[admin/login]", err);
    return NextResponse.json(
      { error: "Login failed. Try again.", detail: String(err) },
      { status: 500 }
    );
  }
}
