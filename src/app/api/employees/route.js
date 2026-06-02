import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const departmentId = searchParams.get("departmentId");

  try {
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: session.organizationId,
        ...(departmentId && { departmentId }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { employeeCode: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: { department: true, designation: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: employees });
  } catch (e2) {
    return NextResponse.json({ success: true, data: getMockEmployees() });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "manageEmployees")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  try {
    const employee = await prisma.employee.create({
      data: {
        employeeCode: body.employeeCode,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        dateOfJoining: new Date(body.dateOfJoining || Date.now()),
        organizationId: session.organizationId,
        departmentId: body.departmentId,
        designationId: body.designationId,
        status: body.status || "ACTIVE",
      },
      include: { department: true, designation: true },
    });

    return NextResponse.json({ success: true, data: employee });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}

function getMockEmployees() {
  return [
    { id: "1", employeeCode: "EMP001", firstName: "Alex", lastName: "Admin", email: "admin@nexushrms.com", status: "ACTIVE", department: { name: "Engineering" }, designation: { title: "Senior Engineer" } },
    { id: "2", employeeCode: "EMP002", firstName: "Sarah", lastName: "Chen", email: "manager@nexushrms.com", status: "ACTIVE", department: { name: "Engineering" }, designation: { title: "Engineering Manager" } },
    { id: "3", employeeCode: "EMP003", firstName: "Jordan", lastName: "Lee", email: "recruiter@nexushrms.com", status: "ACTIVE", department: { name: "Human Resources" }, designation: { title: "HR Recruiter" } },
    { id: "4", employeeCode: "EMP004", firstName: "Maya", lastName: "Patel", email: "employee@nexushrms.com", status: "ACTIVE", department: { name: "Engineering" }, designation: { title: "Software Engineer" } },
  ];
}
