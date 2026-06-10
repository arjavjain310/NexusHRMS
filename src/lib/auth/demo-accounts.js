import { UserRole, Gender } from "@prisma/client";

const DEMO_EMAIL_PREFIX = process.env.DEMO_EMAIL_PREFIX || "demo";

/** Server-only demo account emails — never sent to the client. */
export const DEMO_ACCOUNT_KEYS = ["admin", "manager", "hr", "employee"];

export const DEMO_ACCOUNTS = {
  admin: {
    key: "admin",
    email: process.env.DEMO_ADMIN_EMAIL || `${DEMO_EMAIL_PREFIX}-admin@nexushrms.com`,
    role: UserRole.ADMIN,
    firstName: "Demo",
    lastName: "Admin",
    employeeCode: "DEMO001",
    gender: Gender.MALE,
    departmentName: "Development",
    designationTitle: "AIML Engineer",
    baseSalary: 150000,
    city: "Bangalore",
    canManageEmployees: false,
    canSubmitPerformanceReviews: false,
  },
  manager: {
    key: "manager",
    email: process.env.DEMO_MANAGER_EMAIL || `${DEMO_EMAIL_PREFIX}-manager@nexushrms.com`,
    role: UserRole.SENIOR_MANAGER,
    firstName: "Demo",
    lastName: "Manager",
    employeeCode: "DEMO002",
    gender: Gender.FEMALE,
    departmentName: "Engineering",
    designationTitle: "Senior Engineer",
    baseSalary: 95000,
    city: "Bangalore",
    canManageEmployees: false,
    canSubmitPerformanceReviews: false,
  },
  hr: {
    key: "hr",
    email: process.env.DEMO_HR_EMAIL || `${DEMO_EMAIL_PREFIX}-hr@nexushrms.com`,
    role: UserRole.HR_RECRUITER,
    firstName: "Demo",
    lastName: "HR",
    employeeCode: "DEMO003",
    gender: Gender.MALE,
    departmentName: "Human Resources",
    designationTitle: "HR Recruiter",
    baseSalary: 75000,
    city: "Mumbai",
    canManageEmployees: false,
    canSubmitPerformanceReviews: false,
  },
  employee: {
    key: "employee",
    email: process.env.DEMO_EMPLOYEE_EMAIL || `${DEMO_EMAIL_PREFIX}-employee@nexushrms.com`,
    role: UserRole.EMPLOYEE,
    firstName: "Demo",
    lastName: "Employee",
    employeeCode: "DEMO004",
    gender: Gender.FEMALE,
    departmentName: "Engineering",
    designationTitle: "Software Engineer",
    baseSalary: 45000,
    city: "Bangalore",
    canManageEmployees: false,
    canSubmitPerformanceReviews: false,
  },
};

/** Emails that must never be removed during demo reset. */
export const PRESERVED_DEMO_ORG_EMAILS = [
  ...Object.values(DEMO_ACCOUNTS).map((a) => a.email.toLowerCase()),
  "arjav@nexushrms.com",
  "ravi@nexushrms.com",
  "saakshi@nexushrms.com",
  "harshit@nexushrms.com",
  "employee@nexushrms.com",
];

export function isValidDemoAccountKey(key) {
  return DEMO_ACCOUNT_KEYS.includes(key);
}

export function getDemoAccountByKey(key) {
  return DEMO_ACCOUNTS[key] || null;
}

export function isDemoAccountEmail(email) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return Object.values(DEMO_ACCOUNTS).some(
    (a) => a.email.toLowerCase() === normalized
  );
}

export function isDemoAccountUser(user) {
  return Boolean(user?.isDemoAccount) || isDemoAccountEmail(user?.email);
}

/** @deprecated use isDemoAccountEmail */
export function isDemoAdminEmail(email) {
  return isDemoAccountEmail(email);
}

/** @deprecated use isDemoAccountUser */
export function isDemoAdminUser(user) {
  return isDemoAccountUser(user);
}

async function getOrCreateOrg(prisma) {
  return (
    (await prisma.organization.findFirst({ where: { slug: "nexus-demo" } })) ||
    (await prisma.organization.create({
      data: {
        name: "Nexus Technologies Pvt Ltd",
        slug: "nexus-demo",
        timezone: "Asia/Kolkata",
      },
    }))
  );
}

