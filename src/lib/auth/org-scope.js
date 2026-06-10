import { NextResponse } from "next/server";

export async function getEmployeeInOrg(prisma, employeeId, organizationId) {
  if (!employeeId || !organizationId) return null;
  return prisma.employee.findFirst({
    where: { id: employeeId, organizationId },
  });
}

export async function assertEmployeeInOrg(prisma, employeeId, organizationId) {
  const employee = await getEmployeeInOrg(prisma, employeeId, organizationId);
  if (!employee) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Employee not found" }, { status: 404 }),
    };
  }
  return { ok: true, employee };
}

export async function getGoalInOrg(prisma, goalId, organizationId) {
  if (!goalId || !organizationId) return null;
  return prisma.goal.findFirst({
    where: { id: goalId, employee: { organizationId } },
    include: { employee: { select: { id: true, organizationId: true } } },
  });
}
