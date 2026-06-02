/**
 * Rename legacy demo employees to new team names.
 *   npm run db:rename-team
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RENAMES = [
  {
    match: { firstName: "Alex", lastName: "Admin" },
    firstName: "Ravi",
    lastName: "Kumar",
  },
  {
    match: { email: "manager@nexushrms.com" },
    firstName: "Saakshi",
    lastName: "Sinha",
  },
  {
    match: { firstName: "Sarah", lastName: "Chen" },
    firstName: "Saakshi",
    lastName: "Sinha",
  },
  {
    match: { email: "recruiter@nexushrms.com" },
    firstName: "Harshit",
    lastName: "Raj",
  },
  {
    match: { firstName: "Jordan", lastName: "Lee" },
    firstName: "Harshit",
    lastName: "Raj",
  },
];

async function main() {
  const org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) throw new Error("No organization found.");

  const updated = new Set();

  for (const r of RENAMES) {
    const where = {
      organizationId: org.id,
      ...(r.match.email
        ? { email: { equals: r.match.email, mode: "insensitive" } }
        : { firstName: r.match.firstName, lastName: r.match.lastName }),
    };

    const emp = await prisma.employee.findFirst({ where });
    if (!emp || updated.has(emp.id)) continue;

    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        firstName: r.firstName,
        lastName: r.lastName,
        bio: `${r.firstName} ${r.lastName} is a key member of the organization.`,
      },
    });
    updated.add(emp.id);
    console.log(`→ ${r.firstName} ${r.lastName} (${emp.email})`);
  }

  console.log(`\nRenamed ${updated.size} employee profile(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
