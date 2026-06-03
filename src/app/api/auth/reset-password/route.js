import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { DEFAULT_COMPANY_PASSWORD } from "@/lib/auth/default-password";
import { getSupabaseAdmin, syncSupabaseAuthUser } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/auth/mode";

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

  if (newPassword === DEFAULT_COMPANY_PASSWORD) {
    return NextResponse.json(
      { error: "Choose a password different from the company default." },
      { status: 400 }
    );
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

    const admin = getSupabaseAdmin();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!admin || !supabaseUrl || !anonKey) {
      if (isDemoMode()) {
        if (currentPassword !== DEFAULT_COMPANY_PASSWORD) {
          return NextResponse.json(
            {
              error: `Invalid current password. New employees use the default: ${DEFAULT_COMPANY_PASSWORD}`,
            },
            { status: 401 }
          );
        }
        return NextResponse.json(
          {
            error:
              "Password reset needs Supabase (SUPABASE_SERVICE_ROLE_KEY). In demo mode, continue signing in with the default password.",
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

    let supabaseUserId = dbUser.supabaseId;

    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: currentPassword,
    });

    if (signInError) {
      const defaultOk = currentPassword === DEFAULT_COMPANY_PASSWORD;
      if (!defaultOk) {
        return NextResponse.json(
          {
            error: `Current password is incorrect. New employees: use default password ${DEFAULT_COMPANY_PASSWORD}`,
          },
          { status: 401 }
        );
      }
      const synced = await syncSupabaseAuthUser(normalizedEmail, DEFAULT_COMPANY_PASSWORD);
      if (!synced.supabaseId) {
        return NextResponse.json(
          { error: synced.error || "Could not verify your account. Contact HR." },
          { status: 400 }
        );
      }
      supabaseUserId = synced.supabaseId;
    } else {
      supabaseUserId = signInData.user?.id || supabaseUserId;
    }

    if (!supabaseUserId) {
      return NextResponse.json({ error: "Could not verify account." }, { status: 400 });
    }

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

    if (!dbUser.supabaseId) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { supabaseId: supabaseUserId },
      });
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
