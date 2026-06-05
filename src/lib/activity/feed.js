import { prisma } from "@/lib/prisma";
import { canPostAnnouncements } from "@/lib/auth/announcements";
import { hasPermission } from "@/lib/auth/permissions";
import { getOnLeaveStatusItems } from "@/lib/activity/on-leave";

const now = () => new Date();

export async function getRecentActivityFeed(session) {
  const announcementWhere = {
    organizationId: session.organizationId,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now() } }],
  };

  const [announcements, onLeaveItems] = await Promise.all([
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
    getOnLeaveStatusItems(prisma, session.organizationId),
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
    canEdit:
      session.role === "ADMIN" ||
      (a.authorId === session.id && canPostAnnouncements(session)),
  }));

  return {
    items: [...announcementItems, ...onLeaveItems].slice(0, 15),
    meta: {
      canPostAnnouncements: canPostAnnouncements(session),
      canManageAnnouncementAccess: session.role === "ADMIN",
      canManageLeave: hasPermission(session.role, "manageLeave"),
    },
  };
}
