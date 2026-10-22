import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/** Keep middleware Edge-safe: no Redis, no Node-only imports. */

const ADMIN_IDLE_SEC = 30 * 60;
const CUSTOMER_IDLE_SEC = 15 * 60;
const VISITOR_MAX_AGE_SEC = 60 * 60;
const JWT_MAX_AGE_SEC = 30 * 60;

const ALLOWED_BOTS =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|applebot|facebookexternalhit|twitterbot|linkedinbot|pinterest|redditbot/i;
const BAD_BOTS =
  /scrapy|curl\/|wget|python-requests|libwww|httpclient|java\/|go-http|php\/|nikto|sqlmap|nmap|masscan|zgrab/i;
const OPAY_PATH = /^\/api\/(webhooks?\/)?opay/i;

function isProd() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function sessionCookieName() {
  return isProd() ? "__Secure-hama.customer" : "hama.customer";
}

function visitorCookieName() {
  return isProd() ? "__Secure-hama.visitor" : "hama.visitor";
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
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
    "__Secure-hama.callback",
    "hama.callback",
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

function isPublicPath(pathname: string): boolean {
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/"))
    return true;
  if (pathname === "/login" || pathname === "/register") return true;
  if (pathname === "/forgot-password" || pathname === "/reset-password")
    return true;
  if (pathname === "/clear-cookies" || pathname === "/api/clear-cookies")
    return true;
  if (pathname === "/api/admin/bootstrap") return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/register")) return true;
  if (OPAY_PATH.test(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico" || pathname === "/logo.png") return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent") || "";
  const ip = clientIp(req);

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (ua && BAD_BOTS.test(ua) && !ALLOWED_BOTS.test(ua)) {
    return NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 });
  }

  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.length > 2800) {
    const res = NextResponse.redirect(new URL("/error?code=494", req.url));
    return clearAuthCookies(res);
  }

  const res = NextResponse.next();
  const vName = visitorCookieName();
  if (!req.cookies.get(vName)?.value) {
    res.cookies.set(vName, randomId(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProd(),
      maxAge: VISITOR_MAX_AGE_SEC,
    });
  }

  const isAdminPath =
    (pathname.startsWith("/admin") &&
      pathname !== "/admin/login" &&
      !pathname.startsWith("/admin/login/")) ||
    (pathname.startsWith("/api/admin") && pathname !== "/api/admin/bootstrap");

  const isAccountPath =
    pathname.startsWith("/account") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/account");

  if (!isAdminPath && !isAccountPath) {
    return res;
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    cookieName: sessionCookieName(),
  });

  if (!token?.sub) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized", code: 401 },
        { status: 401 }
      );
    }
    if (isAdminPath) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const role = (token.role as string) || "USER";
  const now = Math.floor(Date.now() / 1000);
  const lastActive = typeof token.la === "number" ? token.la : now;
  const idleLimit = role === "ADMIN" ? ADMIN_IDLE_SEC : CUSTOMER_IDLE_SEC;

  if (now - lastActive > idleLimit) {
    const loginPath = isAdminPath
      ? "/admin/login?reason=idle"
      : "/login?reason=idle";
    if (pathname.startsWith("/api/")) {
      const out = NextResponse.json(
        { error: "Session expired due to inactivity", code: 401 },
        { status: 401 }
      );
      return clearAuthCookies(out);
    }
    const out = NextResponse.redirect(new URL(loginPath, req.url));
    return clearAuthCookies(out);
  }

  if (isAdminPath && role !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Forbidden", code: 403 },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/account", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
