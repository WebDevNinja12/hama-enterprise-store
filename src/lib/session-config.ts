/** Central session / cookie policy for HAMA store */

export const SESSION = {
  /** Admin must be active within this window or re-login */
  ADMIN_IDLE_MS: 5 * 60 * 1000,
  /** Customer idle timeout */
  CUSTOMER_IDLE_MS: 15 * 60 * 1000,
  /** First-time / anonymous visitor cookie */
  VISITOR_MAX_AGE_SEC: 60 * 60,
  /** Absolute max JWT lifetime (matches longest idle) */
  JWT_MAX_AGE_SEC: 15 * 60,
  /** Update lastActive at most this often */
  ACTIVITY_TOUCH_MS: 30 * 1000,
} as const;

export const COOKIE_NAMES = {
  /** Customer login JWT (random session id payload only) */
  CUSTOMER_SESSION: "__Secure-hama.customer",
  /** Admin login JWT — separate name from customer */
  ADMIN_SESSION: "__Secure-hama.admin",
  /** Fallback when Secure prefix not available (local http) */
  CUSTOMER_SESSION_DEV: "hama.customer",
  ADMIN_SESSION_DEV: "hama.admin",
  /** Anonymous visitor id (1 hour) */
  VISITOR: "__Secure-hama.visitor",
  VISITOR_DEV: "hama.visitor",
  /** CSRF double-submit token */
  CSRF: "__Host-hama.csrf",
  CSRF_DEV: "hama.csrf",
  /** Optional cart id reference (not cart body) */
  CART_ID: "__Secure-hama.cart",
  CART_ID_DEV: "hama.cart",
} as const;

export const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

/** Search-engine bots we always allow */
export const ALLOWED_BOTS =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|applebot|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|redditbot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot/i;

/** Obvious bad / scraper patterns (not search engines) */
export const BAD_BOTS =
  /scrapy|curl\/|wget|python-requests|libwww|httpclient|java\/|go-http|php\/|nikto|sqlmap|nmap|masscan|zgrab|petalbot.*scan|semrush.*bot(?!.*allowed)/i;

/** Paystack webhook user-agents / paths always allowed */
export const PAYSTACK_PATH = /^\/api\/(webhooks?\/)?paystack/i;

export function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export function customerCookieName() {
  return isProduction() ? COOKIE_NAMES.CUSTOMER_SESSION : COOKIE_NAMES.CUSTOMER_SESSION_DEV;
}

export function adminCookieName() {
  return isProduction() ? COOKIE_NAMES.ADMIN_SESSION : COOKIE_NAMES.ADMIN_SESSION_DEV;
}

export function visitorCookieName() {
  return isProduction() ? COOKIE_NAMES.VISITOR : COOKIE_NAMES.VISITOR_DEV;
}

export function csrfCookieName() {
  return isProduction() ? COOKIE_NAMES.CSRF : COOKIE_NAMES.CSRF_DEV;
}
