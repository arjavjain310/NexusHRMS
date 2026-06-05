import { format, isSameDay } from "date-fns";

export function formatOnLeaveMessage(firstName, lastName, startDate, endDate, referenceDate = new Date()) {
  const name = `${firstName} ${lastName}`.trim();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  if (isSameDay(start, end) || isSameDay(end, today)) {
    return `${name} is on leave today`;
  }
  return `${name} is on leave until ${format(end, "d MMMM")}`;
}

export async function getOnLeaveStatusItems(prisma, organizationId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeLeaves = await prisma.leaveRequest.findMany({
    where: {
      status: "APPROVED",
      startDate: { lte: today },
      endDate: { gte: today },
      employee: { organizationId, status: { not: "TERMINATED" } },
    },
    include: {
      employee: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { endDate: "asc" },
    take: 20,
  });

  return activeLeaves.map((leave) => ({
    id: `leave-status-${leave.id}`,
    kind: "leave_status",
    title: formatOnLeaveMessage(
      leave.employee.firstName,
      leave.employee.lastName,
      leave.startDate,
      leave.endDate,
      today
    ),
    createdAt: today.toISOString(),
  }));
}
