import crypto from "crypto";

export const ADMIN_RECOVERY_EMAIL =
  process.env.ADMIN_RECOVERY_EMAIL || "arjavjainaj310@gmail.com";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_REQUESTS_PER_HOUR = 5;

function getOtpSecret() {
  return process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "nexus-otp-dev-secret";
}

export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashOtp(otp, userId) {
  return crypto.createHash("sha256").update(`${otp}:${userId}:${getOtpSecret()}`).digest("hex");
}

export function verifyOtp(otp, userId, otpHash) {
  if (!otp || !userId || !otpHash) return false;
  const expected = hashOtp(otp.trim(), userId);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(otpHash));
  } catch {
    return false;
  }
}

export function maskRecoveryEmail(email) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "your recovery email";
  const visible = local.length <= 2 ? "*" : `${local[0]}***${local[local.length - 1]}`;
  return `${visible}@${domain}`;
}
