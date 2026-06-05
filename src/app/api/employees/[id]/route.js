import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  canManageEmployees,
  canModifyEmployeeRecord,
  getEditableEmployeeFields,
} from "@/lib/auth/employee-management";
import { parseGender } from "@/lib/leave-eligibility";
import { purgeEmployeeCompletely } from "@/lib/employees/purge";
import { getAttendanceDayRange, serializeAttendanceRecord } from "@/lib/attendance";
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
    const { salaryStructure: _salary, ...profile } = employee;
    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        education: Array.isArray(employee.education) ? employee.education : [],
        documents: employee.documents ?? [],
        attendanceStatus,
        todayAttendance: todayAttendance ? serializeAttendanceRecord(todayAttendance) : null,
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

  const data = {};
  for (const key of allowedKeys) {
    if (key in body) data[key] = body[key];
  }
  if ("gender" in data) {
    const gender = parseGender(data.gender);
    if (!gender) {
      return NextResponse.json(
        { error: "Gender must be Male, Female, or Other." },
        { status: 400 }
      );
    }
    data.gender = gender;
  }

  const VALID_ROLES = ["ADMIN", "SENIOR_MANAGER", "HR_RECRUITER", "EMPLOYEE"];
  const roleUpdate = body.role && VALID_ROLES.includes(body.role) ? body.role : null;

  if (roleUpdate) {
    if (isSelf || !canManage) {
      return NextResponse.json(
        { error: "Only administrators or users with employee-management access can change roles." },
        { status: 403 }
      );
    }
  }

  try {
    const existing = await prisma.employee.findFirst({
      where: { id, organizationId: session.organizationId },
      include: { user: { select: { id: true, role: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (roleUpdate && !isSelf && canManage && existing.userId) {
      if (roleUpdate === "ADMIN" && session.role !== "ADMIN") {
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
      await prisma.user.update({
        where: { id: existing.userId },
        data: { role: roleUpdate },
      });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data,
      include: {
        department: true,
        designation: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
        organization: { select: { name: true } },
        user: { select: { role: true } },
      },
    });
    return NextResponse.json({
      success: true,
      data: employee
    });
  } catch (e) {
    return NextResponse.json({
      error: "Update failed"
    }, {
      status: 500
    });
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