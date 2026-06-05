/** Leave types available to every employee regardless of gender */
export const UNIVERSAL_LEAVE_TYPES = ["ANNUAL", "SICK", "CASUAL", "UNPAID"];

const GENDER_SPECIFIC = {
  MALE: { allowed: ["PATERNITY"], denied: ["MATERNITY"] },
  FEMALE: { allowed: ["MATERNITY"], denied: ["PATERNITY"] },
  OTHER: { allowed: [], denied: ["MATERNITY", "PATERNITY"] },
};

export const VALID_GENDERS = ["MALE", "FEMALE", "OTHER"];

export function parseGender(value) {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  return VALID_GENDERS.includes(normalized) ? normalized : null;
}

/** All leave types this employee may request */
export function getEligibleLeaveTypes(gender) {
  const parsed = parseGender(gender);
  if (!parsed) return [...UNIVERSAL_LEAVE_TYPES];

  const rules = GENDER_SPECIFIC[parsed];
  return [...UNIVERSAL_LEAVE_TYPES, ...rules.allowed];
}

export function isLeaveTypeEligible(gender, leaveType) {
  return getEligibleLeaveTypes(gender).includes(leaveType);
}

export function validateLeaveTypeForGender(gender, leaveType) {
  const parsed = parseGender(gender);

  if (leaveType === "MATERNITY" || leaveType === "PATERNITY") {
    if (!parsed) {
      return {
        ok: false,
        error:
          "Gender must be set on your employee profile before applying for maternity or paternity leave. Contact Admin or HR.",
      };
    }
  }

  if (!isLeaveTypeEligible(parsed, leaveType)) {
    if (leaveType === "MATERNITY") {
      return {
        ok: false,
        error: "Maternity leave is only available to female employees.",
      };
    }
    if (leaveType === "PATERNITY") {
      return {
        ok: false,
        error: "Paternity leave is only available to male employees.",
      };
    }
    return { ok: false, error: "This leave type is not available for your profile." };
  }

  return { ok: true };
}
