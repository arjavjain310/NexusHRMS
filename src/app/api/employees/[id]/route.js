import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  canManageEmployees,
  canModifyEmployeeRecord,
  getEditableEmployeeFields,
  isOrgAdmin,
} from "@/lib/auth/employee-management";
import { parseGender } from "@/lib/leave-eligibility";
import { purgeEmployeeCompletely } from "@/lib/employees/purge";
import {
  salaryStructurePayload,
  validateRequiredBaseSalary,
} from "@/lib/employees/salary";
import { getAttendanceDayRange, serializeAttendanceRecord } from "@/lib/attendance";

const VALID_STATUSES = ["ACTIVE", "ON_LEAVE", "TERMINATED", "PROBATION"];
export async function GET(_request, {
  params
}) {
  const session = await getSession();
  if (!session) return NextResponse.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const {
    id
  } = await params;
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        id,
        organizationId: session.organizationId
      },
      include: {
        department: true,
        designation: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true
          }
        },
        documents: {
          orderBy: {
            uploadedAt: "desc"
          }
        },
        salaryStructure: true,
        user: { select: { role: true } },
        organization: {
          select: {
            name: true
          }
        }
      }
    });
    if (!employee) {
      return NextResponse.json({
        error: "Employee not found"
      }, {
        status: 404
      });
    }
    const isSelf = session.employeeId === id;
    const isAdmin = canManageEmployees(session);
    if (!isSelf && !isAdmin && session.role !== "SENIOR_MANAGER") {
      return NextResponse.json({
        error: "Forbidden"
      }, {
        status: 403
      });
    }
    const {
      start,
      end
    } = getAttendanceDayRange();
    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: id,
        date: {
          gte: start,
          lt: end
        }
      }
    });
    let attendanceStatus = "NOT_IN_YET";
    if (todayAttendance?.checkIn && todayAttendance?.checkOut) {
      attendanceStatus = "CLOCKED_OUT";
    } else if (todayAttendance?.checkIn) {
      attendanceStatus = "CLOCKED_IN";
    }
    const { salaryStructure, ...profile } = employee;
    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        education: Array.isArray(employee.education) ? employee.education : [],
        documents: employee.documents ?? [],
        attendanceStatus,
        todayAttendance: todayAttendance ? serializeAttendanceRecord(todayAttendance) : null,
        baseSalary: salaryStructure ? Number(salaryStructure.baseSalary) : null,
      },
    });
  } catch (error) {
    console.error("[employee GET]", error);
    return NextResponse.json({
      error: "Failed to load employee"
    }, {
      status: 500
    });
  }
}
export async function PATCH(request, {
  params
}) {
  const session = await getSession();
  if (!session) return NextResponse.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const {
    id
  } = await params;
  const body = await request.json();
  const isSelf = session.employeeId === id;
  const canManage = canManageEmployees(session);

  if (!canModifyEmployeeRecord(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowedKeys = getEditableEmployeeFields(session, id);
  const disallowedKeys = Object.keys(body).filter(
    (key) => key !== "role" && !allowedKeys.includes(key)
  );
  if (disallowedKeys.length > 0) {
    return NextResponse.json(
      {
        error: isSelf
          ? "You can only update your own contact info, summary, and education."
          : "Only administrators or users with employee-management access can modify employee records.",
      },
      { status: 403 }
    );
  }

  const employeeData = {};
  for (const key of allowedKeys) {
    if (key in body && key !== "baseSalary") employeeData[key] = body[key];
  }

  if ("gender" in employeeData) {
    const gender = parseGender(employeeData.gender);
    if (!gender) {
      return NextResponse.json(
        { error: "Gender must be Male, Female, or Other." },
        { status: 400 }
      );
    }
    employeeData.gender = gender;
  }

  const VALID_ROLES = ["ADMIN", "SENIOR_MANAGER", "HR_RECRUITER", "EMPLOYEE"];
  const roleInBody =
    body.role && VALID_ROLES.includes(body.role) ? body.role : null;

  let baseSalaryUpdate = null;
  if (canManage && allowedKeys.includes("baseSalary")) {
    if (!("baseSalary" in body)) {
      return NextResponse.json(
        { error: "Monthly Base Salary is required." },
        { status: 400 }
      );
    }
    const salaryCheck = validateRequiredBaseSalary(body.baseSalary);
    if (!salaryCheck.ok) {
      return NextResponse.json({ error: salaryCheck.error }, { status: 400 });
    }
    baseSalaryUpdate = salaryCheck.value;
  }

  try {
    const existing = await prisma.employee.findFirst({
      where: { id, organizationId: session.organizationId },
      include: {
        user: { select: { id: true, role: true, email: true } },
        salaryStructure: { select: { baseSalary: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const roleUpdate =
      roleInBody && roleInBody !== existing.user?.role ? roleInBody : null;

    if (roleUpdate) {
      if (!canManage) {
        return NextResponse.json(
          {
            error:
              "Only administrators or users with employee-management access can change roles.",
          },
          { status: 403 }
        );
      }
      if (isSelf && !isOrgAdmin(session.role)) {
        return NextResponse.json(
          { error: "You cannot change your own system role." },
          { status: 403 }
        );
      }
      if (roleUpdate === "ADMIN" && !isOrgAdmin(session.role)) {
        return NextResponse.json(
          { error: "Only administrators can assign the admin role." },
          { status: 403 }
        );
      }
      if (existing.user?.role === "ADMIN" && roleUpdate !== "ADMIN") {
        const adminCount = await prisma.user.count({
          where: { organizationId: session.organizationId, role: "ADMIN" },
        });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "Cannot change role of the only admin in the organization." },
            { status: 400 }
          );
        }
      }
    }

    if ("email" in employeeData) {
      const normalizedEmail = employeeData.email?.trim().toLowerCase();
      if (!normalizedEmail) {
        return NextResponse.json({ error: "Work email is required." }, { status: 400 });
      }
      const emailConflict = await prisma.employee.findFirst({
        where: {
          organizationId: session.organizationId,
          email: { equals: normalizedEmail, mode: "insensitive" },
          NOT: { id },
        },
      });
      if (emailConflict) {
        return NextResponse.json(
          { error: "An active employee with this email already exists." },
          { status: 409 }
        );
      }
      employeeData.email = normalizedEmail;
    }

    if ("employeeCode" in employeeData) {
      const employeeCode = employeeData.employeeCode?.trim();
      if (!employeeCode) {
        return NextResponse.json({ error: "Employee code is required." }, { status: 400 });
      }
      const codeConflict = await prisma.employee.findFirst({
        where: {
          organizationId: session.organizationId,
          employeeCode,
          NOT: { id },
        },
      });
      if (codeConflict) {
        return NextResponse.json(
          { error: "This employee code is already assigned to another employee." },
          { status: 409 }
        );
      }
      employeeData.employeeCode = employeeCode;
    }

    if ("status" in employeeData && !VALID_STATUSES.includes(employeeData.status)) {
      return NextResponse.json({ error: "Invalid employment status." }, { status: 400 });
    }

    if ("dateOfJoining" in employeeData) {
      employeeData.dateOfJoining = new Date(employeeData.dateOfJoining || Date.now());
    }

    if (employeeData.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: employeeData.departmentId, organizationId: session.organizationId },
      });
      if (!dept) {
        return NextResponse.json({ error: "Invalid department." }, { status: 400 });
      }
    }

    if (employeeData.designationId) {
      const desig = await prisma.designation.findFirst({
        where: {
          id: employeeData.designationId,
          department: { organizationId: session.organizationId },
        },
      });
      if (!desig) {
        return NextResponse.json({ error: "Invalid designation." }, { status: 400 });
      }
      if (employeeData.departmentId && desig.departmentId !== employeeData.departmentId) {
        return NextResponse.json(
          { error: "Designation does not belong to the selected department." },
          { status: 400 }
        );
      }
    }

    if (employeeData.managerId) {
      if (employeeData.managerId === id) {
        return NextResponse.json(
          { error: "An employee cannot be their own reporting manager." },
          { status: 400 }
        );
      }
      const mgr = await prisma.employee.findFirst({
        where: { id: employeeData.managerId, organizationId: session.organizationId },
      });
      if (!mgr) {
        return NextResponse.json({ error: "Invalid reporting manager." }, { status: 400 });
      }
    }

    const employee = await prisma.$transaction(async (tx) => {
      if (roleUpdate && canManage && existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { role: roleUpdate },
        });
      }

      if ("email" in employeeData && existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { email: employeeData.email },
        });
      }

      const updated = await tx.employee.update({
        where: { id },
        data: employeeData,
        include: {
          department: true,
          designation: true,
          manager: { select: { id: true, firstName: true, lastName: true } },
          organization: { select: { name: true } },
          user: { select: { role: true } },
          salaryStructure: true,
        },
      });

      if (baseSalaryUpdate != null) {
        await tx.salaryStructure.upsert({
          where: { employeeId: id },
          create: { employeeId: id, ...salaryStructurePayload(baseSalaryUpdate) },
          update: salaryStructurePayload(baseSalaryUpdate),
        });
        const withSalary = await tx.employee.findUnique({
          where: { id },
          include: {
            department: true,
            designation: true,
            manager: { select: { id: true, firstName: true, lastName: true } },
            organization: { select: { name: true } },
            user: { select: { role: true } },
            salaryStructure: true,
          },
        });
        return withSalary;
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...employee,
        baseSalary: employee.salaryStructure
          ? Number(employee.salaryStructure.baseSalary)
          : null,
      },
      message: `${employee.firstName} ${employee.lastName} was updated successfully.`,
    });
  } catch (e) {
    console.error("[employee PATCH]", e);
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Employee code or email already exists in your organization." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await getSession();
  if (!session || !canManageEmployees(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (session.employeeId === id) {
    return NextResponse.json(
      { error: "You cannot remove your own employee record." },
      { status: 400 }
    );
  }

  try {
    const employee = await prisma.employee.findFirst({
      where: { id, organizationId: session.organizationId },
      include: { user: { select: { id: true, role: true } } },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (employee.user?.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { organizationId: session.organizationId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the only admin in the organization." },
          { status: 400 }
        );
      }
    }

    await purgeEmployeeCompletely(prisma, employee);

    return NextResponse.json({
      success: true,
      message: `${employee.firstName} ${employee.lastName} was permanently removed. You can add them again with the same email or employee code.`,
    });
  } catch (e) {
    console.error("[employee DELETE]", e);
    return NextResponse.json({ error: "Failed to remove employee" }, { status: 500 });
  }
}