import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.activityLog.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    return NextResponse.json({ success: true, data: items });
  } catch (e) {
    return NextResponse.json({ success: true, data: [] });
  }
}
