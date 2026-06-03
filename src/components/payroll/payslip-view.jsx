"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { BRAND_TITLE } from "@/lib/constants";
import { PAYSLIP_MONTHS } from "@/lib/payroll/payslip";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PayslipView({ payslip, generatedAt }) {
  const emp = payslip.employee;
  const monthLabel = PAYSLIP_MONTHS[payslip.month - 1]?.toUpperCase() || "";
  const employeeName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
  const generatedOn = generatedAt ? new Date(generatedAt) : new Date();

  const detail = payslip.earningsDetail || {};
  const earnings = detail.items?.length
    ? detail.items
    : [{ name: "Basic / Stipend", amount: payslip.baseSalary }];
  const deducts = detail.deductions?.length
    ? detail.deductions
    : [{ name: "Deductions", amount: payslip.deductions }];
  const gross = earnings.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  function handleDownload() {
    window.print();
  }

  return (
    <div
      id="payslip-print"
      className="bg-white text-black rounded-lg border shadow-sm overflow-hidden text-sm"
    >
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
          <h1 className="text-xl font-bold tracking-tight">{BRAND_TITLE} PaySlip</h1>
          <p className="text-xs text-gray-500 tracking-widest mt-2">
            PAYSLIP {monthLabel} {payslip.year}
          </p>
          <p className="text-base font-semibold mt-3">{employeeName}</p>
          <p className="text-xs text-gray-600 mt-2">
            Generated on: {formatDate(generatedOn)}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Row label="Employee Number" value={emp.employeeCode} />
            <Row label="Date Joined" value={emp.dateOfJoining ? formatDate(emp.dateOfJoining) : "—"} />
            <Row label="Department" value={emp.department?.name} />
            <Row label="Sub Department" value={emp.subDepartment} />
          </div>
          <div className="space-y-2">
            <Row label="Designation" value={emp.designation?.title} />
            <Row label="Payment Mode" value={emp.paymentMode || "Bank Transfer"} />
            <Row label="UAN" value={emp.uan || "N/A"} />
            <Row label="PAN Number" value={emp.panNumber || "N/A"} />
          </div>
        </div>

        <div>
          <p className="font-semibold text-gray-700 mb-2 uppercase text-xs tracking-wide">
            Salary Details
          </p>
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
            <p className="font-semibold text-gray-700 mb-2 uppercase text-xs tracking-wide">
              Earnings
            </p>
            <table className="w-full border text-xs">
              <tbody>
                {earnings.map((e) => (
                  <RowTable key={e.name} label={e.name} value={formatCurrency(e.amount)} />
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="border px-3 py-2">Total Earnings (A)</td>
                  <td className="border px-3 py-2 text-right">{formatCurrency(gross)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-2 uppercase text-xs tracking-wide">
              Deductions
            </p>
            <table className="w-full border text-xs">
              <tbody>
                {deducts.map((d) => (
                  <RowTable key={d.name} label={d.name} value={formatCurrency(d.amount)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg bg-gray-100 px-4 py-4 border">
          <div className="flex flex-wrap justify-between gap-4 items-end">
            <div>
              <p className="text-xs text-gray-600">Net Salary Payable (A)</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(payslip.netPay)}</p>
            </div>
            <PayslipStatus status={payslip.status} />
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Note: All amounts displayed in this payslip are in INR. This is a computer-generated
          statement and does not require a signature.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-gray-500 w-36 shrink-0">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function RowTable({ label, value }) {
  return (
    <tr>
      <td className="border px-3 py-2 text-gray-600">{label}</td>
      <td className="border px-3 py-2 text-right font-medium">{value}</td>
    </tr>
  );
}

function PayslipStatus({ status }) {
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
      {status}
    </span>
  );
}
