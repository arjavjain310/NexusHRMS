/** Parse monthly base salary; returns null if missing or invalid. */
export function parseBaseSalary(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function validateRequiredBaseSalary(value) {
  const parsed = parseBaseSalary(value);
  if (parsed == null) {
    return { ok: false, error: "Monthly Base Salary is required." };
  }
  return { ok: true, value: parsed };
}

export function salaryStructurePayload(baseSalary) {
  return {
    baseSalary,
    hra: Math.round(baseSalary * 0.2),
    allowances: Math.round(baseSalary * 0.1),
    deductions: Math.round(baseSalary * 0.05),
    currency: "INR",
  };
}
