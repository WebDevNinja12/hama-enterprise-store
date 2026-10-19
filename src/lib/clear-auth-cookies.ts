import { NextResponse } from "next/server";
import {
  customerCookieName,
  adminCookieName,
  visitorCookieName,
  csrfCookieName,
  isProduction,
} from "./session-config";

/** All cookie names that can accumulate and cause 494 / 431 */
export function authCookieNames(): string[] {
  const names = [
    customerCookieName(),
    adminCookieName(),
    visitorCookieName(),
    csrfCookieName(),
    "hama.customer",
    "hama.admin",
    "hama.visitor",
    "hama.csrf",
    "hama.callback",
    "hama.cart",
    "__Secure-hama.customer",
    "__Secure-hama.admin",
    "__Secure-hama.visitor",
    "__Secure-hama.callback",
    "__Secure-hama.cart",
    "__Host-hama.csrf",
    // NextAuth defaults (legacy)
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
  ];

  // Chunked session cookies (.0 .1 …)
  for (let i = 0; i < 5; i++) {
    names.push(`next-auth.session-token.${i}`);
    names.push(`__Secure-next-auth.session-token.${i}`);
    names.push(`authjs.session-token.${i}`);
    names.push(`__Secure-authjs.session-token.${i}`);
    names.push(`${customerCookieName()}.${i}`);
    names.push(`__Secure-hama.customer.${i}`);
  }

  return [...new Set(names)];
}

export function applyClearAuthCookies(res: NextResponse): NextResponse {
  const secure = isProduction();
  for (const name of authCookieNames()) {
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: name.startsWith("__Secure-") || name.startsWith("__Host-") || secure,
    });
    // Also clear non-httpOnly variants browsers may hold
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      httpOnly: false,
      sameSite: "lax",
      secure: name.startsWith("__Secure-") || name.startsWith("__Host-") || secure,
    });
  }
  return res;
}
