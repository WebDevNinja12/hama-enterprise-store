import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  SESSION,
  ALLOWED_BOTS,
  BAD_BOTS,
  PAYSTACK_PATH,
  customerCookieName,
  adminCookieName,
  visitorCookieName,
  COOKIE_BASE,
  isProduction,
} from "@/lib/session-config";
import { applyClearAuthCookies } from "@/lib/clear-auth-cookies";
import { rateLimitIncr } from "@/lib/redis";

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

function isAssetOrOptimizer(pathname: string): boolean {
  if (pathname.startsWith("/_next/image")) return true;
  if (pathname.startsWith("/_next/static")) return true;
  if (pathname === "/favicon.ico" || pathname === "/logo.png") return true;
  if (/\.(avif|webp|png|jpe?g|gif|svg|ico|woff2?)$/i.test(pathname)) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent") || "";
  const ip = clientIp(req);

  if (isAssetOrOptimizer(pathname)) {
    return NextResponse.next();
  }

  // Always allow cookie-clear endpoint (recovery from 494)
  if (pathname === "/api/clear-cookies" || pathname === "/clear-cookies") {
    return NextResponse.next();
  }

  if (PAYSTACK_PATH.test(pathname)) {
    return NextResponse.next();
  }

  if (ua && BAD_BOTS.test(ua) && !ALLOWED_BOTS.test(ua)) {
    return NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 });
  }

  const isAllowedBot = ALLOWED_BOTS.test(ua);

  if (!isAllowedBot) {
    const isApi = pathname.startsWith("/api/");
    const { ok } = await rateLimitIncr(
      `rl:${ip}:${isApi ? "api" : "web"}`,
      isApi ? 60 : 120,
      60
    );
    if (!ok) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment and try again.",
          code: 429,
        },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  const cookieHeader = req.headers.get("cookie") || "";

  // Prevent 494 / 431: clear cookies early when header is getting large
  // Vercel edge often rejects ~8KB; clear well before that.
  if (cookieHeader.length > 2800) {
    const res = NextResponse.redirect(new URL("/error?code=494", req.url));
    return applyClearAuthCookies(res);
  }

  const res = NextResponse.next();

  const vName = visitorCookieName();
  if (!req.cookies.get(vName)?.value) {
    res.cookies.set(vName, randomId(), {
      ...COOKIE_BASE,
      maxAge: SESSION.VISITOR_MAX_AGE_SEC,
    });
  }

  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isAccountPath =
    pathname.startsWith("/account") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/account");

  if (isAdminPath || isAccountPath) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      cookieName: customerCookieName(),
    });

    if (!token?.sub) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized", code: 401 }, { status: 401 });
      }
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }

    const role = (token.role as string) || "USER";
    const now = Math.floor(Date.now() / 1000);
    const lastActive = typeof token.la === "number" ? token.la : now;
    const idleLimit =
      role === "ADMIN"
        ? SESSION.ADMIN_IDLE_MS / 1000
        : SESSION.CUSTOMER_IDLE_MS / 1000;

    if (now - lastActive > idleLimit) {
      const out = pathname.startsWith("/api/")
        ? NextResponse.json(
            { error: "Session expired due to inactivity", code: 401 },
            { status: 401 }
          )
        : NextResponse.redirect(new URL("/login?reason=idle", req.url));
      return applyClearAuthCookies(out);
    }

    if (isAdminPath && role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/account", req.url));
    }

    if (role === "ADMIN") {
      // Tiny flag only — not a second full session JWT
      res.cookies.set(adminCookieName(), "1", {
        ...COOKIE_BASE,
        maxAge: Math.floor(SESSION.ADMIN_IDLE_MS / 1000),
      });
    }
  }

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (isProduction()) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
