import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setDemoSession } from "@/lib/auth/session";
import { DEMO_CREDENTIALS } from "@/lib/constants";
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
    const demo = DEMO_CREDENTIALS.find(c => c.email === email);
    if (!demo || password !== demo.password) {
      return NextResponse.json({
        error: "Invalid credentials"
      }, {
        status: 401
      });
    }
    try {
      const user = await prisma.user.findUnique({
        where: {
          email
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
        return NextResponse.json({
          success: true
        });
      }
    } catch (e2) {
      // DB not connected — use in-memory demo session
    }
    await setDemoSession({
      id: `demo-${email}`,
      email,
      role: demo.role,
      organizationId: "demo-org",
      name: email.split("@")[0]
    });
    return NextResponse.json({
      success: true
    });
  }
  try {
    const supabase = await createClient();
    const {
      data,
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      let message = error.message;
      if (/not confirmed/i.test(message)) {
        message =
          "Email not confirmed. In Supabase: Authentication → Users → select your user → confirm, or turn off Confirm email under Authentication → Email. You can also delete the user and re-add with Auto Confirm enabled.";
      }
      if (/rate limit/i.test(message)) {
        message = "Too many attempts. Wait 30–60 minutes or add the user manually in Supabase → Authentication → Users.";
      }
      return NextResponse.json({ error: message }, { status: 401 });
    }
    const dbUser = await prisma.user.findFirst({
      where: {
        email: { equals: data.user.email, mode: "insensitive" },
      },
      include: {
        employee: true
      }
    });
    if (!dbUser) {
      return NextResponse.json({
        error:
          "This email is not in your company HR database yet. Ask an admin to add you in Neon (or run npm run db:add-user), then sign in again. If you already have a Supabase account, use Sign in — not Sign up."
      }, {
        status: 403
      });
    }

    if (data.user?.id && !dbUser.supabaseId) {
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