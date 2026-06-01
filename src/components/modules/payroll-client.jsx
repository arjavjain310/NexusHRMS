"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";
export function PayrollClient() {
  const [payslips, setPayslips] = useState([]);
  useEffect(() => {
    fetch("/api/payroll").then(r => r.json()).then(j => setPayslips(j.data.payslips || []));
  }, []);
  const totalNet = payslips.reduce((s, p) => s + Number(p.netPay || 0), 0);
  return <div>
      <PageHeader title="Payroll" description="Salary structures, automated calculations, and payslip history" />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Processed</p>
              <p className="text-2xl font-semibold">{formatCurrency(totalNet)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payslip History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Employee</th>
                  <th className="pb-3 font-medium">Period</th>
                  <th className="pb-3 font-medium">Net Pay</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map(p => <tr key={p.id} className="border-b">
                    <td className="py-3">
                      {p.employee.firstName}{" "}
                      {p.employee.lastName}
                    </td>
                    <td className="py-3">
                      {p.month}/{p.year}
                    </td>
                    <td className="py-3 font-medium">{formatCurrency(Number(p.netPay))}</td>
                    <td className="py-3">
                      <Badge variant={p.status === "PAID" ? "success" : "secondary"}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>;
}