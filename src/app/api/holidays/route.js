import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { HOLIDAYS_2026 } from "@/lib/holidays-data";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let holidays = await prisma.holiday.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { date: "asc" },
    });

    if (holidays.length === 0) {
      holidays = HOLIDAYS_2026.map((h) => ({
        id: h.date,
        name: h.name,
        date: new Date(h.date + "T00:00:00.000Z"),
        isOptional: h.isOptional,
        organizationId: session.organizationId,
      }));
    }

    const data = holidays.map((h) => ({
      id: h.id,
      name: h.name,
      date: h.date,
      isOptional: h.isOptional,
      type: h.isOptional ? "floater" : "public",
    }));

    return NextResponse.json({ success: true, data, year: 2026 });
  } catch (e) {
    console.error("[holidays GET]", e);
    const data = HOLIDAYS_2026.map((h) => ({
      id: h.date,
      name: h.name,
      date: new Date(h.date + "T00:00:00.000Z"),
      isOptional: h.isOptional,
      type: h.isOptional ? "floater" : "public",
    }));
    return NextResponse.json({ success: true, data, year: 2026 });
  }
}
