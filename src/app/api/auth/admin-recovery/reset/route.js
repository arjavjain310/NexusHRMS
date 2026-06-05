import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyOtp } from "@/lib/auth/admin-recovery";

export async function POST(request) {
  const { workEmail, otp, newPassword, confirmPassword } = await request.json();
  const normalizedEmail = workEmail?.trim().toLowerCase();

  if (!normalizedEmail || !otp || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "Work email, OTP, new password, and confirmation are required." },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const dbUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
    }

    const record = await prisma.adminRecoveryOtp.findFirst({
      where: {
        userId: dbUser.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        {
          error: "OTP expired or invalid. Request a new code — no approval from another user is needed.",
        },
        { status: 400 }
      );
    }

    if (!verifyOtp(otp, dbUser.id, record.otpHash)) {
      return NextResponse.json({ error: "Incorrect OTP. Check the code and try again." }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Password reset is not configured (Supabase admin required)." },
        { status: 503 }
      );
    }

    let supabaseUserId = dbUser.supabaseId;

    if (!supabaseUserId) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (existing) supabaseUserId = existing.id;
    }

    if (!supabaseUserId) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: newPassword,
        email_confirm: true,
      });
      if (createError || !created?.user?.id) {
        return NextResponse.json(
          { error: createError?.message || "Could not create auth account." },
          { status: 500 }
        );
      }
      supabaseUserId = created.user.id;
    } else {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
        password: newPassword,
        email_confirm: true,
      });
      if (updateError) {
        return NextResponse.json(
          { error: updateError.message || "Failed to update password." },
          { status: 500 }
        );
      }
    }

    await prisma.$transaction([
      prisma.adminRecoveryOtp.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.adminRecoveryOtp.updateMany({
        where: { userId: dbUser.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: dbUser.id },
        data: { supabaseId: supabaseUserId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (e) {
    console.error("[admin-recovery reset]", e);
    return NextResponse.json({ error: "Password recovery failed." }, { status: 500 });
  }
}
