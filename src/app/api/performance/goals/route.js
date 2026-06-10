import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { assertEmployeeInOrg, getGoalInOrg } from "@/lib/auth/org-scope";

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.employeeId) {
    return NextResponse.json({ error: "Employee profile required" }, { status: 403 });
  }

  const body = await request.json();
  const targetEmployeeId = body.employeeId || session.employeeId;

  const scope = await assertEmployeeInOrg(
    prisma,
    targetEmployeeId,
    session.organizationId
  );
  if (!scope.ok) return scope.response;

  try {
    const goal = await prisma.goal.create({
      data: {
        employeeId: targetEmployeeId,
        title: body.title,
        description: body.description,
        targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
        kpiMetric: body.kpiMetric,
        progress: body.progress ?? 0,
        status: body.status ?? "NOT_STARTED",
      },
    });
    return NextResponse.json({ success: true, data: goal });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, progress, status } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Goal id is required" }, { status: 400 });
  }

  const goal = await getGoalInOrg(prisma, id, session.organizationId);
  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  try {
    const updated = await prisma.goal.update({
      where: { id },
      data: { progress, status },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (e2) {
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}
