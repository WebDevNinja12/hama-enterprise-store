import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Minimal Edge middleware — no next-auth, no Redis.
 * Admin/customer auth is enforced in AdminGuard and API routes.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Clear oversized cookies (494 prevention)
  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.length > 2800) {
    const res = NextResponse.redirect(new URL("/clear-cookies", req.url));
    const names = [
      "__Secure-hama.customer",
      "hama.customer",
      "__Secure-next-auth.session-token",
      "next-auth.session-token",
      "__Secure-authjs.session-token",
      "authjs.session-token",
    ];
    for (const name of names) {
      res.cookies.set(name, "", { path: "/", maxAge: 0 });
    }
    return res;
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png).*)"],
};
