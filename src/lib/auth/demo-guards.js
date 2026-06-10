import { isDemoAccountEmail, isDemoAccountUser } from "@/lib/auth/demo-accounts";

export function isDemoSession(session) {
  return session?.isDemoSession === true;
}

/**
 * Demo login accounts (admin/manager/hr/employee) cannot be deleted so the sandbox
 * always has working role switcher accounts. All other sandbox CRUD is allowed.
 */
export function getDemoDeleteBlockedMessage(session, employee, user) {
  if (isDemoAccountUser(user) || isDemoAccountEmail(employee?.email)) {
    return "Demo login accounts cannot be deleted. You can remove other sandbox employees freely.";
  }
  return null;
}

/** Prevent changing credentials on the four system demo login accounts. */
export function getDemoPatchBlockedMessage(session, employee, user, body) {
  if (isDemoAccountUser(user) || isDemoAccountEmail(employee?.email)) {
    const identityAttempt = ["email", "employeeCode"].filter((f) => f in body);
    if (identityAttempt.length > 0) {
      return "Demo login account credentials cannot be changed.";
    }
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

/** @deprecated demo sessions no longer block CRUD — kept for import compatibility */
export function getDemoSessionActionBlockedMessage() {
  return null;
}
