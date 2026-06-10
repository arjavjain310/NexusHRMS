/** Client-safe demo role cards (no emails or secrets). */
export const QUICK_DEMO_ROLES = [
  {
    key: "admin",
    label: "Admin",
    description: "Full HRMS access",
    colorClass: "border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300",
    dotClass: "bg-violet-500",
  },
  {
    key: "manager",
    label: "Manager",
    description: "Team & approvals",
    colorClass: "border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300",
    dotClass: "bg-blue-500",
  },
  {
    key: "hr",
    label: "HR",
    description: "Recruitment & records",
    colorClass: "border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300",
    dotClass: "bg-teal-500",
  },
  {
    key: "employee",
    label: "Employee",
    description: "Self-service portal",
    colorClass: "border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-300",
    dotClass: "bg-orange-500",
  },
];
