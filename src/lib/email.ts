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
      return { ok: false, error: "Failed to send email" };
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
