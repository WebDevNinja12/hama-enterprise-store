import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureAdminDeviceTables } from "@/lib/admin-devices";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureAdminDeviceTables();

    const [devices, blocked] = await Promise.all([
      prisma.adminDeviceSession.findMany({
        where: { userId: session.user.id },
        orderBy: { lastActiveAt: "desc" },
        take: 50,
      }),
      prisma.blockedAdminDevice.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      devices: devices.map((d) => ({
        id: d.id,
        sessionId: d.sessionId,
        deviceLabel: d.deviceLabel,
        ip: d.ip,
        userAgent: d.userAgent,
        lastActiveAt: d.lastActiveAt,
        createdAt: d.createdAt,
        active: !d.revokedAt,
        revokedAt: d.revokedAt,
      })),
      blocked,
      maxDevices: 3,
    });
  } catch (err) {
    console.error("[admin/devices GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureAdminDeviceTables();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const blockId = searchParams.get("blockId");

    if (blockId) {
      await prisma.blockedAdminDevice.delete({
        where: { id: blockId },
      });
      return NextResponse.json({ ok: true, removed: "block" });
    }

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await prisma.adminDeviceSession.updateMany({
      where: { id, userId: session.user.id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ ok: true, revoked: true });
  } catch (err) {
    console.error("[admin/devices DELETE]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await ensureAdminDeviceTables();

    const body = await req.json();
    const action = String(body.action || "");

    if (action === "block") {
      const ip = body.ip ? String(body.ip).slice(0, 80) : null;
      const userAgent = body.userAgent
        ? String(body.userAgent).slice(0, 500)
        : null;
      const reason = body.reason
        ? String(body.reason).slice(0, 200)
        : "Blocked by admin";

      if (!ip && !userAgent) {
        return NextResponse.json(
          { error: "Provide ip and/or userAgent" },
          { status: 400 }
        );
      }

      const row = await prisma.blockedAdminDevice.create({
        data: {
          ip,
          userAgent,
          reason,
          createdBy: session.user.email || session.user.id,
        },
      });

      // Revoke matching active sessions
      if (ip) {
        await prisma.adminDeviceSession.updateMany({
          where: { ip, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return NextResponse.json({ ok: true, blocked: row });
    }

    if (action === "revoke-all-others") {
      const currentSid = body.currentSessionId
        ? String(body.currentSessionId)
        : null;
      await prisma.adminDeviceSession.updateMany({
        where: {
          userId: session.user.id,
          revokedAt: null,
          ...(currentSid ? { sessionId: { not: currentSid } } : {}),
        },
        data: { revokedAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[admin/devices POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
