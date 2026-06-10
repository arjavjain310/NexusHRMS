import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  canSubmitPerformanceReviews,
  canGrantPerformanceReviewAccess,
  isAdminPerformanceProfile,
} from "@/lib/auth/performance-reviews";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canSubmit = canSubmitPerformanceReviews(session);

  try {
    const employees = canSubmit
      ? await prisma.employee.findMany({
          where: {
            organizationId: session.organizationId,
            status: { not: "TERMINATED" },
            user: { isDemoAccount: false, role: { not: "ADMIN" } },
          },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            user: { select: { role: true } },
          },
        })
      : [];

    return NextResponse.json({
      success: true,
      data: {
        canSubmitReviews: canSubmit,
        canGrantReviewAccess: canGrantPerformanceReviewAccess(session),
        isAdminProfile: isAdminPerformanceProfile(session),
        employees,
      },
    });
  } catch (e) {
    console.error("[performance meta GET]", e);
    return NextResponse.json({ error: "Failed to load performance options" }, { status: 500 });
  }
}
