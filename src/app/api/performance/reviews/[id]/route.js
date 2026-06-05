import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  canSubmitPerformanceReviews,
  isReviewSubjectExcluded,
} from "@/lib/auth/performance-reviews";
import { validatePerformanceRating } from "@/lib/performance/rating";

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session || !canSubmitPerformanceReviews(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const ratingCheck = validatePerformanceRating(body.rating);
  if (!ratingCheck.ok) {
    return NextResponse.json({ error: ratingCheck.error }, { status: 400 });
  }

  if (!body.period?.trim()) {
    return NextResponse.json({ error: "Review period is required." }, { status: 400 });
  }

  try {
    const existing = await prisma.performanceReview.findFirst({
      where: {
        id,
        employee: { organizationId: session.organizationId },
      },
      include: {
        employee: {
          include: { user: { select: { role: true } } },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (isReviewSubjectExcluded(existing.employee.user?.role)) {
      return NextResponse.json(
        { error: "Administrator accounts cannot receive performance reviews." },
        { status: 400 }
      );
    }

    if (session.role !== "ADMIN" && existing.managerId !== session.employeeId) {
      return NextResponse.json(
        { error: "You can only edit reviews you submitted." },
        { status: 403 }
      );
    }

    const updated = await prisma.performanceReview.update({
      where: { id },
      data: {
        period: body.period.trim(),
        rating: ratingCheck.value,
        feedback: body.feedback?.trim() || null,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        manager: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("[performance review PATCH]", e);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
