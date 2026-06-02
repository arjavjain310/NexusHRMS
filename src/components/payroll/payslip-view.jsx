"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function PayslipView({
  payslip,
  orgName
}) {
  const emp = payslip.employee;
  const monthLabel = MONTHS[payslip.month - 1]?.toUpperCase() || "";
  const detail = payslip.earningsDetail || {};
  const earnings = detail.items || [{
    name: "Basic Salary",
    amount: payslip.baseSalary
  }];
  const deducts = detail.deductions || [{
    name: "Deductions",
    amount: payslip.deductions
  }];
  const gross = earnings.reduce((s, i) => s + (i.amount || 0), 0);

  function handleDownload() {
    window.print();
  }

  return <div id="payslip-print" className="bg-white text-black rounded-lg border shadow-sm overflow-hidden text-sm">
      <div className="bg-slate-700 text-white px-6 py-3 flex justify-between items-center print:hidden">
        <span>
          {monthLabel} {payslip.year}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="gap-2"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div className="p-8 space-y-6 payslip-body">
        <div className="text-center border-b pb-4">
          <p className="text-xs text-gray-500 tracking-widest">PAYSLIP {monthLabel} {payslip.year}</p>
          <h2 className="text-lg font-bold mt-2">{orgName || emp.organization.name || "Nexus Technologies Pvt Ltd"}</h2>
          <p className="text-xs text-gray-600 mt-1 max-w-lg mx-auto">
            3rd Floor, Tech Park, Hosur Main Road, Bangalore, Karnataka — 560029
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Row label="Name" value={`${emp.firstName || ""} ${emp.lastName || ""}`} />
            <Row label="Employee Number" value={emp.employeeCode} />
            <Row label="Date Joined" value={emp.dateOfJoining ? formatDate(emp.dateOfJoining) : "—"} />
            <Row label="Department" value={emp.department?.name} />
            <Row label="Sub Department" value={emp.subDepartment} />
          </div>
          <div className="space-y-2">
            <Row label="Designation" value={emp.designation?.title} />
            <Row label="Payment Mode" value={emp.paymentMode || "Bank Transfer"} />
            <Row label="UAN" value={emp.uan || "N/A"} />
            <Row label="PF Number" value={emp.pfNumber || "N/A"} />
            <Row label="PAN Number" value={emp.panNumber || "N/A"} />
          </div>
        </div>

        <div>
          <p className="font-semibold text-gray-700 mb-2">Salary Details</p>
          <table className="w-full border text-xs">
            <tbody>
              <RowTable label="Actual Payable Days" value={String(payslip.payableDays)} />
              <RowTable label="Total Working Days" value={String(payslip.workingDays)} />
              <RowTable label="Loss of Pay Days" value={String(payslip.lossOfPayDays)} />
              <RowTable label="Days Payable" value={String(payslip.payableDays)} />
            </tbody>
          </table>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="font-semibold text-gray-700 mb-2">Earnings</p>
            <table className="w-full border text-xs">
              <tbody>
                {earnings.map(e => <RowTable key={e.name} label={e.name} value={formatCurrency(e.amount)} />)}
                <tr className="bg-gray-50 font-semibold">
                  <td className="border px-3 py-2">Gross Earnings</td>
                  <td className="border px-3 py-2 text-right">{formatCurrency(gross)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-2">Deductions</p>
            <table className="w-full border text-xs">
              <tbody>
                {deducts.map(d => <RowTable key={d.name} label={d.name} value={formatCurrency(d.amount)} />)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <div className="text-right">
            <p className="text-gray-500 text-xs">Net Pay</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(payslip.netPay)}</p>
            <PayslipStatus status={payslip.status} />
          </div>
        </div>
      </div>
    </div>;
}
function Row({
  label,
  value
}) {
  return <div className="flex gap-2 text-xs">
      <span className="text-gray-500 w-36 shrink-0">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>;
}
function RowTable({
  label,
  value
}) {
  return <tr>
      <td className="border px-3 py-2 text-gray-600">{label}</td>
      <td className="border px-3 py-2 text-right font-medium">{value}</td>
    </tr>;
}
function PayslipStatus({
  status
}) {
  return <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
      {status}
    </span>;
}