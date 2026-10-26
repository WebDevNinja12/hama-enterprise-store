import { prisma } from "./prisma";
import { SESSION } from "./session-config";
import { sendEmail } from "./email";

export const MAX_ADMIN_DEVICES = SESSION.MAX_ADMIN_DEVICES;

export function clientIpFromHeaders(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export function deviceLabelFromUa(ua: string | null): string {
  if (!ua) return "Unknown device";
  const s = ua.slice(0, 180);
  if (/Mobile|Android|iPhone/i.test(s)) return `Mobile · ${s.slice(0, 60)}`;
  if (/Edg\//i.test(s)) return `Edge · ${s.slice(0, 60)}`;
  if (/Chrome\//i.test(s)) return `Chrome · ${s.slice(0, 60)}`;
  if (/Firefox\//i.test(s)) return `Firefox · ${s.slice(0, 60)}`;
  if (/Safari\//i.test(s)) return `Safari · ${s.slice(0, 60)}`;
  return s.slice(0, 80);
}

/** Ensure admin device tables exist on fresh DBs. */
export async function ensureAdminDeviceTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AdminDeviceSession" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "sessionId" TEXT NOT NULL UNIQUE,
      "userAgent" TEXT,
      ip TEXT,
      "deviceLabel" TEXT,
      "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "revokedAt" TIMESTAMP(3)
    )`);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "AdminDeviceSession_userId_revokedAt_idx" ON "AdminDeviceSession" ("userId", "revokedAt")`
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BlockedAdminDevice" (
      id TEXT PRIMARY KEY,
      ip TEXT,
      "userAgent" TEXT,
      reason TEXT,
      "createdBy" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "BlockedAdminDevice_ip_idx" ON "BlockedAdminDevice" (ip)`
  );
}

export async function isDeviceBlocked(ip: string, userAgent: string | null) {
  const rows = await prisma.blockedAdminDevice.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
  });
  return rows.some((r) => {
    if (r.ip && r.ip === ip) return true;
    if (r.userAgent && userAgent && r.userAgent === userAgent) return true;
    return false;
  });
}

export async function countActiveAdminSessions(userId: string) {
  return prisma.adminDeviceSession.count({
    where: { userId, revokedAt: null },
  });
}

export async function notifyAdminSecurity(opts: {
  subject: string;
  html: string;
  text: string;
}) {
  const to =
    process.env.ADMIN_NOTIFY_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "admin@hamaenterprise.ng";
  try {
    await sendEmail({
      to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
  } catch (e) {
    console.error("[admin-devices] notify failed:", e);
  }
}

export function securityAlertHtml(details: {
  title: string;
  email: string;
  ip: string;
  userAgent: string;
  when: string;
  extra?: string;
}) {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0a0e17;color:#e8eef7;border-radius:12px;">
    <h1 style="color:#f87171;font-size:18px;">${details.title}</h1>
    <p style="color:#94a3b8;line-height:1.5;">A blocked or limited admin login attempt was recorded.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#cbd5e1;">
      <tr><td style="padding:6px 0;color:#64748b;">Account</td><td>${details.email}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">IP</td><td>${details.ip}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Device</td><td style="word-break:break-all;">${details.userAgent}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Time</td><td>${details.when}</td></tr>
      ${details.extra ? `<tr><td style="padding:6px 0;color:#64748b;">Note</td><td>${details.extra}</td></tr>` : ""}
    </table>
    <p style="color:#64748b;font-size:12px;margin-top:16px;">Review devices in Admin → Security. You can revoke sessions or block this IP/device.</p>
  </div>`;
}
