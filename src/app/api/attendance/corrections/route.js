import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getAttendanceDate } from "@/lib/attendance";
import { logActivity, notifyApprovers } from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session?.employeeId) {
    return NextResponse.json({ error: "Employee profile required" }, { status: 403 });
  }

  try {
    const list = await prisma.attendanceCorrection.findMany({
      where: { employeeId: session.employeeId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ success: true, data: list });
  } catch (e) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.employeeId) {
    return NextResponse.json({ error: "Employee profile required" }, { status: 403 });
  }

  const { date, reason } = await request.json();
  if (!date || !reason?.trim()) {
    return NextResponse.json(
      { error: "Date and reason are required" },
      { status: 400 }
    );
  }

  try {
    const correction = await prisma.attendanceCorrection.create({
      data: {
        employeeId: session.employeeId,
        date: getAttendanceDate(new Date(date)),
        reason: reason.trim(),
      },
    });

    await notifyApprovers(session.organizationId, {
      type: "ATTENDANCE_CORRECTION_PENDING",
      title: "Attendance correction requested",
      message: `${session.name || "An employee"} requested attendance regularization.`,
      href: "/approvals",
    });

    await logActivity(session.organizationId, {
      userId: session.id,
      action: "attendance_correction_requested",
      entity: "AttendanceCorrection",
      entityId: correction.id,
      metadata: { date },
    });

    return NextResponse.json({ success: true, data: correction });
  } catch (e) {
    console.error("[attendance corrections POST]", e);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
