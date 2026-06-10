import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseAuthEnabled } from "@/lib/auth/mode";
import { getDemoSignupBlockedMessage } from "@/lib/auth/demo-guards";

export async function POST(request) {
  if (isDemoMode()) {
    return NextResponse.json(
      { error: "Sign up is disabled in demo mode. Set DEMO_MODE=false and configure Supabase for production." },
      { status: 400 }
    );
  }

  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json(
      { error: "Sign up requires Supabase. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." },
      { status: 503 }
    );
  }

  const { email, password, firstName, lastName } = await request.json();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const demoSignupBlock = getDemoSignupBlockedMessage(normalizedEmail);
  if (demoSignupBlock) {
    return NextResponse.json({ error: demoSignupBlock }, { status: 403 });
  }

  try {
    const dbUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      include: { employee: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          error:
            "This email is not registered with your company. Ask HR to add you as an employee first, then sign up again.",
        },
        { status: 403 }
      );
    }

    if (dbUser.supabaseId) {
      return NextResponse.json(
        { error: "Account already exists. Please sign in or use password reset." },
        { status: 409 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          first_name: firstName || dbUser.employee?.firstName,
          last_name: lastName || dbUser.employee?.lastName,
        },
      },
    });

    if (error) {
      let message = error.message;
      if (/is invalid/i.test(message) && /\.demo$/i.test(normalizedEmail.split("@")[1] || "")) {
        message =
          "Supabase does not allow .demo email addresses. Use a real work email, or seeded accounts like admin@nexushrms.com after your database is updated.";
      }
      if (/rate limit/i.test(message)) {
        message =
          "Supabase email rate limit reached. Wait 30–60 minutes, or in Supabase go to Authentication → Email → disable Confirm email, then try again. You can also add the user manually under Authentication → Users.";
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (data.user) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { supabaseId: data.user.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: data.session
        ? "Account created. You can sign in now."
        : "Account created. Check your email to confirm, then sign in.",
      needsEmailConfirmation: !data.session,
    });
  } catch (e) {
    console.error("signup error", e);
    return NextResponse.json({ error: "Sign up failed" }, { status: 500 });
  }
}
