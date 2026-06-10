import { averageRatingToOneDecimal } from "@/lib/performance/rating";

/** Admin and Senior Manager may submit reviews; others need an explicit admin grant. */
export function canSubmitPerformanceReviews(session) {
  if (!session) return false;
  if (session.role === "ADMIN" || session.role === "SENIOR_MANAGER") return true;
  return session.canSubmitPerformanceReviews === true;
}

export function canGrantPerformanceReviewAccess(session) {
  return session?.role === "ADMIN";
}

/** Organization admins are excluded from the review workflow (same in demo and production). */
export function isReviewSubjectExcluded(user) {
  if (!user) return false;
  return user.role === "ADMIN";
}

export function isAdminPerformanceProfile(session) {
  return session?.role === "ADMIN";
}

/** Personal avg rating display for the performance page stat card. */
export function getPersonalAvgRatingDisplay(session, reviews) {
  if (isAdminPerformanceProfile(session)) {
    return "5.0";
  }
  if (!reviews?.length) {
    return "—";
  }
  const ratings = reviews.map((r) => r.rating).filter((r) => r != null);
  return averageRatingToOneDecimal(ratings) ?? "—";
}

export function getPersonalReviewsCountDisplay(session, reviews) {
  if (isAdminPerformanceProfile(session)) {
    return "N/A";
  }
  return String(reviews?.length ?? 0);
}
