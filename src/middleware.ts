import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  SESSION,
  ALLOWED_BOTS,
  BAD_BOTS,
  OPAY_PATH,
  customerCookieName,
  visitorCookieName,
  COOKIE_BASE,
} from "@/lib/session-config";
import { applyClearAuthCookies } from "@/lib/clear-auth-cookies";
import { applySecurityHeaders } from "@/lib/security-headers";

/** Lightweight in-memory rate limit for Edge (no Redis import — keeps middleware small). */
const hits = new Map<string, { n: number; reset: number }>();

function edgeRateOk(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now > row.reset) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  row.n += 1;
  if (hits.size > 4000) {
    for (const [k, v] of hits) {
      if (v.reset < now) hits.delete(k);
    }
  }
  return row.n <= limit;
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
    return applySecurityHeaders(NextResponse.next());
  }

  // Public auth/bootstrap paths — never force login redirect
  if (
    pathname === "/api/clear-cookies" ||
    pathname === "/clear-cookies" ||
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname === "/api/admin/bootstrap" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/register")
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  if (OPAY_PATH.test(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  if (ua && BAD_BOTS.test(ua) && !ALLOWED_BOTS.test(ua)) {
    return applySecurityHeaders(
      NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 })
    );
  }

  const isAllowedBot = ALLOWED_BOTS.test(ua);
  if (!isAllowedBot) {
    const isApi = pathname.startsWith("/api/");
    if (!edgeRateOk(`rl:${ip}:${isApi ? "api" : "web"}`, isApi ? 80 : 150, 60_000)) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            error: "Too many requests. Please wait a moment and try again.",
            code: 429,
          },
          { status: 429, headers: { "Retry-After": "60" } }
        )
      );
    }
  }

  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.length > 2800) {
    const res = NextResponse.redirect(new URL("/error?code=494", req.url));
    return applySecurityHeaders(applyClearAuthCookies(res));
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
    (pathname.startsWith("/admin") &&
      pathname !== "/admin/login" &&
      !pathname.startsWith("/admin/login/")) ||
    pathname.startsWith("/api/admin");
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
        return applySecurityHeaders(
          NextResponse.json({ error: "Unauthorized", code: 401 }, { status: 401 })
        );
      }
      if (isAdminPath) {
        return applySecurityHeaders(
          NextResponse.redirect(new URL("/admin/login", req.url))
        );
      }
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", pathname);
      return applySecurityHeaders(NextResponse.redirect(login));
    }

    const role = (token.role as string) || "USER";
    const now = Math.floor(Date.now() / 1000);
    const lastActive = typeof token.la === "number" ? token.la : now;
    const idleLimit =
      role === "ADMIN"
        ? SESSION.ADMIN_IDLE_MS / 1000
        : SESSION.CUSTOMER_IDLE_MS / 1000;

    if (now - lastActive > idleLimit) {
      const loginPath = isAdminPath
        ? "/admin/login?reason=idle"
        : "/login?reason=idle";
      const out = pathname.startsWith("/api/")
        ? NextResponse.json(
            { error: "Session expired due to inactivity", code: 401 },
            { status: 401 }
          )
        : NextResponse.redirect(new URL(loginPath, req.url));
      return applySecurityHeaders(applyClearAuthCookies(out));
    }

    if (isAdminPath && role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return applySecurityHeaders(
          NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 })
        );
      }
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/account", req.url))
      );
    }
  }

  return applySecurityHeaders(res);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
