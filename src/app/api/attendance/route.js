import { NextResponse } from "next/server";
import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getAttendanceDate, getAttendanceDayRange, serializeAttendanceRecord } from "@/lib/attendance";
async function findTodayRecord(employeeId) {
  const {
    start,
    end
  } = getAttendanceDayRange();
  return prisma.attendance.findFirst({
    where: {
      employeeId,
      date: {
        gte: start,
        lt: end
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}
async function listRecords(employeeId, organizationId) {
  const since = subDays(getAttendanceDate(), 30);
  return prisma.attendance.findMany({
    where: employeeId ? {
      employeeId,
      date: {
        gte: since
      }
    } : {
      employee: {
        organizationId
      },
      date: {
        gte: since
      }
    },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeCode: true
        }
      }
    },
    orderBy: [{
      date: "desc"
    }, {
      checkIn: "desc"
    }],
    take: 60
  });
}
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  try {
    const records = await listRecords(session.employeeId, session.organizationId);
    const todayRecord = session.employeeId ? await findTodayRecord(session.employeeId) : null;
    const serialized = records.map(serializeAttendanceRecord);
    const today = todayRecord ? serializeAttendanceRecord(todayRecord) : null;
    return NextResponse.json({
      success: true,
      data: serialized,
      today,
      status: {
        checkedIn: !!today?.checkIn,
        checkedOut: !!today?.checkOut,
        canCheckIn: !today?.checkIn || !!today?.checkOut,
        canCheckOut: !!today?.checkIn && !today?.checkOut
      },
      employeeId: session.employeeId ?? null
    });
  } catch (error) {
    console.error("[attendance GET]", error);
    return NextResponse.json({
      error: "Failed to load attendance"
    }, {
      status: 500
    });
  }
}
export async function POST(request) {
  const session = await getSession();
  if (!session.employeeId) {
    return NextResponse.json({
      error: "No employee profile on your session. Please log out and sign in with an employee account."
    }, {
      status: 403
    });
  }
  const body = await request.json();
  const action = body.action;
  const source = body.source || "web";
  if (action !== "check-in" && action !== "check-out") {
    return NextResponse.json({
      error: "Invalid action"
    }, {
      status: 400
    });
  }
  const today = getAttendanceDate();
  const now = new Date();
  const clockNote = source === "remote" ? "REMOTE_CLOCK_IN" : "WEB_CLOCK_IN";
  try {
    const existing = await findTodayRecord(session.employeeId);
    if (action === "check-in") {
      if (existing.checkIn && !existing.checkOut) {
        return NextResponse.json({
          error: "You are already clocked in today"
        }, {
          status: 409
        });
      }
      let record;
      if (existing) {
        record = await prisma.attendance.update({
          where: {
            id: existing.id
          },
          data: {
            checkIn: now,
            checkOut: null,
            status: source === "remote" ? "REMOTE" : "PRESENT",
            notes: clockNote,
            date: today
          }
        });
      } else {
        record = await prisma.attendance.create({
          data: {
            employeeId: session.employeeId,
            date: today,
            checkIn: now,
            checkOut: null,
            status: source === "remote" ? "REMOTE" : "PRESENT",
            notes: clockNote
          }
        });
      }
      const allRecords = await listRecords(session.employeeId, session.organizationId);
      return NextResponse.json({
        success: true,
        data: serializeAttendanceRecord(record),
        records: allRecords.map(serializeAttendanceRecord),
        message: "Clocked in successfully"
      });
    }
    if (!existing.checkIn) {
      return NextResponse.json({
        error: "Please clock in before clocking out"
      }, {
        status: 400
      });
    }
    if (existing.checkOut) {
      return NextResponse.json({
        error: "You have already clocked out today"
      }, {
        status: 409
      });
    }
    const record = await prisma.attendance.update({
      where: {
        id: existing.id
      },
      data: {
        checkOut: now
      }
    });
    const allRecords = await listRecords(session.employeeId, session.organizationId);
    return NextResponse.json({
      success: true,
      data: serializeAttendanceRecord(record),
      records: allRecords.map(serializeAttendanceRecord),
      message: "Clocked out successfully"
    });
  } catch (error) {
    console.error("[attendance POST]", error);
    return NextResponse.json({
      error: "Failed to save attendance. Check database connection."
    }, {
      status: 500
    });
  }
}