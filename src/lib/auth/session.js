import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/auth/mode";
import { isDemoLoginEnabled } from "@/lib/auth/demo-login";
import { buildDemoSessionPayload } from "@/lib/auth/demo-accounts";

const DEMO_SESSION_COOKIE = "nexus_demo_session";

export async function getSession() {
  const demoFromCookie = await getDemoSession();
  if (demoFromCookie?.isDemoSession) {
    return demoFromCookie;
  }

  if (isDemoMode()) {
    return demoFromCookie;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const dbUser = await prisma.user.findFirst({
      where: {
        email: { equals: user.email, mode: "insensitive" },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
    if (!dbUser) return null;

    return {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      organizationId: dbUser.organizationId,
      employeeId: dbUser.employee?.id,
      canManageEmployees: dbUser.canManageEmployees,
      canPostAnnouncements: dbUser.canPostAnnouncements,
      canApproveLeave: dbUser.canApproveLeave,
      canSubmitPerformanceReviews: dbUser.canSubmitPerformanceReviews,
      firstName: dbUser.employee?.firstName,
      name: dbUser.employee
        ? `${dbUser.employee.firstName} ${dbUser.employee.lastName}`
        : undefined,
      avatarUrl: dbUser.employee?.avatarUrl ?? undefined,
      isDemoSession: false,
    };
  } catch (e) {
    if (isDemoLoginEnabled()) {
      return demoFromCookie;
    }
    return null;
  }
}

async function getDemoSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.email) return null;

    try {
      const dbUser = await prisma.user.findFirst({
        where: {
          email: { equals: parsed.email, mode: "insensitive" },
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (dbUser) {
        return buildDemoSessionPayload(dbUser, {
          isDemoSession: parsed.isDemoSession === true,
        });
      }
    } catch (e2) {
      // DB unavailable — use cookie fallback below
    }

    if (parsed.id && parsed.email && parsed.role) {
      return { ...parsed, isDemoSession: parsed.isDemoSession === true };
    }
    return null;
  } catch (e3) {
    return null;
  }
}

export async function setDemoSession(user) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
}
