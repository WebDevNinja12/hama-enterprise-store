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

/** Simple in-memory rate limit (per isolate; good enough on edge) */
const hits = new Map<string, { n: number; t: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 120; // requests per minute per IP
const RATE_API_MAX = 60;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now - row.t > RATE_WINDOW_MS) {
    hits.set(key, { n: 1, t: now });
    // Prevent unbounded map growth
    if (hits.size > 5000) {
      const cutoff = now - RATE_WINDOW_MS * 2;
      for (const [k, v] of hits) {
        if (v.t < cutoff) hits.delete(k);
      }
    }
    return true;
  }
  row.n += 1;
  return row.n <= max;
}

function randomId(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent") || "";
  const ip = clientIp(req);

  // --- Paystack webhooks: always allow, no session noise ---
  if (PAYSTACK_PATH.test(pathname)) {
    return NextResponse.next();
  }

  // --- Bot filter ---
  if (ua && BAD_BOTS.test(ua) && !ALLOWED_BOTS.test(ua)) {
    return NextResponse.json(
      { error: "Forbidden", code: 403 },
      { status: 403 }
    );
  }

  // Allow known good crawlers without rate pressure
  const isAllowedBot = ALLOWED_BOTS.test(ua);

  // --- Rate limiting ---
  if (!isAllowedBot) {
    const isApi = pathname.startsWith("/api/");
    const ok = rateLimit(`${ip}:${isApi ? "api" : "web"}`, isApi ? RATE_API_MAX : RATE_MAX);
    if (!ok) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment and try again.",
          code: 429,
        },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        }
      );
    }
  }

  // Reject absurdly large Cookie headers early (prevent 431/494 upstream)
  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.length > 4096) {
    const res = NextResponse.redirect(new URL("/error?code=431", req.url));
    // Clear known session cookies
    res.cookies.set(customerCookieName(), "", { ...COOKIE_BASE, maxAge: 0 });
    res.cookies.set(adminCookieName(), "", { ...COOKIE_BASE, maxAge: 0 });
    return res;
  }

  const res = NextResponse.next();

  // --- Visitor cookie (first-time / anonymous), 1 hour ---
  const vName = visitorCookieName();
  if (!req.cookies.get(vName)?.value) {
    res.cookies.set(vName, randomId(), {
      ...COOKIE_BASE,
      maxAge: SESSION.VISITOR_MAX_AGE_SEC,
    });
  }

  // --- Auth for protected routes ---
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
        : NextResponse.redirect(
            new URL("/login?reason=idle", req.url)
          );
      out.cookies.set(customerCookieName(), "", { ...COOKIE_BASE, maxAge: 0 });
      out.cookies.set(adminCookieName(), "", { ...COOKIE_BASE, maxAge: 0 });
      return out;
    }

    if (isAdminPath && role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden", code: 403 }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/account", req.url));
    }

    // Mirror a tiny admin marker cookie (name isolation) — value is only "1"
    if (role === "ADMIN") {
      res.cookies.set(adminCookieName(), "1", {
        ...COOKIE_BASE,
        maxAge: Math.floor(SESSION.ADMIN_IDLE_MS / 1000),
      });
    }
  }

  // Security headers (lightweight)
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
    /*
     * Match all paths except static assets and Next internals
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
