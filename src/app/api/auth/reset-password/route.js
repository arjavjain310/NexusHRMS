import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/auth/mode";
import { getDemoPasswordResetBlockedMessage } from "@/lib/auth/demo-guards";

export async function POST(request) {
  const { email, currentPassword, newPassword, confirmPassword } = await request.json();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "Email, current password, new password, and confirmation are required." },
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

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from your current password." },
      { status: 400 }
    );
  }

  const demoResetBlock = getDemoPasswordResetBlockedMessage(normalizedEmail);
  if (demoResetBlock) {
    return NextResponse.json({ error: demoResetBlock }, { status: 403 });
  }

  try {
    const dbUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          error:
            "This email is not registered with your company. Use the work email HR added for you.",
        },
        { status: 404 }
      );
    }

    if (!dbUser.supabaseId) {
      return NextResponse.json(
        {
          error:
            "You have not set up your account yet. Go to Sign up, choose your password, then sign in.",
        },
        { status: 403 }
      );
    }

    const admin = getSupabaseAdmin();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!admin || !supabaseUrl || !anonKey) {
      if (isDemoMode()) {
        return NextResponse.json(
          {
            error:
              "Password reset needs Supabase in production. In demo mode, use Sign up or contact your admin.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Password reset is not configured. Contact your administrator." },
        { status: 503 }
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        {
          error:
            "Current password is incorrect. If this is your first time, use Sign up instead of reset.",
        },
        { status: 401 }
      );
    }

    const supabaseUserId = signInData.user?.id || dbUser.supabaseId;

    const { error: updateError } = await admin.auth.admin.updateUserById(supabaseUserId, {
      password: newPassword,
      email_confirm: true,
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (e) {
    console.error("[reset-password]", e);
    return NextResponse.json({ error: "Password reset failed" }, { status: 500 });
  }
}
