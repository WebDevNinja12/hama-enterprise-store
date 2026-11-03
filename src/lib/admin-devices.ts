import { prisma } from "./prisma";
import { SESSION } from "./session-config";
import { sendEmail } from "./email";

/** Unlimited — no login lockout. Value kept for UI only. */
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

/** Always false — device block list no longer blocks login (admin reset). */
export async function isDeviceBlocked(_ip: string, _userAgent: string | null) {
  return false;
}

export async function clearAllAdminDeviceData() {
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

export async function notifyAdminSecurity(opts: {
  subject: string;
  html: string;
  text: string;
}) {
  const dest = process.env.ADMIN_NOTIFY_EMAIL;
  if (!dest) return { ok: false as const };
  return sendEmail({
    to: dest,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
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
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0e17;color:#e8eef7;border-radius:12px;">
    <h1 style="color:#f59e0b;font-size:18px;">${details.title}</h1>
    <table style="width:100%;font-size:13px;color:#e8eef7;">
      <tr><td style="padding:6px 0;color:#64748b;">Account</td><td>${details.email}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">IP</td><td>${details.ip}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Device</td><td style="word-break:break-all;">${details.userAgent}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Time</td><td>${details.when}</td></tr>
      ${details.extra ? `<tr><td style="padding:6px 0;color:#64748b;">Note</td><td>${details.extra}</td></tr>` : ""}
    </table>
  </div>`;
}
