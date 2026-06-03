import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setDemoSession } from "@/lib/auth/session";
import { DEMO_CREDENTIALS, DEMO_MODE_PASSWORD } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/auth/mode";

export async function POST(request) {
  const {
    email,
    password
  } = await request.json();
  if (!email || !password) {
    return NextResponse.json({
      error: "Email and password required"
    }, {
      status: 400
    });
  }
  if (isDemoMode() || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const normalizedEmail = email.trim().toLowerCase();
    const demo = DEMO_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === normalizedEmail
    );
    try {
      const user = await prisma.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: "insensitive" },
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          }
        }
      });
      const passwordOk =
        password === DEMO_MODE_PASSWORD ||
        (demo && password === demo.password);
      if (!user || !passwordOk) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      if (user) {
        await setDemoSession({
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          employeeId: user.employee?.id,
          name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : undefined,
          avatarUrl: user.employee?.avatarUrl ?? undefined
        });
        return NextResponse.json({ success: true });
      }
    } catch (e2) {
      // DB not connected — use in-memory demo session
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
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const dbUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      include: { employee: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          error:
            "This email is not registered with your company. Ask HR to add you, then use Sign up to create your password.",
        },
        { status: 403 }
      );
    }

    if (!dbUser.supabaseId) {
      return NextResponse.json(
        {
          error:
            "Please complete Sign up with your work email to set your password, then sign in here.",
        },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      let message = error.message;
      if (/not confirmed/i.test(message)) {
        message =
          "Email not confirmed. In Supabase: Authentication → Users → select your user → confirm, or turn off Confirm email under Authentication → Email.";
      }
      if (/rate limit/i.test(message)) {
        message = "Too many attempts. Wait 30–60 minutes, then try again.";
      }
      if (/invalid/i.test(message)) {
        message = "Invalid email or password.";
      }
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (data.user?.id && data.user.id !== dbUser.supabaseId) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { supabaseId: data.user.id },
      });
    }

    return NextResponse.json({
      success: true
    });
  } catch (e) {
    return NextResponse.json({
      error: "Authentication failed"
    }, {
      status: 500
    });
  }
}