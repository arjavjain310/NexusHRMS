import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { canPostAnnouncements } from "@/lib/auth/announcements";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.announcement.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { publishedAt: "desc" },
      take: 50,
      include: {
        author: {
          select: {
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    return NextResponse.json({ success: true, data: items });
  } catch (e) {
    console.error("[announcements GET]", e);
    return NextResponse.json({ error: "Failed to load announcements" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session || !canPostAnnouncements(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, content, priority, expiresAt } = await request.json();
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  try {
    const announcement = await prisma.announcement.create({
      data: {
        organizationId: session.organizationId,
        authorId: session.id,
        title: title.trim(),
        content: content.trim(),
        priority: priority === "high" ? "high" : "normal",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    return NextResponse.json({ success: true, data: announcement });
  } catch (e) {
    console.error("[announcements POST]", e);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
