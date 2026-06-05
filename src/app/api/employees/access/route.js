import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { canGrantEmployeeManagementAccess, isOrgAdmin } from "@/lib/auth/employee-management";

/** Admin: list who can add/remove employees; grant or revoke access */
export async function GET() {
  const session = await getSession();
  if (!session || !canGrantEmployeeManagementAccess(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        organizationId: session.organizationId,
        employee: { isNot: null },
      },
      select: {
        id: true,
        email: true,
        role: true,
        canManageEmployees: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            status: true,
          },
        },
      },
      orderBy: { employee: { firstName: "asc" } },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (e) {
    console.error("[employees access GET]", e);
    return NextResponse.json({ error: "Failed to load access list" }, { status: 500 });
  }
}

/** Admin: revoke employee-management access from all non-admin users */
export async function POST() {
  const session = await getSession();
  if (!session || !canGrantEmployeeManagementAccess(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await prisma.user.updateMany({
      where: {
        organizationId: session.organizationId,
        role: { not: "ADMIN" },
        canManageEmployees: true,
      },
      data: { canManageEmployees: false },
    });

    return NextResponse.json({
      success: true,
      revokedCount: result.count,
      message:
        result.count > 0
          ? `Removed employee management access from ${result.count} user(s). Only administrators can add or remove employees unless you grant access again.`
          : "No delegated employee management access was active.",
    });
  } catch (e) {
    console.error("[employees access POST]", e);
    return NextResponse.json({ error: "Failed to revoke access" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session || !canGrantEmployeeManagementAccess(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, canManageEmployees } = await request.json();
  if (!userId || typeof canManageEmployees !== "boolean") {
    return NextResponse.json(
      { error: "userId and canManageEmployees (boolean) are required" },
      { status: 400 }
    );
  }

  try {
    const target = await prisma.user.findFirst({
      where: { id: userId, organizationId: session.organizationId },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "ADMIN" && !canManageEmployees) {
      return NextResponse.json(
        { error: "Admins always have employee management access." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { canManageEmployees },
      select: {
        id: true,
        email: true,
        role: true,
        canManageEmployees: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: canManageEmployees
        ? `${target.employee?.firstName || "User"} can now add and remove employees.`
        : `Removed employee management access for ${target.employee?.firstName || "user"}.`,
    });
  } catch (e) {
    console.error("[employees access PATCH]", e);
    return NextResponse.json({ error: "Failed to update access" }, { status: 500 });
  }
}
