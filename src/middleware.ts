import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BAD_BOTS, ALLOWED_BOTS, OPAY_PATH } from "@/lib/session-config";

/**
 * Edge middleware: block abusive scrapers, allow search engines + payment webhooks.
 * Does not touch static assets or the image optimizer.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow Next internals, public assets, health
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/logo.png" ||
    pathname === "/api/health" ||
    pathname.startsWith("/api/webhooks")
  ) {
    return NextResponse.next();
  }

  // OPay callbacks/webhooks — do not bot-block
  if (OPAY_PATH.test(pathname)) {
    return NextResponse.next();
  }

  const ua = req.headers.get("user-agent") || "";

  // Empty UA on API is suspicious for public register/search
  if (!ua && pathname.startsWith("/api/register")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ua && BAD_BOTS.test(ua) && !ALLOWED_BOTS.test(ua)) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp4|webm)$).*)",
  ],
};
