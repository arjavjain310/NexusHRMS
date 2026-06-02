/**
 * Add or update a company user + employee in Neon (required before Supabase sign-up / sign-in).
 *
 * Usage:
 *   node scripts/ensure-company-user.mjs arjav@nexushrms.com Arjav Jain
 *   node scripts/ensure-company-user.mjs arjav@nexushrms.com Arjav Jain ad9b4f6f-0edd-4039-ae45-10c06aaaad255
 *
 * Requires DATABASE_URL in .env (or environment).
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const [emailArg, firstName = "New", lastName = "Employee", supabaseIdArg] = process.argv.slice(2);
const email = emailArg?.trim().toLowerCase();

if (!email) {
  console.error(
    "Usage: node scripts/ensure-company-user.mjs <email> [firstName] [lastName] [supabaseUserId]"
  );
  process.exit(1);
}

async function main() {
  const org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) {
    throw new Error("No organization found. Run: npm run db:seed");
  }

  const dept = await prisma.department.findFirst({
    where: { organizationId: org.id, name: "Engineering" },
  });
  const designation = await prisma.designation.findFirst({
    where: { departmentId: dept?.id, title: "Software Engineer" },
  });
  const manager = await prisma.employee.findFirst({
    where: {
      organizationId: org.id,
      user: { role: UserRole.SENIOR_MANAGER },
    },
  });

  const code =
    "EMP" +
    String(
      (await prisma.employee.count({ where: { organizationId: org.id } })) + 1
    ).padStart(3, "0");

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      ...(supabaseIdArg ? { supabaseId: supabaseIdArg } : {}),
    },
    create: {
      email,
      role: UserRole.EMPLOYEE,
      organizationId: org.id,
      ...(supabaseIdArg ? { supabaseId: supabaseIdArg } : {}),
    },
  });

  const employee = await prisma.employee.upsert({
    where: {
      organizationId_email: { organizationId: org.id, email },
    },
    update: {
      firstName,
      lastName,
      userId: user.id,
      managerId: manager?.id,
    },
    create: {
      employeeCode: code,
      firstName,
      lastName,
      email,
      phone: "+91-9000000000",
      city: "Bangalore",
      country: "India",
      dateOfJoining: new Date(),
      organizationId: org.id,
      departmentId: dept?.id ?? undefined,
      designationId: designation?.id ?? undefined,
      userId: user.id,
      managerId: manager?.id,
      panNumber: `PAN${code}`,
      businessUnit: "Technology",
      subDepartment: "Product",
      paymentMode: "Bank Transfer",
    },
  });

  const baseSalary = 15000;
  await prisma.salaryStructure.upsert({
    where: { employeeId: employee.id },
    update: { baseSalary },
    create: {
      employeeId: employee.id,
      baseSalary,
      hra: Math.round(baseSalary * 0.2),
      allowances: Math.round(baseSalary * 0.1),
      deductions: Math.round(baseSalary * 0.05),
      taxRate: 0,
      currency: "INR",
    },
  });

  console.log("OK — company user ready:");
  console.log("  email:", email);
  console.log("  userId:", user.id);
  console.log("  employeeId:", employee.id);
  console.log("  employeeCode:", employee.employeeCode);
  if (supabaseIdArg) {
    console.log("  supabaseId linked:", supabaseIdArg);
    console.log("\nYou can sign in at /login (no sign-up needed).");
  } else {
    console.log("\nNext: sign in at /login — your Supabase account will link automatically.");
    console.log("If sign-up fails because Supabase already has this email, use Sign in only.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
