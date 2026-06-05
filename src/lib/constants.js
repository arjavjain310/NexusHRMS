import { DEMO_MODE_PASSWORD } from "@/lib/auth/demo-password";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Nexus HRMS";

/** Shown beside the logo in sidebar and header */
export const BRAND_TITLE = process.env.NEXT_PUBLIC_BRAND_TITLE || "Nexus-HRMS";

/** Brand assets in /public */
export const LOGO_SRC = "/logo.png";
export const LOGO_ICON_SRC = "/favicon.png";

/** Show demo quick-login buttons on /login (local dev only). */
export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Default currency for payroll and financial displays */
export const DEFAULT_CURRENCY = "INR";
export const CURRENCY_LOCALE = "en-IN";
/** Approximate rate used to convert legacy USD demo amounts to INR */
export const USD_TO_INR = 83;

export const ROLE_LABELS = {
  ADMIN: "Administrator",
  SENIOR_MANAGER: "Senior Manager",
  HR_RECRUITER: "HR Recruiter",
  EMPLOYEE: "Employee",
};

export const DEMO_CREDENTIALS = [
  { email: "arjav@nexushrms.com", password: DEMO_MODE_PASSWORD, role: "ADMIN" },
  { email: "ravi@nexushrms.com", password: DEMO_MODE_PASSWORD, role: "ADMIN" },
  { email: "saakshi@nexushrms.com", password: DEMO_MODE_PASSWORD, role: "SENIOR_MANAGER" },
  { email: "harshit@nexushrms.com", password: DEMO_MODE_PASSWORD, role: "HR_RECRUITER" },
  { email: "employee@nexushrms.com", password: DEMO_MODE_PASSWORD, role: "EMPLOYEE" },
];

export { DEMO_MODE_PASSWORD };

export const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "My Profile", href: "/me/profile", icon: "User" },
  { title: "Employees", href: "/employees", icon: "Users", roles: ["ADMIN", "SENIOR_MANAGER", "HR_RECRUITER"] },
  { title: "Attendance", href: "/attendance", icon: "Clock" },
  { title: "Leave", href: "/leave", icon: "CalendarDays" },
  { title: "Leave Management", href: "/leave-management", icon: "CalendarRange", roles: ["ADMIN", "SENIOR_MANAGER", "HR_RECRUITER"] },
  { title: "Approvals", href: "/approvals", icon: "ClipboardCheck", roles: ["ADMIN"] },
  { title: "Payroll", href: "/payroll", icon: "Wallet", roles: ["ADMIN", "SENIOR_MANAGER", "EMPLOYEE"] },
  { title: "Performance", href: "/performance", icon: "TrendingUp" },
  { title: "Recruitment", href: "/recruitment", icon: "Briefcase", roles: ["ADMIN", "HR_RECRUITER", "SENIOR_MANAGER"] },
  { title: "Resume AI", href: "/recruitment/resume-screening", icon: "FileSearch", roles: ["ADMIN", "HR_RECRUITER"] },
  { title: "AI Assistant", href: "/ai-assistant", icon: "Bot" },
  { title: "Voice Interview", href: "/recruitment/voice-interview", icon: "Mic", roles: ["ADMIN", "HR_RECRUITER", "EMPLOYEE"] },
  { title: "Holidays", href: "/holidays", icon: "PartyPopper" },
];

export const LEAVE_TYPE_LABELS = {
  ANNUAL: "Annual Leave",
  SICK: "Sick Leave",
  CASUAL: "Casual Leave",
  MATERNITY: "Maternity Leave",
  PATERNITY: "Paternity Leave",
  UNPAID: "Unpaid Leave",
};

export const GENDER_LABELS = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

export const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"];
