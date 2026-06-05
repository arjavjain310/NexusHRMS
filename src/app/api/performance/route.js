import { NextResponse } from "next/server";
import { getOpenAIChat, getChatModel } from "@/lib/ai/openai";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  canSubmitPerformanceReviews,
  getPersonalAvgRatingDisplay,
  getPersonalReviewsCountDisplay,
  isAdminPerformanceProfile,
  isReviewSubjectExcluded,
} from "@/lib/auth/performance-reviews";
import { validatePerformanceRating, formatRatingDisplay } from "@/lib/performance/rating";

function serializeReview(r) {
  return {
    ...r,
    rating: formatRatingDisplay(r.rating),
    reviewerName: r.manager
      ? `${r.manager.firstName} ${r.manager.lastName}`.trim()
      : "Unknown",
    reviewDate: r.createdAt,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const employeeId = session.employeeId;

    const goalsPromise = employeeId
      ? prisma.goal.findMany({
          where: { employeeId },
          take: 20,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]);

    const reviewsPromise = employeeId
      ? prisma.performanceReview.findMany({
          where: { employeeId },
          include: {
            manager: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]);

    const submittedPromise =
      canSubmitPerformanceReviews(session) && session.employeeId
        ? prisma.performanceReview.findMany({
            where: {
              managerId: session.employeeId,
              employee: { organizationId: session.organizationId },
            },
            include: {
              employee: { select: { firstName: true, lastName: true, employeeCode: true } },
              manager: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
          })
        : Promise.resolve([]);

    const [goals, reviews, submittedReviews] = await Promise.all([
      goalsPromise,
      reviewsPromise,
      submittedPromise,
    ]);

    const serializedReviews = reviews.map(serializeReview);

    return NextResponse.json({
      success: true,
      data: {
        goals,
        reviews: serializedReviews,
        submittedReviews: submittedReviews.map(serializeReview),
        summary: {
          avgRating: getPersonalAvgRatingDisplay(session, reviews),
          reviewsCount: getPersonalReviewsCountDisplay(session, reviews),
          isAdminProfile: isAdminPerformanceProfile(session),
        },
      },
    });
  } catch (e) {
    console.error("[performance GET]", e);
    return NextResponse.json({ error: "Failed to load performance data" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session || !canSubmitPerformanceReviews(session)) {
    return NextResponse.json(
      { error: "Only Administrators, Senior Managers, or granted reviewers can submit reviews." },
      { status: 403 }
    );
  }

  if (!session.employeeId) {
    return NextResponse.json(
      { error: "Your account must be linked to an employee profile to submit reviews." },
      { status: 403 }
    );
  }

  const { employeeId, period, rating, feedback } = await request.json();

  if (!employeeId || !period?.trim()) {
    return NextResponse.json(
      { error: "Employee and review period are required." },
      { status: 400 }
    );
  }

  const ratingCheck = validatePerformanceRating(rating);
  if (!ratingCheck.ok) {
    return NextResponse.json({ error: ratingCheck.error }, { status: 400 });
  }

  try {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId: session.organizationId },
      include: { user: { select: { role: true } } },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (isReviewSubjectExcluded(employee.user?.role)) {
      return NextResponse.json(
        { error: "Administrator accounts cannot receive performance reviews." },
        { status: 400 }
      );
    }

    const openai = getOpenAIChat();
    let aiInsights = null;
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: getChatModel(),
          messages: [
            {
              role: "system",
              content:
                "Generate brief performance insights: strengths, improvements, growth recommendations.",
            },
            {
              role: "user",
              content: `Period: ${period}. Rating: ${ratingCheck.value}/5. Feedback: ${feedback || ""}`,
            },
          ],
          max_tokens: 300,
        });
        aiInsights = completion.choices[0]?.message?.content || null;
      } catch {
        aiInsights = null;
      }
    }

    const review = await prisma.performanceReview.create({
      data: {
        employeeId,
        managerId: session.employeeId,
        period: period.trim(),
        rating: ratingCheck.value,
        feedback: feedback?.trim() || null,
        aiInsights,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        manager: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: serializeReview(review),
    });
  } catch (e) {
    console.error("[performance POST]", e);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
