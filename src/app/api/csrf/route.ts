import { NextResponse } from "next/server";
import { csrfCookieName, COOKIE_BASE, SESSION } from "@/lib/session-config";

function randomToken() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Issue a small CSRF token cookie (random id only) */
export async function GET() {
  const token = randomToken();
  const res = NextResponse.json({ csrf: token });
  res.cookies.set(csrfCookieName(), token, {
    ...COOKIE_BASE,
    maxAge: SESSION.JWT_MAX_AGE_SEC,
  });
  return res;
}
