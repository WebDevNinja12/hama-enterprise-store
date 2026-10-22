import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-safe middleware only (no next-auth, no Node APIs).
 * Auth for /admin and /account is enforced in AdminGuard + API routes.
 */

const ALLOWED_BOTS =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|applebot|facebookexternalhit|twitterbot|linkedinbot|pinterest|redditbot/i;
const BAD_BOTS =
  /scrapy|curl\/|wget|python-requests|libwww|httpclient|java\/|go-http|php\/|nikto|sqlmap|nmap|masscan|zgrab/i;

function isProd() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function visitorCookieName() {
  return isProd() ? "__Secure-hama.visitor" : "hama.visitor";
}

function randomId(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function clearAuthCookies(res: NextResponse) {
  const names = [
    "__Secure-hama.customer",
    "hama.customer",
    "__Secure-hama.admin",
    "hama.admin",
    "__Secure-hama.visitor",
    "hama.visitor",
    "__Host-hama.csrf",
    "hama.csrf",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "authjs.session-token",
    "__Secure-authjs.session-token",
  ];
  for (const name of names) {
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: isProd(),
    });
  }
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent") || "";

  if (ua && BAD_BOTS.test(ua) && !ALLOWED_BOTS.test(ua)) {
    return NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 });
  }

  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.length > 2800) {
    const res = NextResponse.redirect(new URL("/error?code=494", req.url));
    return clearAuthCookies(res);
  }

  // Always allow admin login page through (no auth redirect here)
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const vName = visitorCookieName();
  if (!req.cookies.get(vName)?.value) {
    res.cookies.set(vName, randomId(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProd(),
      maxAge: 60 * 60,
    });
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
