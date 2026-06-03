/**
 * Seed India 2026 holidays (public + floater) for the org.
 *   npm run db:seed-holidays
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HOLIDAYS_2026 = [
  { name: "New Year's Day", date: "2026-01-01", isOptional: false },
  { name: "Republic Day", date: "2026-01-26", isOptional: false },
  { name: "Holi", date: "2026-03-04", isOptional: true },
  { name: "Eid-ul-Fitr", date: "2026-03-21", isOptional: true },
  { name: "Ram Navami", date: "2026-03-26", isOptional: true },
  { name: "Mahavir Jayanti", date: "2026-03-31", isOptional: true },
  { name: "Good Friday", date: "2026-04-03", isOptional: true },
  { name: "Buddha Purnima", date: "2026-05-01", isOptional: true },
  { name: "Bakrid (Eid-ul-Zuha)", date: "2026-05-27", isOptional: true },
  { name: "Muharram", date: "2026-06-26", isOptional: true },
  { name: "Independence Day", date: "2026-08-15", isOptional: false },
  { name: "Milad-un-Nabi", date: "2026-08-26", isOptional: true },
  { name: "Janmashtami", date: "2026-09-04", isOptional: true },
  { name: "Gandhi Jayanti", date: "2026-10-02", isOptional: false },
  { name: "Dussehra", date: "2026-10-20", isOptional: true },
  { name: "Diwali", date: "2026-11-08", isOptional: true },
  { name: "Guru Nanak Jayanti", date: "2026-11-24", isOptional: true },
  { name: "Christmas", date: "2026-12-25", isOptional: true },
];

async function main() {
  const org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) throw new Error("No organization found.");

  // Remove legacy US/2025 rows and old partial seeds
  await prisma.holiday.deleteMany({
    where: { organizationId: org.id },
  });

  for (const h of HOLIDAYS_2026) {
    await prisma.holiday.create({
      data: {
        organizationId: org.id,
        name: h.name,
        date: new Date(h.date + "T00:00:00.000Z"),
        isOptional: h.isOptional,
      },
    });
    console.log(h.isOptional ? "○" : "●", h.name, h.date);
  }

  console.log(`\nSeeded ${HOLIDAYS_2026.length} holidays for ${org.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
