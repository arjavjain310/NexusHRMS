import { differenceInCalendarDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getEligibleLeaveTypes } from "@/lib/leave-eligibility";

export const LEAVE_ENTITLEMENTS = {
  ANNUAL: 20,
  SICK: 10,
  CASUAL: 5,
  MATERNITY: 90,
  PATERNITY: 10,
  UNPAID: 999,
};

function daysInclusive(start, end) {
  return differenceInCalendarDays(new Date(end), new Date(start)) + 1;
}

export async function getLeaveBalances(employeeId, gender = null) {
  const eligibleTypes = getEligibleLeaveTypes(gender);
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const approved = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status: "APPROVED",
      endDate: { gte: yearStart },
    },
    select: { type: true, startDate: true, endDate: true },
  });

  const used = {};
  for (const leave of approved) {
    const days = Math.max(0, daysInclusive(leave.startDate, leave.endDate));
    used[leave.type] = (used[leave.type] || 0) + days;
  }

  const pending = await prisma.leaveRequest.findMany({
    where: { employeeId, status: "PENDING" },
    select: { type: true, startDate: true, endDate: true },
  });

  const pendingDays = {};
  for (const leave of pending) {
    const days = Math.max(0, daysInclusive(leave.startDate, leave.endDate));
    pendingDays[leave.type] = (pendingDays[leave.type] || 0) + days;
  }

  return Object.entries(LEAVE_ENTITLEMENTS)
    .filter(([type]) => eligibleTypes.includes(type))
    .map(([type, entitlement]) => {
      const usedCount = used[type] || 0;
      const pendingCount = pendingDays[type] || 0;
      const remaining = Math.max(0, entitlement - usedCount - pendingCount);
      return {
        type,
        entitlement,
        used: usedCount,
        pending: pendingCount,
        remaining,
      };
    });
}
