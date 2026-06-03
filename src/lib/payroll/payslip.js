export const PAYSLIP_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function serializePayslip(p) {
  return {
    ...p,
    baseSalary: Number(p.baseSalary),
    bonuses: Number(p.bonuses ?? 0),
    deductions: Number(p.deductions),
    netPay: Number(p.netPay),
    earningsDetail:
      typeof p.earningsDetail === "object" && p.earningsDetail !== null
        ? p.earningsDetail
        : { items: [], deductions: [] },
  };
}

export function buildPayslipFromStructure(structure, employee, month, year) {
  const base = Number(structure.baseSalary);
  const hra = Number(structure.hra);
  const allowances = Number(structure.allowances);
  const deductions = Number(structure.deductions);
  const gross = base + hra + allowances;
  const tax = gross * (Number(structure.taxRate) / 100);
  const netPay = gross - deductions - tax;

  const earningsDetail = {
    items: [
      { name: "Basic / Stipend", amount: base },
      ...(hra > 0 ? [{ name: "HRA", amount: hra }] : []),
      ...(allowances > 0 ? [{ name: "Allowances", amount: allowances }] : []),
    ],
    deductions: [
      ...(deductions > 0 ? [{ name: "PF / Deductions", amount: deductions }] : []),
      ...(tax > 0 ? [{ name: "Income Tax", amount: tax }] : []),
    ],
  };

  return {
    id: `generated-${employee.id}-${year}-${month}`,
    employeeId: employee.id,
    month,
    year,
    baseSalary: base,
    bonuses: 0,
    deductions: deductions + tax,
    netPay,
    workingDays: 30,
    payableDays: 30,
    lossOfPayDays: 0,
    earningsDetail,
    status: "PAID",
    processedAt: new Date(),
    employee,
  };
}
