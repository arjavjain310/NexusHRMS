import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: session.id, read: false },
    });
    return NextResponse.json({ success: true, data: notifications, unreadCount });
  } catch (e) {
    console.error("[notifications GET]", e);
    return NextResponse.json({ success: true, data: [], unreadCount: 0 });
  }
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  try {
    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: session.id },
        data: { read: body.read ?? true },
      });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
