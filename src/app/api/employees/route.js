import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageEmployees } from "@/lib/auth/employee-management";
import { parseGender } from "@/lib/leave-eligibility";
import { purgeEmployeeCompletely } from "@/lib/employees/purge";
import { salaryStructurePayload, validateRequiredBaseSalary } from "@/lib/employees/salary";

const VALID_ROLES = ["ADMIN", "SENIOR_MANAGER", "HR_RECRUITER", "EMPLOYEE"];
const VALID_STATUSES = ["ACTIVE", "ON_LEAVE", "TERMINATED", "PROBATION"];

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
        status: { not: "TERMINATED" },
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
      include: {
        department: true,
        designation: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
        user: { select: { role: true } },
      },
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
  if (!session || !canManageEmployees(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const normalizedEmail = body.email?.trim().toLowerCase();
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const employeeCode = body.employeeCode?.trim();

  const gender = parseGender(body.gender);

  if (!normalizedEmail || !firstName || !lastName || !employeeCode || !gender) {
    return NextResponse.json(
      {
        error:
          "First name, last name, work email, employee code, and gender are required.",
      },
      { status: 400 }
    );
  }

  const salaryCheck = validateRequiredBaseSalary(body.baseSalary);
  if (!salaryCheck.ok) {
    return NextResponse.json({ error: salaryCheck.error }, { status: 400 });
  }
  const baseSalary = salaryCheck.value;

  const role = VALID_ROLES.includes(body.role) ? body.role : "EMPLOYEE";
  const status = VALID_STATUSES.includes(body.status) ? body.status : "ACTIVE";

  if (role === "ADMIN" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only administrators can create admin accounts." }, { status: 403 });
  }

  try {
    const orgId = session.organizationId;

    const conflictingEmployee = await prisma.employee.findFirst({
      where: {
        organizationId: orgId,
        OR: [
          { email: { equals: normalizedEmail, mode: "insensitive" } },
          { employeeCode },
        ],
      },
      include: { user: { select: { id: true, role: true } } },
    });

    if (conflictingEmployee) {
      if (conflictingEmployee.status === "TERMINATED") {
        await purgeEmployeeCompletely(prisma, conflictingEmployee);
      } else {
        const sameEmail =
          conflictingEmployee.email.toLowerCase() === normalizedEmail;
        return NextResponse.json(
          {
            error: sameEmail
              ? "An active employee with this email already exists."
              : "This employee code is already assigned to another active employee.",
          },
          { status: 409 }
        );
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      include: { employee: { select: { id: true, status: true } } },
    });
    if (existingUser) {
      if (!existingUser.employee) {
        await prisma.user.delete({ where: { id: existingUser.id } });
      } else if (existingUser.employee.status === "TERMINATED") {
        const stale = await prisma.employee.findUnique({
          where: { id: existingUser.employee.id },
          include: { user: { select: { id: true, role: true } } },
        });
        if (stale) await purgeEmployeeCompletely(prisma, stale);
      } else {
        return NextResponse.json(
          { error: "A user with this email already exists." },
          { status: 409 }
        );
      }
    }

    if (body.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: body.departmentId, organizationId: orgId },
      });
      if (!dept) {
        return NextResponse.json({ error: "Invalid department." }, { status: 400 });
      }
    }

    if (body.designationId) {
      const desig = await prisma.designation.findFirst({
        where: {
          id: body.designationId,
          department: { organizationId: orgId },
        },
      });
      if (!desig) {
        return NextResponse.json({ error: "Invalid designation." }, { status: 400 });
      }
      if (body.departmentId && desig.departmentId !== body.departmentId) {
        return NextResponse.json(
          { error: "Designation does not belong to the selected department." },
          { status: 400 }
        );
      }
    }

    if (body.managerId) {
      const mgr = await prisma.employee.findFirst({
        where: { id: body.managerId, organizationId: orgId },
      });
      if (!mgr) {
        return NextResponse.json({ error: "Invalid reporting manager." }, { status: 400 });
      }
    }

    const employee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          role,
          organizationId: orgId,
          canManageEmployees: false,
        },
      });

      const emp = await tx.employee.create({
        data: {
          employeeCode,
          firstName,
          lastName,
          email: normalizedEmail,
          gender,
          phone: body.phone?.trim() || null,
          city: body.city?.trim() || null,
          country: body.country?.trim() || "India",
          dateOfJoining: new Date(body.dateOfJoining || Date.now()),
          organizationId: orgId,
          departmentId: body.departmentId || null,
          designationId: body.designationId || null,
          managerId: body.managerId || null,
          status,
          userId: user.id,
          paymentMode: "Bank Transfer",
          businessUnit: body.businessUnit?.trim() || null,
          subDepartment: body.subDepartment?.trim() || null,
        },
        include: {
          department: true,
          designation: true,
          manager: { select: { id: true, firstName: true, lastName: true } },
          user: { select: { role: true } },
        },
      });

      await tx.salaryStructure.create({
        data: {
          employeeId: emp.id,
          ...salaryStructurePayload(baseSalary),
          taxRate: 0,
        },
      });

      return emp;
    });

    return NextResponse.json({
      success: true,
      data: employee,
      message: `${firstName} ${lastName} was added. They should open /signup with work email ${normalizedEmail} to create their password, then sign in.`,
    });
  } catch (e) {
    console.error("[employees POST]", e);
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Employee code or email already exists in your organization." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}

function getMockEmployees() {
  return [
    {
      id: "1",
      employeeCode: "EMP001",
      firstName: "Arjav",
      lastName: "Jain",
      email: "arjav@nexushrms.com",
      status: "ACTIVE",
      department: { name: "Engineering" },
      designation: { title: "Senior Engineer" },
    },
    {
      id: "2",
      employeeCode: "EMP002",
      firstName: "Saakshi",
      lastName: "Sinha",
      email: "saakshi@nexushrms.com",
      status: "ACTIVE",
      department: { name: "Engineering" },
      designation: { title: "Engineering Manager" },
    },
    {
      id: "3",
      employeeCode: "EMP003",
      firstName: "Harshit",
      lastName: "Raj",
      email: "harshit@nexushrms.com",
      status: "ACTIVE",
      department: { name: "Human Resources" },
      designation: { title: "HR Recruiter" },
    },
    {
      id: "4",
      employeeCode: "EMP004",
      firstName: "Maya",
      lastName: "Patel",
      email: "employee@nexushrms.com",
      status: "ACTIVE",
      department: { name: "Engineering" },
      designation: { title: "Software Engineer" },
    },
  ];
}
