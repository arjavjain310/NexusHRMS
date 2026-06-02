"use client";

import { useEffect, useState } from "react";
import { ModuleSubNav, PAYROLL_TABS } from "@/components/layout/module-sub-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
export function PayrollTaxClient() {
  const [tax, setTax] = useState(null);
  useEffect(() => {
    fetch("/api/payroll").then(r => r.json()).then(j => setTax(j.data.taxSummary));
  }, []);
  const items = tax ? [{
    label: "Net Taxable Income",
    value: tax.netTaxableIncome
  }, {
    label: "Gross Income Tax",
    value: tax.grossIncomeTax
  }, {
    label: "Net Income Tax Payable",
    value: tax.netIncomeTaxPayable
  }, {
    label: "Tax Paid Till Now",
    value: tax.taxPaid
  }, {
    label: "Remaining Tax",
    value: tax.remainingTax
  }] : [];
  return <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Income Tax</h1>
        <p className="text-muted-foreground mt-1">
          Tax computation based on {tax?.regime || "New Tax Regime"}
        </p>
      </div>
      <ModuleSubNav items={PAYROLL_TABS} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Calculations consider declared investment amounts regardless of approval status.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {items.map(item => <div key={item.label} className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground uppercase">{item.label}</p>
                <p className="text-lg font-semibold mt-1">{formatCurrency(item.value)}</p>
              </div>)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
              A
            </span>
            Gross Earnings from Employment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Projected monthly stipend/salary breakdown for the financial year (INR).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border px-3 py-2 text-left">Salary Breakup</th>
                  <th className="border px-3 py-2">Total</th>
                  {["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map(m => <th key={m} className="border px-2 py-2">
                        {m}
                      </th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-2 font-medium">Stipend / Salary</td>
                  <td className="border px-3 py-2 text-center">
                    {formatCurrency(tax?.netTaxableIncome ? tax.netTaxableIncome / 12 : 0)}
                  </td>
                  {Array.from({
                  length: 12
                }).map((_, i) => <td key={i} className="border px-2 py-2 text-center">
                      {formatCurrency(tax?.netTaxableIncome ? tax.netTaxableIncome / 12 : 0)}
                    </td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>;
}