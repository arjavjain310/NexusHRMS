import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/auth/permissions";
import { canPostAnnouncements } from "@/lib/auth/announcements";
import { APPROVER_VISIBLE_ACTIONS } from "@/lib/activity/constants";

const now = () => new Date();

export async function getRecentActivityFeed(session) {
  const isApprover = hasPermission(session.role, "approveLeave");

  const announcementWhere = {
    organizationId: session.organizationId,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now() } }],
  };

  const activityWhere = isApprover
    ? {
        organizationId: session.organizationId,
        OR: [
          ...(session.employeeId ? [{ employeeId: session.employeeId }] : []),
          { action: { in: APPROVER_VISIBLE_ACTIONS } },
        ],
      }
    : {
        organizationId: session.organizationId,
        employeeId: session.employeeId || "none",
        action: { in: APPROVER_VISIBLE_ACTIONS.concat(["payroll_published"]) },
      };

  const [announcements, activities] = await Promise.all([
    prisma.announcement.findMany({
      where: announcementWhere,
      orderBy: { publishedAt: "desc" },
      take: 10,
      include: {
        author: {
          select: {
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    prisma.activityLog.findMany({
      where: activityWhere,
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    const pa = a.priority === "high" ? 1 : 0;
    const pb = b.priority === "high" ? 1 : 0;
    if (pb !== pa) return pb - pa;
    return b.publishedAt.getTime() - a.publishedAt.getTime();
  });

  const announcementItems = sortedAnnouncements.map((a) => ({
    id: `announcement-${a.id}`,
    kind: "announcement",
    title: a.title,
    content: a.content,
    priority: a.priority,
    authorName: a.author?.employee
      ? `${a.author.employee.firstName} ${a.author.employee.lastName}`
      : "Admin",
    createdAt: a.publishedAt.toISOString(),
    announcementId: a.id,
    canEdit: session.role === "ADMIN" || a.authorId === session.id,
  }));

  const activityItems = activities.map((item) => ({
    id: `activity-${item.id}`,
    kind: "activity",
    action: item.action,
    metadata: item.metadata,
    createdAt: item.createdAt.toISOString(),
  }));

  return {
    items: [...announcementItems, ...activityItems].slice(0, 15),
    meta: {
      canPostAnnouncements: canPostAnnouncements(session),
      canManageAnnouncementAccess: session.role === "ADMIN",
      isApprover,
    },
  };
}
