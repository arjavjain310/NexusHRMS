import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subDays, format } from "date-fns";
import { USD_TO_INR } from "@/lib/constants";

export async function getDashboardData(organizationId, role, employeeId) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    employeeCount,
    activeEmployees,
    pendingLeaves,
    candidates,
    shortlisted,
    todayAttendance,
  ] = await Promise.all([
    prisma.employee.count({ where: { organizationId } }),
    prisma.employee.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.leaveRequest.count({ where: { status: "PENDING", employee: { organizationId } } }),
    prisma.candidate.count({ where: { jobPost: { organizationId } } }),
    prisma.candidate.count({ where: { jobPost: { organizationId }, status: "SHORTLISTED" } }),
    prisma.attendance.count({
      where: {
        date: new Date(now.toISOString().split("T")[0]),
        employee: { organizationId },
        status: { in: ["PRESENT", "REMOTE"] },
      },
    }),
  ]);

  const attendanceChart = await getAttendanceChart(organizationId);
  const performanceChart = await getPerformanceChart(organizationId);

  const base = {
    employeeCount,
    activeEmployees,
    pendingLeaves,
    candidates,
    shortlisted,
    todayAttendance,
    attendanceRate: employeeCount ? Math.round((todayAttendance / employeeCount) * 100) : 0,
    attendanceChart,
    performanceChart,
  };

  if (role === "EMPLOYEE" && employeeId) {
    const [leaveBalance, myAttendance, latestPayslip] = await Promise.all([
      prisma.leaveRequest.count({
        where: { employeeId, status: "APPROVED", type: "ANNUAL" },
      }),
      prisma.attendance.count({
        where: {
          employeeId,
          date: { gte: monthStart, lte: monthEnd },
          status: { in: ["PRESENT", "REMOTE"] },
        },
      }),
      prisma.payslip.findFirst({
        where: { employeeId },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),
    ]);

    return {
      ...base,
      leaveBalance: Math.max(0, 20 - leaveBalance),
      daysPresent: myAttendance,
      netPay: latestPayslip ? Number(latestPayslip.netPay) : null,
    };
  }

  if (role === "HR_RECRUITER") {
    const grouped = await prisma.candidate.groupBy({
      by: ["status"],
      where: { jobPost: { organizationId } },
      _count: { _all: true },
    });
    const pipeline = grouped.map((row) => ({
      status: row.status,
      _count: row._count?._all ?? 0,
    }));
    return { ...base, pipeline };
  }

  const payrollTotal = await prisma.payslip.aggregate({
    where: {
      employee: { organizationId },
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
    _sum: { netPay: true },
  });

  return {
    ...base,
    payrollTotal: Number(payrollTotal._sum.netPay || 0),
  };
}

async function getAttendanceChart(organizationId) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { date: d, name: format(d, "EEE") };
  });

  const counts = await Promise.all(
    days.map(async ({ date, name }) => {
      const count = await prisma.attendance.count({
        where: {
          date: new Date(date.toISOString().split("T")[0]),
          status: { in: ["PRESENT", "REMOTE"] },
          employee: { organizationId },
        },
      });
      return { name, value: count };
    })
  );

  return counts;
}

async function getPerformanceChart(organizationId) {
  const reviews = await prisma.performanceReview.findMany({
    where: { employee: { organizationId } },
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });

  if (reviews.length === 0) {
    return [
      { name: "Q1", value: 78 },
      { name: "Q2", value: 82 },
      { name: "Q3", value: 85 },
      { name: "Q4", value: 88 },
    ];
  }

  return reviews.slice(0, 6).map((r) => ({
    name: r.employee ? `${r.employee.firstName} ${r.employee.lastName}`.trim() : "Review",
    value: Math.round((r.rating || 3.5) * 20),
  }));
}

export function getMockDashboardData(role) {
  const base = {
    employeeCount: 248,
    activeEmployees: 235,
    pendingLeaves: 12,
    candidates: 86,
    shortlisted: 18,
    todayAttendance: 198,
    attendanceRate: 92,
    attendanceChart: [
      { name: "Mon", value: 210 },
      { name: "Tue", value: 215 },
      { name: "Wed", value: 208 },
      { name: "Thu", value: 220 },
      { name: "Fri", value: 198 },
      { name: "Sat", value: 45 },
      { name: "Sun", value: 12 },
    ],
    performanceChart: [
      { name: "Eng", value: 88 },
      { name: "Sales", value: 82 },
      { name: "HR", value: 90 },
      { name: "Ops", value: 79 },
    ],
    payrollTotal: Math.round(1245000 * USD_TO_INR),
    leaveBalance: 14,
    daysPresent: 18,
    netPay: Math.round(8500 * USD_TO_INR),
    pipeline: [
      { status: "NEW", _count: 24 },
      { status: "SCREENING", _count: 18 },
      { status: "SHORTLISTED", _count: 12 },
      { status: "INTERVIEW", _count: 8 },
    ],
  };
  return base;
}
