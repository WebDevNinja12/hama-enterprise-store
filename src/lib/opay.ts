/**
 * OPay Cashier (Express Checkout) helpers.
 * Docs: https://documentation.opaycheckout.com/cashier-create
 *
 * Env (Vercel):
 *   OPAY_MERCHANT_ID
 *   OPAY_PUBLIC_KEY
 *   OPAY_SECRET_KEY   (for status/query + webhook signature)
 *   OPAY_ENV=sandbox|live   (default sandbox until you go live)
 */

import crypto from "crypto";

export function opayConfigured(): boolean {
  return Boolean(
    process.env.OPAY_MERCHANT_ID &&
      process.env.OPAY_PUBLIC_KEY &&
      process.env.OPAY_SECRET_KEY
  );
}

export function opayBaseUrl(): string {
  const env = (process.env.OPAY_ENV || "sandbox").toLowerCase();
  return env === "live"
    ? "https://liveapi.opaycheckout.com/api/v1/international"
    : "https://testapi.opaycheckout.com/api/v1/international";
}

/** NGN amount in kobo (smallest unit) for OPay `amount.total` */
export function nairaToKobo(naira: number): number {
  return Math.round(Number(naira) * 100);
}

export type CreateCashierInput = {
  reference: string;
  amountNgn: number;
  productName: string;
  productDescription: string;
  returnUrl: string;
  callbackUrl: string;
  cancelUrl: string;
  userEmail?: string;
  userName?: string;
  userMobile?: string;
  userId?: string;
};

export async function createOpayCashierOrder(input: CreateCashierInput): Promise<{
  ok: boolean;
  cashierUrl?: string;
  orderNo?: string;
  error?: string;
  raw?: unknown;
}> {
  if (!opayConfigured()) {
    return {
      ok: false,
      error:
        "OPay is not configured. Set OPAY_MERCHANT_ID, OPAY_PUBLIC_KEY, OPAY_SECRET_KEY on Vercel.",
    };
  }

  const body = {
    country: "NG",
    reference: input.reference,
    amount: {
      total: nairaToKobo(input.amountNgn),
      currency: "NGN",
    },
    returnUrl: input.returnUrl,
    callbackUrl: input.callbackUrl,
    cancelUrl: input.cancelUrl,
    expireAt: 30,
    customerVisitSource: "BROWSER",
    evokeOpay: true,
    product: {
      name: input.productName.slice(0, 120),
      description: input.productDescription.slice(0, 200),
    },
    userInfo: {
      userEmail: input.userEmail,
      userName: input.userName,
      userMobile: input.userMobile,
      userId: input.userId,
    },
  };

  try {
    const res = await fetch(`${opayBaseUrl()}/cashier/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPAY_PUBLIC_KEY}`,
        MerchantId: process.env.OPAY_MERCHANT_ID || "",
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => null)) as {
      code?: string;
      message?: string;
      data?: { cashierUrl?: string; orderNo?: string; reference?: string };
    } | null;

    if (!res.ok || !json || json.code !== "00000") {
      return {
        ok: false,
        error: json?.message || `OPay create failed (${res.status})`,
        raw: json,
      };
    }

    return {
      ok: true,
      cashierUrl: json.data?.cashierUrl,
      orderNo: json.data?.orderNo,
      raw: json,
    };
  } catch (e) {
    console.error("[opay] create cashier failed:", e);
    return { ok: false, error: "Failed to reach OPay" };
  }
}

/**
 * Verify OPay callback signature (HMAC-SHA512 with secret key).
 * Exact field set can vary by region — we verify when `sign` is present.
 * See: https://documentation.opaycheckout.com/callback-signature
 */
export function verifyOpayCallbackSignature(
  payload: Record<string, unknown>,
  signature: string | null | undefined
): boolean {
  const secret = process.env.OPAY_SECRET_KEY;
  if (!secret || !signature) return false;

  // Common pattern: sort keys, concatenate values, HMAC-SHA512 hex
  try {
    const { sign: _s, ...rest } = payload as { sign?: string } & Record<
      string,
      unknown
    >;
    const keys = Object.keys(rest).sort();
    const content = keys
      .map((k) => {
        const v = rest[k];
        if (v === null || v === undefined) return "";
        if (typeof v === "object") return JSON.stringify(v);
        return String(v);
      })
      .join("");

    const expected = crypto
      .createHmac("sha512", secret)
      .update(content)
      .digest("hex");

    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}
