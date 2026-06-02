"use client";

import { useEffect, useState } from "react";
import { ModuleSubNav, PAYROLL_TABS } from "@/components/layout/module-sub-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
export function PayrollSalaryClient() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/payroll").then(r => r.json()).then(j => setData(j.data));
  }, []);
  const s = data?.structure;
  const gross = s ? s.baseSalary + s.hra + s.allowances : 0;
  const net = s ? gross - (s.deductions || 0) : 0;
  return <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Pay</h1>
        <p className="text-muted-foreground mt-1">Salary structure and compensation overview</p>
      </div>
      <ModuleSubNav items={PAYROLL_TABS} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Monthly Gross</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(gross)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(s.deductions || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Net Monthly</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{formatCurrency(net)}</p>
          </CardContent>
        </Card>
      </div>

      {s && <Card>
          <CardHeader>
            <CardTitle>Salary Breakup</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {[["Basic Salary", s.baseSalary], ["HRA", s.hra], ["Allowances", s.allowances], ["Deductions", -s.deductions]].map(([label, amt]) => <tr key={label} className="border-b">
                    <td className="py-3">{label}</td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(Math.abs(amt))}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </CardContent>
        </Card>}
    </div>;
}