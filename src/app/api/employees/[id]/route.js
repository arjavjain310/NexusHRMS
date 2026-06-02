import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageEmployees } from "@/lib/auth/employee-management";
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
  if (!isSelf && !canManageEmployees(session)) {
    return NextResponse.json({
      error: "Forbidden"
    }, {
      status: 403
    });
  }
  const allowedSelf = ["phone", "address", "city", "bio", "education"];
  const allowedAdmin = [...allowedSelf, "firstName", "lastName", "departmentId", "designationId", "managerId", "status", "panNumber", "uan", "pfNumber", "paymentMode", "businessUnit", "subDepartment"];
  const keys = isSelf ? allowedSelf : allowedAdmin;
  const data = {};
  for (const key of keys) {
    if (key in body) data[key] = body[key];
  }
  try {
    const employee = await prisma.employee.update({
      where: {
        id
      },
      data,
      include: {
        department: true,
        designation: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
        organization: { select: { name: true } },
      }
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

    if (employee.status === "TERMINATED") {
      return NextResponse.json({ error: "Employee is already removed." }, { status: 400 });
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

    await prisma.$transaction(async (tx) => {
      if (employee.userId) {
        await tx.user.delete({ where: { id: employee.userId } });
      }
      await tx.employee.update({
        where: { id },
        data: { status: "TERMINATED", userId: null },
      });
    });

    return NextResponse.json({
      success: true,
      message: `${employee.firstName} ${employee.lastName} was removed from Nexus-HRMS.`,
    });
  } catch (e) {
    console.error("[employee DELETE]", e);
    return NextResponse.json({ error: "Failed to remove employee" }, { status: 500 });
  }
}