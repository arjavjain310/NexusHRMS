import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setDemoSession } from "@/lib/auth/session";
import { isDemoLoginEnabled } from "@/lib/auth/demo-login";
import {
  ensureDemoAccount,
  buildDemoSessionPayload,
  isValidDemoAccountKey,
} from "@/lib/auth/demo-accounts";

export async function GET() {
  return NextResponse.json({
    success: true,
    enabled: isDemoLoginEnabled(),
    roles: ["admin", "manager", "hr", "employee"],
  });
}

export async function POST(request) {
  if (!isDemoLoginEnabled()) {
    return NextResponse.json(
      { error: "Demo login is not enabled on this deployment." },
      { status: 403 }
    );
  }

  let roleKey = "admin";
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.role) roleKey = String(body.role).toLowerCase();
  } catch {
    roleKey = "admin";
  }

  if (!isValidDemoAccountKey(roleKey)) {
    return NextResponse.json({ error: "Invalid demo role." }, { status: 400 });
  }

  try {
    const { user } = await ensureDemoAccount(prisma, roleKey);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to initialize demo account." }, { status: 500 });
    }

    const sessionPayload = buildDemoSessionPayload(dbUser, {
      isDemoSession: true,
      demoRoleKey: roleKey,
    });
    await setDemoSession(sessionPayload);

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    await prisma.demoSessionLog
      .create({
        data: {
          userId: dbUser.id,
          email: dbUser.email,
          ipAddress,
          userAgent: userAgent ? `[${roleKey}] ${userAgent}` : `[${roleKey}]`,
        },
      })
      .catch((err) => console.error("[demo-login] analytics log failed:", err));

    return NextResponse.json({ success: true, role: roleKey });
  } catch (e) {
    console.error("[demo-login]", e);
    return NextResponse.json({ error: "Demo login failed. Please try again." }, { status: 500 });
  }
}
