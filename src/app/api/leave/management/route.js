import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET(request) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "manageLeave")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employee: { organizationId: session.organizationId },
        ...(status && status !== "ALL" ? { status } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const counts = await prisma.leaveRequest.groupBy({
      by: ["status"],
      where: { employee: { organizationId: session.organizationId } },
      _count: { _all: true },
    });

    const stats = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };
    for (const row of counts) {
      stats[row.status] = row._count._all;
    }

    return NextResponse.json({ success: true, data: leaves, stats });
  } catch (e) {
    console.error("[leave management GET]", e);
    return NextResponse.json({ error: "Failed to load leave records" }, { status: 500 });
  }
}
