import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { canPostAnnouncements } from "@/lib/auth/announcements";

async function findAnnouncement(id, organizationId) {
  return prisma.announcement.findFirst({
    where: { id, organizationId },
  });
}

function canEditAnnouncement(session, announcement) {
  if (!announcement) return false;
  if (session.role === "ADMIN") return true;
  return announcement.authorId === session.id && canPostAnnouncements(session);
}

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session || !canPostAnnouncements(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await findAnnouncement(id, session.organizationId);
  if (!existing || !canEditAnnouncement(session, existing)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { title, content, priority, expiresAt } = await request.json();
  try {
    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title?.trim() ? { title: title.trim() } : {}),
        ...(content?.trim() ? { content: content.trim() } : {}),
        ...(priority ? { priority: priority === "high" ? "high" : "normal" } : {}),
        expiresAt: expiresAt === null ? null : expiresAt ? new Date(expiresAt) : undefined,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("[announcements PATCH]", e);
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session || !canPostAnnouncements(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await findAnnouncement(id, session.organizationId);
  if (!existing || !canEditAnnouncement(session, existing)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[announcements DELETE]", e);
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
