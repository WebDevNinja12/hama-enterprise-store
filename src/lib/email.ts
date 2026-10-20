export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM || "HAMA ENTERPRISE NG <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY not set — email not sent:",
      opts.subject,
      "→",
      opts.to
    );
    return {
      ok: false,
      error:
        "Email is not configured. Set RESEND_API_KEY and EMAIL_FROM on Vercel.",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend error:", res.status, body);
      let message = "Failed to send email";
      try {
        const j = JSON.parse(body) as { message?: string };
        if (j.message) message = j.message;
      } catch {
        /* ignore */
      }
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { ok: false, error: "Failed to send email" };
  }
}

export function resetPasswordEmailHtml(resetUrl: string) {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0e17;color:#e8eef7;border-radius:12px;">
    <h1 style="color:#22d3ee;font-size:20px;">Reset your password</h1>
    <p style="color:#94a3b8;line-height:1.5;">You requested a password reset for your HAMA ENTERPRISE NG account.</p>
    <p style="color:#f59e0b;font-weight:600;">This link expires in 90 seconds.</p>
    <p style="margin:24px 0;">
      <a href="${resetUrl}" style="background:#22d3ee;color:#0a0e17;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;">Reset password</a>
    </p>
    <p style="color:#64748b;font-size:12px;">If you did not request this, ignore this email. This message was sent only to you.</p>
  </div>`;
}

export function otpEmailHtml(otp: string, purpose: string) {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0e17;color:#e8eef7;border-radius:12px;">
    <h1 style="color:#22d3ee;font-size:20px;">${purpose}</h1>
    <p style="color:#94a3b8;line-height:1.5;">Use this one-time code. It expires in 10 minutes.</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#22d3ee;margin:24px 0;">${otp}</p>
    <p style="color:#64748b;font-size:12px;">If you did not request this, ignore this email. Sent only to your address.</p>
  </div>`;
}

export function cartReminderEmailHtml(
  items: { name: string; daysLeft: number }[],
  cartUrl: string
) {
  const list = items
    .map(
      (i) =>
        `<li style="margin:6px 0;">${i.name} — <strong style="color:#f59e0b;">${i.daysLeft} day(s) left</strong></li>`
    )
    .join("");
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0e17;color:#e8eef7;border-radius:12px;">
    <h1 style="color:#22d3ee;font-size:20px;">Your cart is expiring soon</h1>
    <p style="color:#94a3b8;line-height:1.5;">Items in your HAMA ENTERPRISE NG cart expire after 7 days:</p>
    <ul style="color:#e8eef7;padding-left:18px;">${list}</ul>
    <p style="margin:24px 0;">
      <a href="${cartUrl}" style="background:#22d3ee;color:#0a0e17;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;">View cart</a>
    </p>
  </div>`;
}

export function stockMaxEmailHtml(productName: string, stock: number) {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0e17;color:#e8eef7;border-radius:12px;">
    <h1 style="color:#f59e0b;font-size:20px;">Stock alert</h1>
    <p style="color:#94a3b8;line-height:1.5;">
      <strong style="color:#e8eef7;">${productName}</strong> stock update.
    </p>
    <p style="color:#22d3ee;">Current stock: ${stock}</p>
  </div>`;
}

const STATUS_COPY: Record<
  string,
  { title: string; message: string; color: string }
> = {
  PENDING: {
    title: "Order received",
    message:
      "We have received your order and are waiting to process it (e.g. bank transfer confirmation).",
    color: "#f59e0b",
  },
  PROCESSING: {
    title: "Order accepted",
    message:
      "Good news — your order has been accepted and is being prepared.",
    color: "#22d3ee",
  },
  SHIPPED: {
    title: "Order shipped",
    message:
      "Your order is on the way. You will be contacted on the phone number you provided for delivery if needed.",
    color: "#22d3ee",
  },
  DELIVERED: {
    title: "Order delivered",
    message:
      "Your order has been marked as delivered. Thank you for shopping with HAMA ENTERPRISE NG.",
    color: "#34d399",
  },
  CANCELLED: {
    title: "Order cancelled",
    message:
      "Your order has been cancelled. If you already paid, contact support for a refund where applicable.",
    color: "#f87171",
  },
};

export function orderStatusEmailHtml(opts: {
  orderNumber: string;
  status: string;
  customerName?: string | null;
  accountUrl?: string;
}) {
  const copy = STATUS_COPY[opts.status] || {
    title: "Order update",
    message: `Your order status is now: ${opts.status}.`,
    color: "#22d3ee",
  };
  const name = opts.customerName ? ` ${opts.customerName}` : "";
  const accountUrl =
    opts.accountUrl ||
    "https://hama-enterprise-store.vercel.app/account";

  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0e17;color:#e8eef7;border-radius:12px;">
    <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;">HAMA ENTERPRISE NG</p>
    <h1 style="color:${copy.color};font-size:20px;margin:0 0 12px;">${copy.title}</h1>
    <p style="color:#94a3b8;line-height:1.5;">Hello${name},</p>
    <p style="color:#94a3b8;line-height:1.5;">${copy.message}</p>
    <p style="margin:16px 0;padding:12px 16px;background:#111827;border-radius:8px;">
      <span style="color:#94a3b8;font-size:12px;">Order number</span><br/>
      <strong style="color:#22d3ee;font-family:monospace;font-size:16px;">${opts.orderNumber}</strong>
    </p>
    <p style="color:#94a3b8;font-size:13px;">Status: <strong style="color:${copy.color};">${opts.status}</strong></p>
    <p style="margin:24px 0;">
      <a href="${accountUrl}" style="background:#22d3ee;color:#0a0e17;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;">View my orders</a>
    </p>
    <p style="color:#64748b;font-size:12px;">If you have questions, reply to this email or contact support@hamaenterprise.ng</p>
  </div>`;
}

export function orderStatusSubject(orderNumber: string, status: string): string {
  const map: Record<string, string> = {
    PENDING: "received",
    PROCESSING: "accepted",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
  };
  const word = map[status] || status.toLowerCase();
  return `Order ${orderNumber} ${word} — HAMA ENTERPRISE NG`;
}
