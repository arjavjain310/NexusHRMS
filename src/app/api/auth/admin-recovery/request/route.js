import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_RECOVERY_EMAIL,
  OTP_MAX_REQUESTS_PER_HOUR,
  OTP_TTL_MS,
  generateOtp,
  hashOtp,
  maskRecoveryEmail,
} from "@/lib/auth/admin-recovery";
import { sendAdminRecoveryOtp } from "@/lib/email/send-admin-recovery-otp";

export async function POST(request) {
  const { workEmail } = await request.json();
  const normalizedEmail = workEmail?.trim().toLowerCase();

  if (!normalizedEmail) {
    return NextResponse.json({ error: "Work email is required." }, { status: 400 });
  }

  try {
    const dbUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "No admin account found for this email. Use your admin work email.",
        },
        { status: 404 }
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.adminRecoveryOtp.count({
      where: { userId: dbUser.id, createdAt: { gte: oneHourAgo } },
    });

    if (recentCount >= OTP_MAX_REQUESTS_PER_HOUR) {
      return NextResponse.json(
        {
          error: "Too many OTP requests. Wait an hour, then try again.",
        },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.$transaction([
      prisma.adminRecoveryOtp.updateMany({
        where: { userId: dbUser.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      }),
      prisma.adminRecoveryOtp.create({
        data: {
          userId: dbUser.id,
          otpHash: hashOtp(otp, dbUser.id),
          expiresAt,
        },
      }),
    ]);

    await sendAdminRecoveryOtp({
      otp,
      workEmail: normalizedEmail,
      expiresMinutes: 10,
    });

    return NextResponse.json({
      success: true,
      message: `A one-time code was sent to ${maskRecoveryEmail(ADMIN_RECOVERY_EMAIL)}. It expires in 10 minutes.`,
      maskedRecoveryEmail: maskRecoveryEmail(ADMIN_RECOVERY_EMAIL),
    });
  } catch (e) {
    console.error("[admin-recovery request]", e);
    return NextResponse.json(
      { error: e.message || "Could not send recovery code. Try again shortly." },
      { status: 500 }
    );
  }
}
