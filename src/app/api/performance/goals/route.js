import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
export async function POST(request) {
  const session = await getSession();
  if (!session.employeeId) {
    return NextResponse.json({
      error: "Employee profile required"
    }, {
      status: 403
    });
  }
  const body = await request.json();
  try {
    const goal = await prisma.goal.create({
      data: {
        employeeId: body.employeeId || session.employeeId,
        title: body.title,
        description: body.description,
        targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
        kpiMetric: body.kpiMetric,
        progress: body.progress ?? 0,
        status: body.status ?? "NOT_STARTED"
      }
    });
    return NextResponse.json({
      success: true,
      data: goal
    });
  } catch (e) {
    return NextResponse.json({
      error: "Failed to create goal"
    }, {
      status: 500
    });
  }
}
export async function PATCH(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({
    error: "Unauthorized"
  }, {
    status: 401
  });
  const {
    id,
    progress,
    status
  } = await request.json();
  try {
    const goal = await prisma.goal.update({
      where: {
        id
      },
      data: {
        progress,
        status
      }
    });
    return NextResponse.json({
      success: true,
      data: goal
    });
  } catch (e2) {
    return NextResponse.json({
      error: "Failed to update goal"
    }, {
      status: 500
    });
  }
}