"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";











export function ModuleSubNav({ items, className }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex flex-wrap gap-6 border-b text-xs font-semibold tracking-wide",
        className
      )}
    >
      {items.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "pb-3 -mb-px border-b-2 transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}

export const ME_MODULE_TABS = [
  { label: "Attendance", href: "/attendance" },
  { label: "Leave", href: "/leave" },
  { label: "Performance", href: "/performance" },
  { label: "Payroll", href: "/payroll" },
];

export const PAYROLL_TABS = [
  { label: "My Salary", href: "/payroll" },
  { label: "Pay Slips", href: "/payroll/payslips" },
  { label: "Income Tax", href: "/payroll/tax" },
];
