import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { canApproveLeave, canApproveLeaveRequest } from "@/lib/auth/leave-approval";
import { createNotification, logActivity } from "@/lib/notifications";
import { getAttendanceDayRange } from "@/lib/attendance";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canReviewLeave = canApproveLeave(session);
  const canReviewAttendance = hasPermission(session.role, "approveLeave") || session.role === "SENIOR_MANAGER";
  if (!canReviewLeave && !canReviewAttendance) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [leaves, corrections] = await Promise.all([
      canReviewLeave
        ? prisma.leaveRequest.findMany({
        where: {
          status: "PENDING",
          employee: { organizationId: session.organizationId },
          ...(session.employeeId ? { employeeId: { not: session.employeeId } } : {}),
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
        : Promise.resolve([]),
      canReviewAttendance
        ? prisma.attendanceCorrection.findMany({
        where: {
          status: "PENDING",
          employee: { organizationId: session.organizationId },
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      success: true,
      data: { leaves, corrections },
    });
  } catch (e) {
    console.error("[approvals GET]", e);
    return NextResponse.json({
      success: true,
      data: { leaves: [], corrections: [] },
    });
  }
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { kind, id, status, rejectReason } = body;

  try {
    if (kind === "leave") {
      if (!canApproveLeave(session)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const existing = await prisma.leaveRequest.findFirst({
        where: {
          id,
          employee: { organizationId: session.organizationId },
        },
      });
      if (!existing || !canApproveLeaveRequest(session, existing.employeeId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const leave = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status,
          approvedAt: status === "APPROVED" ? new Date() : undefined,
          rejectReason: status === "REJECTED" ? rejectReason : null,
          approvedBy: session.id,
        },
        include: { employee: true },
      });

      const userId = leave.employee.userId;
      if (userId) {
        await createNotification({
          userId,
          type: status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
          title: status === "APPROVED" ? "Leave approved" : "Leave rejected",
          message:
            status === "APPROVED"
              ? `Your ${leave.type} leave was approved.`
              : `Your leave request was rejected.${rejectReason ? ` Reason: ${rejectReason}` : ""}`,
          href: "/leave",
        });
      }

      return NextResponse.json({ success: true, data: leave });
    }

    if (kind === "attendance") {
      if (!hasPermission(session.role, "approveLeave") && session.role !== "SENIOR_MANAGER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const correction = await prisma.attendanceCorrection.update({
        where: { id },
        data: {
          status,
          reviewedById: session.id,
          reviewedAt: new Date(),
          rejectReason: status === "REJECTED" ? rejectReason : null,
        },
        include: { employee: true },
      });

      if (status === "APPROVED") {
        const { start, end } = getAttendanceDayRange(new Date(correction.date));
        const existing = await prisma.attendance.findFirst({
          where: {
            employeeId: correction.employeeId,
            date: { gte: start, lt: end },
          },
        });
        if (existing) {
          await prisma.attendance.update({
            where: { id: existing.id },
            notes: `Correction approved: ${correction.reason}`,
          });
        }
      }

      const empUserId = correction.employee.userId;
      if (empUserId) {
        await createNotification({
          userId: empUserId,
          type:
            status === "APPROVED"
              ? "ATTENDANCE_CORRECTION_APPROVED"
              : "ATTENDANCE_CORRECTION_REJECTED",
          title:
            status === "APPROVED"
              ? "Attendance correction approved"
              : "Attendance correction rejected",
          message:
            status === "APPROVED"
              ? "Your attendance regularization request was approved."
              : `Your request was rejected.${rejectReason ? ` ${rejectReason}` : ""}`,
          href: "/attendance",
        });
      }

      await logActivity(session.organizationId, {
        userId: session.id,
        employeeId: correction.employeeId,
        action: `attendance_correction_${status.toLowerCase()}`,
        entity: "AttendanceCorrection",
        entityId: correction.id,
        metadata: {
          employeeName: `${correction.employee.firstName} ${correction.employee.lastName}`,
        },
      });

      return NextResponse.json({ success: true, data: correction });
    }

    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  } catch (e) {
    console.error("[approvals PATCH]", e);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
