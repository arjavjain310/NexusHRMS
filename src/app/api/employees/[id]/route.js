import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
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
    const isAdmin = hasPermission(session.role, "manageEmployees");
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
  if (!isSelf && !hasPermission(session.role, "manageEmployees")) {
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
        manager: true
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