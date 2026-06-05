import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { canApproveLeave, canApproveLeaveRequest } from "@/lib/auth/leave-approval";
import { createNotification, notifyLeaveApprovers } from "@/lib/notifications";
import { validateLeaveTypeForGender } from "@/lib/leave-eligibility";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const leaves = await prisma.leaveRequest.findMany({
      where: { employeeId: session.employeeId || "none" },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ success: true, data: leaves });
  } catch (e) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session.employeeId) {
    return NextResponse.json({ error: "Employee profile required" }, { status: 403 });
  }

  const body = await request.json();

  const employee = await prisma.employee.findUnique({
    where: { id: session.employeeId },
    select: { gender: true, firstName: true, lastName: true },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
  }

  const eligibility = validateLeaveTypeForGender(employee.gender, body.type);
  if (!eligibility.ok) {
    return NextResponse.json({ error: eligibility.error }, { status: 400 });
  }

  try {
    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: session.employeeId,
        type: body.type,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        reason: body.reason,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    await notifyLeaveApprovers(session.organizationId, {
      type: "LEAVE_PENDING",
      title: "New leave request",
      message: `${employee.firstName} ${employee.lastName} requested ${body.type} leave.`,
      href: "/approvals",
    });

    return NextResponse.json({ success: true, data: leave });
  } catch (e) {
    console.error("[leave POST]", e);
    return NextResponse.json({ error: "Failed to submit leave" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session || !canApproveLeave(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status, rejectReason } = await request.json();
  try {
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
        rejectReason,
        approvedBy: session.id,
      },
      include: { employee: true },
    });

    if (leave.employee.userId) {
      await createNotification({
        userId: leave.employee.userId,
        type: status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
        title: status === "APPROVED" ? "Leave approved" : "Leave rejected",
        message:
          status === "APPROVED"
            ? `Your ${leave.type} leave request was approved.`
            : `Your leave was rejected.${rejectReason ? ` ${rejectReason}` : ""}`,
        href: "/leave",
      });
    }

    return NextResponse.json({ success: true, data: leave });
  } catch (e) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
