"use client";

import { useCallback, useEffect, useState } from "react";
import { ModuleSubNav, PAYROLL_TABS } from "@/components/layout/module-sub-nav";
import { PayslipView } from "@/components/payroll/payslip-view";
import { PAYSLIP_MONTHS } from "@/lib/payroll/payslip";
import { Loader2 } from "lucide-react";

const YEAR_OPTIONS = [2026, 2025, 2024];

export function PayrollPayslipsClient() {
  const now = new Date();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(now.getFullYear() === 2026 ? now.getMonth() + 1 : 4);
  const [detail, setDetail] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [available, setAvailable] = useState([]);

  const loadPayslip = useCallback(async (y, m) => {
    setLoading(true);
    setError(null);
    setDetail(null);
    try {
      const res = await fetch(`/api/payroll?month=${m}&year=${y}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not load payslip");
        return;
      }
      setDetail(json.data);
      setGeneratedAt(json.generatedAt || new Date().toISOString());
    } catch {
      setError("Failed to load payslip");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/payroll")
      .then((r) => r.json())
      .then((j) => setAvailable(j.data?.payslips || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadPayslip(year, month);
  }, [year, month, loadPayslip]);

  const hasStored = available.some((p) => p.year === year && p.month === month);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pay Slips</h1>
        <p className="text-muted-foreground mt-1">
          Choose month and year to view or download your Nexus-HRMS payslip
        </p>
      </div>
      <ModuleSubNav items={PAYROLL_TABS} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Year</label>
          <select
            className="w-full sm:w-40 h-10 rounded-lg border bg-background px-3 text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Month</label>
          <select
            className="w-full sm:w-48 h-10 rounded-lg border bg-background px-3 text-sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {PAYSLIP_MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        {hasStored && (
          <p className="text-xs text-muted-foreground sm:pb-2">Official payslip on file</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          {error}
        </p>
      )}

      <div className="min-h-[500px]">
        {loading ? (
          <div className="border rounded-lg p-16 flex justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : detail ? (
          <PayslipView payslip={detail} generatedAt={generatedAt} />
        ) : (
          <div className="border rounded-lg p-12 text-center text-muted-foreground">
            Select a month and year to generate your payslip
          </div>
        )}
      </div>
    </div>
  );
}
