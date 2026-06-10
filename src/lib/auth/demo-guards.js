import { isDemoAccountEmail, isDemoAccountUser } from "@/lib/auth/demo-accounts";

const DEMO_PROTECTED_PATCH_FIELDS = ["email", "employeeCode", "firstName", "lastName"];

export function isDemoSession(session) {
  return session?.isDemoSession === true;
}

/** Block destructive / system-level actions during demo sessions. */
export function getDemoSessionActionBlockedMessage(session, action) {
  if (!isDemoSession(session)) return null;

  const blocked = {
    delete_employee: "Demo mode: removing employees is disabled.",
    delete_payroll: "Demo mode: deleting payroll records is disabled.",
    process_payroll: "Demo mode: payroll processing is disabled.",
    grant_access: "Demo mode: changing user permissions is disabled.",
    change_role: "Demo mode: changing system roles is disabled.",
    purge_employee: "Demo mode: permanently removing employees is disabled.",
  };

  return blocked[action] || null;
}

export function getDemoDeleteBlockedMessage(session, employee, user) {
  const sessionBlock = getDemoSessionActionBlockedMessage(session, "delete_employee");
  if (sessionBlock) return sessionBlock;

  if (isDemoAccountUser(user) || isDemoAccountEmail(employee?.email)) {
    return "Demo system accounts cannot be deleted.";
  }
  return null;
}

export function getDemoPatchBlockedMessage(session, employee, user, body) {
  if (isDemoAccountUser(user) || isDemoAccountEmail(employee?.email)) {
    const identityAttempt = ["email", "employeeCode"].filter((f) => f in body);
    if (identityAttempt.length > 0) {
      return "Demo account credentials cannot be changed.";
    }

    if (isDemoSession(session)) {
      const attempted = DEMO_PROTECTED_PATCH_FIELDS.filter((f) => f in body);
      if (attempted.length > 0) {
        return "Demo mode: demo account profiles cannot be modified.";
      }
      if (body.role) {
        return getDemoSessionActionBlockedMessage(session, "change_role");
      }
    }
  }

  if (isDemoSession(session) && body.role) {
    return getDemoSessionActionBlockedMessage(session, "change_role");
  }

  return null;
}

export function getDemoPasswordResetBlockedMessage(email) {
  if (isDemoAccountEmail(email)) {
    return "Demo account passwords are managed by the system.";
  }
  return null;
}

export function getDemoSignupBlockedMessage(email) {
  if (isDemoAccountEmail(email)) {
    return "Demo accounts are managed by the system.";
  }
  return null;
}
