import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { canGrantPerformanceReviewAccess } from "@/lib/auth/performance-reviews";
import { getDemoSessionActionBlockedMessage } from "@/lib/auth/demo-guards";

export async function GET() {
  const session = await getSession();
  if (!session || !canGrantPerformanceReviewAccess(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        organizationId: session.organizationId,
        role: { notIn: ["ADMIN", "SENIOR_MANAGER"] },
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true },
        },
      },
      orderBy: { email: "asc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (e) {
    console.error("[performance access GET]", e);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session || !canGrantPerformanceReviewAccess(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const demoBlock = getDemoSessionActionBlockedMessage(session, "grant_access");
  if (demoBlock) {
    return NextResponse.json({ error: demoBlock }, { status: 403 });
  }

  const { userId, canSubmitPerformanceReviews } = await request.json();
  if (!userId || typeof canSubmitPerformanceReviews !== "boolean") {
    return NextResponse.json(
      { error: "userId and canSubmitPerformanceReviews (boolean) are required" },
      { status: 400 }
    );
  }

  try {
    const target = await prisma.user.findFirst({
      where: { id: userId, organizationId: session.organizationId },
      include: { employee: { select: { firstName: true } } },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "ADMIN" || target.role === "SENIOR_MANAGER") {
      return NextResponse.json(
        { error: "Administrators and Senior Managers already have review access." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { canSubmitPerformanceReviews },
    });

    return NextResponse.json({
      success: true,
      message: canSubmitPerformanceReviews
        ? `${target.employee?.firstName || "User"} can now submit performance reviews.`
        : `Removed performance review access for ${target.employee?.firstName || "user"}.`,
    });
  } catch (e) {
    console.error("[performance access PATCH]", e);
    return NextResponse.json({ error: "Failed to update access" }, { status: 500 });
  }
}
