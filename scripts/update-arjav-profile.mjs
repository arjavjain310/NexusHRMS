/**
 * Update Arjav Jain founder profile (designation, dept, phone, no manager).
 *   npm run db:update-arjav-profile
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ARJAV_EMAIL = "arjav@nexushrms.com";

async function main() {
  const org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) throw new Error("No organization found.");

  let dept = await prisma.department.findFirst({
    where: { organizationId: org.id, name: { equals: "Development", mode: "insensitive" } },
  });
  if (!dept) {
    dept = await prisma.department.create({
      data: { name: "Development", code: "DEV", organizationId: org.id },
    });
    console.log("Created department: Development");
  }

  let desig = await prisma.designation.findFirst({
    where: { departmentId: dept.id, title: "AIML Engineer" },
  });
  if (!desig) {
    desig = await prisma.designation.create({
      data: { title: "AIML Engineer", level: 4, departmentId: dept.id },
    });
    console.log("Created designation: AIML Engineer");
  }

  const employee = await prisma.employee.findFirst({
    where: { organizationId: org.id, email: { equals: ARJAV_EMAIL, mode: "insensitive" } },
  });
  if (!employee) throw new Error(`No employee for ${ARJAV_EMAIL}`);

  await prisma.employee.update({
    where: { id: employee.id },
    data: {
      phone: "8472835345",
      departmentId: dept.id,
      designationId: desig.id,
      subDepartment: "Product",
      managerId: null,
      businessUnit: "Technology",
      bio: employee.bio || "Founder & Administrator at Nexus Technologies Pvt Ltd.",
    },
  });

  console.log("Updated profile for", ARJAV_EMAIL);
  console.log("  Designation: AIML Engineer");
  console.log("  Department: Development | Sub: Product");
  console.log("  Phone: 8472835345 | Manager: none");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
