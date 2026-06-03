import { prisma } from "@/lib/prisma";
import { getDefaultHolidays2026, toHolidayRows } from "@/lib/holidays-data";

const YEAR_START = new Date("2026-01-01T00:00:00.000Z");
const YEAR_END = new Date("2026-12-31T23:59:59.999Z");

export async function getOrganizationHolidays2026(organizationId) {
  try {
    const rows = await prisma.holiday.findMany({
      where: {
        organizationId,
        date: { gte: YEAR_START, lte: YEAR_END },
      },
      orderBy: { date: "asc" },
    });

    if (rows.length >= 4) {
      return toHolidayRows(rows);
    }
  } catch (e) {
    console.error("[getOrganizationHolidays2026]", e);
  }

  return getDefaultHolidays2026();
}
