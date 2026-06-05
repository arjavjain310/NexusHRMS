import { prisma } from "@/lib/prisma";

export async function createNotification({ userId, type, title, message, href }) {
  try {
    return await prisma.notification.create({
      data: { userId, type, title, message, href: href ?? null },
    });
  } catch (e) {
    console.error("[createNotification]", e);
    return null;
  }
}

export async function logActivity(
  organizationId,
  { userId, employeeId, action, entity, entityId, metadata }
) {
  try {
    return await prisma.activityLog.create({
      data: {
        organizationId,
        userId: userId ?? null,
        employeeId: employeeId ?? null,
        action,
        entity: entity ?? null,
        entityId: entityId ?? null,
        metadata: metadata ?? undefined,
      },
    });
  } catch (e) {
    console.error("[logActivity]", e);
    return null;
  }
}

/** Notify admins about a new leave request */
export async function notifyLeaveApprovers(organizationId, payload) {
  const admins = await prisma.user.findMany({
    where: { organizationId, role: "ADMIN" },
    select: { id: true },
  });
  await Promise.all(admins.map((u) => createNotification({ userId: u.id, ...payload })));
}

/** Notify admins and senior managers (attendance corrections, etc.) */
export async function notifyApprovers(organizationId, payload) {
  const approvers = await prisma.user.findMany({
    where: {
      organizationId,
      role: { in: ["ADMIN", "SENIOR_MANAGER"] },
    },
    select: { id: true },
  });
  await Promise.all(
    approvers.map((u) => createNotification({ userId: u.id, ...payload }))
  );
}

export async function getEmployeeUserId(employeeId) {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { userId: true },
  });
  return emp?.userId ?? null;
}