async function resolveDeptAndDesignation(prisma, orgId, departmentName, designationTitle) {
  let dept = await prisma.department.findFirst({
    where: { organizationId: orgId, name: departmentName },
  });
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: departmentName,
        code: departmentName.slice(0, 3).toUpperCase(),
        organizationId: orgId,
      },
    });
  }

  let designation = await prisma.designation.findFirst({
    where: { departmentId: dept.id, title: designationTitle },
  });
  if (!designation) {
    designation = await prisma.designation.create({
      data: { title: designationTitle, level: 2, departmentId: dept.id },
    });
  }

  return { dept, designation };
}

export async function ensureDemoAccount(prisma, key) {
  const config = getDemoAccountByKey(key);
  if (!config) throw new Error(`Unknown demo account key: ${key}`);

  const org = await getOrCreateOrg(prisma);
  const { dept, designation } = await resolveDeptAndDesignation(
    prisma,
    org.id,
    config.departmentName,
    config.designationTitle
  );

  const user = await prisma.user.upsert({
    where: { email: config.email },
    update: {
      role: config.role,
      isDemoAccount: true,
      organizationId: org.id,
      canManageEmployees: config.canManageEmployees,
      canSubmitPerformanceReviews: config.canSubmitPerformanceReviews,
    },
    create: {
      email: config.email,
      role: config.role,
      isDemoAccount: true,
      organizationId: org.id,
      canManageEmployees: config.canManageEmployees,
      canSubmitPerformanceReviews: config.canSubmitPerformanceReviews,
    },
  });

  const employee = await prisma.employee.upsert({
    where: {
      organizationId_email: { organizationId: org.id, email: config.email },
    },
    update: {
      firstName: config.firstName,
      lastName: config.lastName,
      gender: config.gender,
      employeeCode: config.employeeCode,
      departmentId: dept.id,
      designationId: designation.id,
      status: "ACTIVE",
      userId: user.id,
      city: config.city,
    },
    create: {
      employeeCode: config.employeeCode,
      firstName: config.firstName,
      lastName: config.lastName,
      email: config.email,
      gender: config.gender,
      phone: "+91-9000000000",
      city: config.city,
      country: "India",
      dateOfJoining: new Date(),
      organizationId: org.id,
      departmentId: dept.id,
      designationId: designation.id,
      userId: user.id,
      status: "ACTIVE",
      paymentMode: "Bank Transfer",
      bio: `Demo ${config.key} account for exploring Nexus HRMS.`,
    },
  });

  await prisma.salaryStructure.upsert({
    where: { employeeId: employee.id },
    update: { baseSalary: config.baseSalary },
    create: {
      employeeId: employee.id,
      baseSalary: config.baseSalary,
      hra: Math.round(config.baseSalary * 0.2),
      allowances: Math.round(config.baseSalary * 0.1),
      deductions: Math.round(config.baseSalary * 0.05),
      taxRate: 0,
      currency: "INR",
    },
  });

  return { user, employee, organization: org, config };
}

export async function ensureAllDemoAccounts(prisma) {
  const results = {};
  for (const key of DEMO_ACCOUNT_KEYS) {
    results[key] = await ensureDemoAccount(prisma, key);
  }
  return results;
}

/** @deprecated use ensureDemoAccount(prisma, 'admin') */
export async function ensureDemoAdmin(prisma) {
  return ensureDemoAccount(prisma, "admin");
}

export function buildDemoSessionPayload(dbUser, { isDemoSession = false, demoRoleKey = null } = {}) {
  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    organizationId: dbUser.organizationId,
    employeeId: dbUser.employee?.id,
    canManageEmployees: dbUser.canManageEmployees,
    canPostAnnouncements: dbUser.canPostAnnouncements,
    canApproveLeave: dbUser.canApproveLeave,
    canSubmitPerformanceReviews: dbUser.canSubmitPerformanceReviews,
    firstName: dbUser.employee?.firstName,
    name: dbUser.employee
      ? `${dbUser.employee.firstName} ${dbUser.employee.lastName}`
      : "Demo User",
    avatarUrl: dbUser.employee?.avatarUrl ?? undefined,
    isDemoSession,
    demoRoleKey,
  };
}
