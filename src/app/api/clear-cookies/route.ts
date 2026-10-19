import { NextResponse } from "next/server";
import { applyClearAuthCookies } from "@/lib/clear-auth-cookies";

/**
 * Clears all auth / session cookies so the browser can recover from 494 / 431.
 * Call from the error page or login page.
 */
export async function GET() {
  const res = NextResponse.json({
    ok: true,
    message: "Auth cookies cleared. You can sign in again.",
  });
  return applyClearAuthCookies(res);
}

export async function POST() {
  return GET();
}
