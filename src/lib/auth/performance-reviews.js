import { averageRatingToOneDecimal } from "@/lib/performance/rating";
import { isDemoAccountUser } from "@/lib/auth/demo-accounts";

/** Admin and Senior Manager may submit reviews; others need an explicit admin grant. */
export function canSubmitPerformanceReviews(session) {
  if (!session) return false;
  if (session.role === "ADMIN" || session.role === "SENIOR_MANAGER") return true;
  return session.canSubmitPerformanceReviews === true;
}

export function canGrantPerformanceReviewAccess(session) {
  return session?.role === "ADMIN";
}

/** Demo system accounts and org admins are excluded from the review workflow. */
export function isReviewSubjectExcluded(user) {
  if (!user) return false;
  if (isDemoAccountUser(user)) return true;
  return user.role === "ADMIN";
}

export function isAdminPerformanceProfile(session) {
  if (session?.isDemoSession && session?.demoRoleKey === "admin") return true;
  return session?.role === "ADMIN" && !session?.isDemoSession;
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
