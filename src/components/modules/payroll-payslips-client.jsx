"use client";

import { useEffect, useState } from "react";
import { ModuleSubNav, PAYROLL_TABS } from "@/components/layout/module-sub-nav";
import { PayslipView } from "@/components/payroll/payslip-view";
import { cn } from "@/lib/utils";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function PayrollPayslipsClient() {
  const [payslips, setPayslips] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [orgName, setOrgName] = useState();
  const [year, setYear] = useState(new Date().getFullYear());
  useEffect(() => {
    fetch("/api/payroll").then(r => r.json()).then(j => {
      const list = j.data?.payslips || [];
      setPayslips(list);
      setOrgName(j.data?.organizationName);
      if (list.length) setSelectedId(list[0].id);
    });
  }, []);
  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/payroll?id=${selectedId}`).then(r => r.json()).then(j => setDetail(j.data));
  }, [selectedId]);
  const filtered = payslips.filter(p => p.year === year);
  return <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pay Slips</h1>
        <p className="text-muted-foreground mt-1">
          Manage all payslips generated for applicable years
        </p>
      </div>
      <ModuleSubNav items={PAYROLL_TABS} />

      <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
        <aside className="w-full lg:w-56 shrink-0 space-y-4">
          <select className="w-full h-10 rounded-lg border bg-background px-3 text-sm" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2026, 2025, 2024].map(y => <option key={y} value={y}>
                Year {y}
              </option>)}
          </select>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Payslips
          </p>
          <ul className="space-y-1">
            {filtered.map(p => <li key={p.id}>
                <button type="button" onClick={() => setSelectedId(p.id)} className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", selectedId === p.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted")}>
                  {MONTHS[p.month - 1]} {p.year}
                </button>
              </li>)}
            {!filtered.length && <p className="text-sm text-muted-foreground px-3">No payslips for this year</p>}
          </ul>
        </aside>

        <div className="flex-1 min-w-0">
          {detail ? <PayslipView payslip={detail} orgName={orgName} /> : <div className="border rounded-lg p-12 text-center text-muted-foreground">
              Select a payslip to preview
            </div>}
        </div>
      </div>
    </div>;
}