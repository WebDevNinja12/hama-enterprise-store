/** HTTP security headers applied in middleware */

import type { NextResponse } from "next/server";

/**
 * Content-Security-Policy — reduces XSS impact.
 * Allows Next.js, Vercel Blob, images, OPay checkout domains, Google OAuth.
 */
export function contentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://*.opaycheckout.com https://*.opayweb.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    // Next.js needs unsafe-inline for some styles; scripts kept tighter
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: https://*.public.blob.vercel-storage.com https://*.vercel-storage.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.opaycheckout.com https://*.opayweb.com https://accounts.google.com https://*.vercel-storage.com https://*.public.blob.vercel-storage.com https://api.resend.com",
    "frame-src 'self' https://accounts.google.com https://*.opaycheckout.com https://*.opayweb.com",
    "media-src 'self' blob: https://*.public.blob.vercel-storage.com https://*.vercel-storage.com",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

export function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()"
  );
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.headers.set("Cross-Origin-Resource-Policy", "same-site");
  res.headers.set("Content-Security-Policy", contentSecurityPolicy());

  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1"
  ) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Do not advertise server tech
  res.headers.delete("X-Powered-By");

  return res;
}
