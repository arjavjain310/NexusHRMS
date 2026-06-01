import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setDemoSession } from "@/lib/auth/session";
import { DEMO_CREDENTIALS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
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
  if (process.env.DEMO_MODE === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
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
    if (error) return NextResponse.json({
      error: error.message
    }, {
      status: 401
    });
    const dbUser = await prisma.user.findUnique({
      where: {
        email: data.user.email
      },
      include: {
        employee: true
      }
    });
    if (!dbUser) {
      return NextResponse.json({
        error: "User not provisioned in HRMS"
      }, {
        status: 403
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