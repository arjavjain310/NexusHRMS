import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setDemoSession } from "@/lib/auth/session";
import { DEMO_CREDENTIALS, DEMO_MODE_PASSWORD } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/auth/mode";

export async function POST(request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (isDemoMode() || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const demo = DEMO_CREDENTIALS.find((c) => c.email.toLowerCase() === normalizedEmail);
    try {
      const user = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      });
      const passwordOk =
        password === DEMO_MODE_PASSWORD || (demo && password === demo.password);
      if (!user || !passwordOk) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      await setDemoSession({
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        employeeId: user.employee?.id,
        name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : undefined,
        avatarUrl: user.employee?.avatarUrl ?? undefined,
      });
      return NextResponse.json({ success: true });
    } catch (e2) {
      console.error("[login demo db]", e2);
    }
    if (!demo || password !== DEMO_MODE_PASSWORD) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    await setDemoSession({
      id: `demo-${normalizedEmail}`,
      email: normalizedEmail,
      role: demo.role,
      organizationId: "demo-org",
      name: normalizedEmail.split("@")[0],
    });
    return NextResponse.json({ success: true });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Authentication is not configured. Missing Supabase keys." },
      { status: 503 }
    );
  }

  let dbUser;
  try {
    dbUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });
  } catch (dbErr) {
    console.error("[login] database error:", dbErr);
    return NextResponse.json(
      {
        error:
          "Database error during sign-in. Ensure the latest schema is deployed (npx prisma db push).",
      },
      { status: 503 }
    );
  }

  if (!dbUser) {
    return NextResponse.json(
      {
        error:
          "This email is not registered with your company. Ask HR to add you, then use Sign up to create your password.",
      },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      if (!dbUser.supabaseId) {
        return NextResponse.json(
          {
            error:
              "Please complete Sign up with your work email to set your password, then sign in here.",
          },
          { status: 403 }
        );
      }

      let message = error.message;
      if (/not confirmed/i.test(message)) {
        message =
          "Email not confirmed. In Supabase: Authentication → Users → confirm your user, or disable Confirm email under Authentication → Email.";
      } else if (/rate limit/i.test(message)) {
        message = "Too many attempts. Wait 30–60 minutes, then try again.";
      } else if (/invalid/i.test(message)) {
        message = "Invalid email or password.";
      }
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (data.user?.id && data.user.id !== dbUser.supabaseId) {
      try {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { supabaseId: data.user.id },
        });
      } catch (linkErr) {
        console.error("[login] supabaseId link failed:", linkErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[login] unexpected error:", e);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? `Authentication error: ${e.message}`
            : "Sign-in failed. Please try again or use Sign up if this is your first time.",
      },
      { status: 500 }
    );
  }
}
