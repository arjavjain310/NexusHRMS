import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageEmployees, isOrgAdmin } from "@/lib/auth/employee-management";

/** Departments, designations, managers, and form defaults for Add Employee */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [departments, designations, managers, employeeCount] = await Promise.all([
      prisma.department.findMany({
        where: { organizationId: session.organizationId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
      }),
      prisma.designation.findMany({
        where: { department: { organizationId: session.organizationId } },
        orderBy: { title: "asc" },
        select: { id: true, title: true, departmentId: true, level: true },
      }),
      prisma.employee.findMany({
        where: { organizationId: session.organizationId, status: "ACTIVE" },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
        },
      }),
      prisma.employee.count({ where: { organizationId: session.organizationId } }),
    ]);

    const suggestedCode = `EMP${String(employeeCount + 1).padStart(3, "0")}`;

    return NextResponse.json({
      success: true,
      data: {
        departments,
        designations,
        managers,
        suggestedCode,
        canManageEmployees: canManageEmployees(session),
        isAdmin: isOrgAdmin(session.role),
      },
    });
  } catch (e) {
    console.error("[employees meta GET]", e);
    return NextResponse.json({ error: "Failed to load form options" }, { status: 500 });
  }
}
