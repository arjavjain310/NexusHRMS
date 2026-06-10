import { UserRole, Gender } from "@prisma/client";

const DEMO_EMAIL_PREFIX = process.env.DEMO_EMAIL_PREFIX || "demo";

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
  },
};

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
