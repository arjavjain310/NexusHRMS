import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageAnnouncementAccess } from "@/lib/auth/announcements";

export async function GET() {
  const session = await getSession();
  if (!session || !canManageAnnouncementAccess(session.role)) {
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
        canPostAnnouncements: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { employee: { firstName: "asc" } },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (e) {
    console.error("[announcements access GET]", e);
    return NextResponse.json({ error: "Failed to load access list" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session || !canManageAnnouncementAccess(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, canPostAnnouncements } = await request.json();
  if (!userId || typeof canPostAnnouncements !== "boolean") {
    return NextResponse.json(
      { error: "userId and canPostAnnouncements (boolean) are required" },
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

    if (target.role === "ADMIN" && !canPostAnnouncements) {
      return NextResponse.json(
        { error: "Admins always have announcement posting access." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { canPostAnnouncements },
      select: {
        id: true,
        email: true,
        role: true,
        canPostAnnouncements: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: canPostAnnouncements
        ? `${target.employee?.firstName || "User"} can now post organization announcements.`
        : `Removed announcement access for ${target.employee?.firstName || "user"}.`,
    });
  } catch (e) {
    console.error("[announcements access PATCH]", e);
    return NextResponse.json({ error: "Failed to update access" }, { status: 500 });
  }
}
