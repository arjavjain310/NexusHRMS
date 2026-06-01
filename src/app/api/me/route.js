import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

/** Current user's employee profile */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!session.employeeId) {
    return NextResponse.json(
      { error: "No employee profile linked. Use employee@nexus.demo to sign in." },
      { status: 404 }
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { id: session.employeeId },
    include: {
      department: true,
      designation: true,
      manager: { select: { firstName: true, lastName: true } },
      organization: { select: { name: true } },
      salaryStructure: true,
      payslips: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 12 },
      goals: { orderBy: { updatedAt: "desc" }, take: 10 },
      reviews: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: employee });
}
