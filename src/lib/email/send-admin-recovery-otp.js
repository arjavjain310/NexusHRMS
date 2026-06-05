import { ADMIN_RECOVERY_EMAIL } from "@/lib/auth/admin-recovery";

export async function sendAdminRecoveryOtp({ otp, workEmail, expiresMinutes = 10 }) {
  const to = ADMIN_RECOVERY_EMAIL;
  const subject = "Nexus-HRMS Admin password recovery OTP";
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px;">
      <h2 style="color: #1e40af;">Nexus-HRMS Admin recovery</h2>
      <p>A password reset was requested for the admin account <strong>${workEmail}</strong>.</p>
      <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold; margin: 24px 0;">${otp}</p>
      <p>This one-time code expires in <strong>${expiresMinutes} minutes</strong>. Do not share it with anyone.</p>
      <p style="color: #64748b; font-size: 13px;">If you did not request this, you can ignore this email.</p>
    </div>
  `;
  const text = `Nexus-HRMS admin recovery OTP for ${workEmail}: ${otp}. Expires in ${expiresMinutes} minutes.`;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const from = process.env.EMAIL_FROM || "Nexus HRMS <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[sendAdminRecoveryOtp] Resend error:", err);
      throw new Error("Failed to send recovery email");
    }
    return { sent: true, channel: "resend" };
  }

  if (process.env.NODE_ENV === "development" || process.env.DEMO_MODE === "true") {
    console.info(`[admin-recovery] OTP for ${workEmail} → ${to}: ${otp} (expires in ${expiresMinutes}m)`);
    return { sent: true, channel: "dev-log" };
  }

  throw new Error(
    "Email is not configured. Set RESEND_API_KEY and EMAIL_FROM to send admin recovery OTPs."
  );
}
