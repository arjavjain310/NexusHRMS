/**
 * Promote Arjav Jain to Administrator and remove Alex Admin.
 *
 * Usage (with production DATABASE_URL in .env):
 *   node scripts/migrate-admin-to-arjav.mjs
 *
 * Optional: pass Supabase user id to link on Arjav's User row:
 *   node scripts/migrate-admin-to-arjav.mjs ad9b4f6f-0edd-4039-ae45-10c06aaaad255
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const ALEX_EMAIL = "admin@nexushrms.com";
const ARJAV_EMAIL = "arjav@nexushrms.com";
const [supabaseIdArg] = process.argv.slice(2);

async function main() {
  const org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) throw new Error("No organization found.");

  let dept = await prisma.department.findFirst({
    where: { organizationId: org.id, name: "Development" },
  });
  if (!dept) {
    dept = await prisma.department.create({
      data: { name: "Development", code: "DEV", organizationId: org.id },
    });
  }
  let desigAiml = await prisma.designation.findFirst({
    where: { departmentId: dept.id, title: "AIML Engineer" },
  });
  if (!desigAiml) {
    desigAiml = await prisma.designation.create({
      data: { title: "AIML Engineer", level: 4, departmentId: dept.id },
    });
  }

  const alexUser = await prisma.user.findUnique({
    where: { email: ALEX_EMAIL },
    include: { employee: true },
  });
  let arjavUser = await prisma.user.findUnique({
    where: { email: ARJAV_EMAIL },
    include: { employee: true },
  });

  if (!arjavUser && alexUser) {
    console.log("Renaming Alex Admin → Arjav Jain in place…");
    arjavUser = await prisma.user.update({
      where: { id: alexUser.id },
      data: {
        email: ARJAV_EMAIL,
        role: UserRole.ADMIN,
        ...(supabaseIdArg ? { supabaseId: supabaseIdArg } : {}),
      },
      include: { employee: true },
    });
    if (alexUser.employee) {
      await prisma.employee.update({
        where: { id: alexUser.employee.id },
        data: {
          firstName: "Arjav",
          lastName: "Jain",
          email: ARJAV_EMAIL,
          employeeCode: "EMP001",
          departmentId: dept.id,
          designationId: desigAiml.id,
          phone: "8472835345",
          subDepartment: "Product",
          managerId: null,
          bio: "Founder & Administrator at Nexus Technologies Pvt Ltd.",
        },
      });
    }
    console.log("Done. Alex record replaced with Arjav (same ids).");
    await ensureAdminSalary(arjavUser.employee?.id || alexUser.employee?.id);
    return;
  }

  if (!arjavUser) {
    throw new Error(
      `No ${ARJAV_EMAIL} user found. Run seed or: npm run db:add-user -- ${ARJAV_EMAIL} Arjav Jain`
    );
  }

  await prisma.user.update({
    where: { id: arjavUser.id },
    data: {
      role: UserRole.ADMIN,
      organizationId: org.id,
      ...(supabaseIdArg ? { supabaseId: supabaseIdArg } : {}),
    },
  });

  let arjavEmployee = arjavUser.employee;
  if (!arjavEmployee) {
    arjavEmployee = await prisma.employee.create({
      data: {
        employeeCode: "EMP001",
        firstName: "Arjav",
        lastName: "Jain",
        email: ARJAV_EMAIL,
        phone: "8472835345",
        city: "Bangalore",
        country: "India",
        dateOfJoining: new Date(),
        organizationId: org.id,
        departmentId: dept.id,
        designationId: desigAiml.id,
        userId: arjavUser.id,
        paymentMode: "Bank Transfer",
        businessUnit: "Technology",
        subDepartment: "Product",
        managerId: null,
      },
    });
  } else {
    const alexCode = alexUser?.employee?.employeeCode;
    if (alexCode && alexCode !== "EMP001") {
      await prisma.employee.update({
        where: { id: arjavEmployee.id },
        data: { employeeCode: `EMP-${arjavEmployee.id.slice(-4)}` },
      });
    }
    arjavEmployee = await prisma.employee.update({
      where: { id: arjavEmployee.id },
      data: {
        firstName: "Arjav",
        lastName: "Jain",
        email: ARJAV_EMAIL,
        employeeCode: "EMP001",
        departmentId: dept.id,
        designationId: desigAiml.id,
        phone: "8472835345",
        subDepartment: "Product",
        managerId: null,
        userId: arjavUser.id,
        bio: "Founder & Administrator at Nexus Technologies Pvt Ltd.",
      },
    });
  }

  if (alexUser?.employee) {
    const alexEmpId = alexUser.employee.id;
    if (alexEmpId !== arjavEmployee.id) {
      await prisma.employee.updateMany({
        where: { managerId: alexEmpId },
        data: { managerId: arjavEmployee.id },
      });
      await prisma.department.updateMany({
        where: { managerId: alexEmpId },
        data: { managerId: arjavEmployee.id },
      });
      await prisma.employee.delete({ where: { id: alexEmpId } });
      console.log("Deleted Alex Admin employee profile.");
    }
  }

  if (alexUser && alexUser.id !== arjavUser.id) {
    await prisma.user.delete({ where: { id: alexUser.id } });
    console.log("Deleted Alex Admin user account.");
  }

  await ensureAdminSalary(arjavEmployee.id);

  console.log("\nSuccess:");
  console.log("  Administrator:", ARJAV_EMAIL, "(Arjav Jain, EMP001)");
  console.log("  Sign in with this email in Supabase.");
  console.log("  You can remove", ALEX_EMAIL, "from Supabase → Authentication → Users.");
}

async function ensureAdminSalary(employeeId) {
  if (!employeeId) return;
  const baseSalary = 120000;
  await prisma.salaryStructure.upsert({
    where: { employeeId },
    update: { baseSalary },
    create: {
      employeeId,
      baseSalary,
      hra: Math.round(baseSalary * 0.2),
      allowances: Math.round(baseSalary * 0.1),
      deductions: Math.round(baseSalary * 0.05),
      taxRate: 0,
      currency: "INR",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
