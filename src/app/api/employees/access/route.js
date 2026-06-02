import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { isOrgAdmin } from "@/lib/auth/employee-management";

/** Admin: list who can add/remove employees; grant or revoke access */
export async function GET() {
  const session = await getSession();
  if (!session || !isOrgAdmin(session.role)) {
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

export async function PATCH(request) {
  const session = await getSession();
  if (!session || !isOrgAdmin(session.role)) {
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
