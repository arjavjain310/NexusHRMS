/**
 * Add standard departments (and a default designation each) to the org.
 *   npm run db:seed-departments
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: "Finance", code: "FIN", designation: "Finance Analyst" },
  { name: "Operations", code: "OPS", designation: "Operations Associate" },
  { name: "Data Analytics", code: "DATA", designation: "Data Analyst" },
  { name: "Product Management", code: "PM", designation: "Product Manager" },
  { name: "Sales", code: "SALES", designation: "Sales Executive" },
  { name: "Customer Support", code: "CS", designation: "Support Specialist" },
];

async function main() {
  const org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) throw new Error("No organization found.");

  for (const d of DEPARTMENTS) {
    const dept = await prisma.department.upsert({
      where: {
        organizationId_name: { organizationId: org.id, name: d.name },
      },
      update: { code: d.code },
      create: {
        name: d.name,
        code: d.code,
        organizationId: org.id,
      },
    });

    const existing = await prisma.designation.findFirst({
      where: { departmentId: dept.id, title: d.designation },
    });
    if (!existing) {
      await prisma.designation.create({
        data: { title: d.designation, level: 2, departmentId: dept.id },
      });
    }
    console.log("✓", d.name);
  }

  console.log("\nDepartments ready for", org.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
