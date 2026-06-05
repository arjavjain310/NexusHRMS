/** Only administrators may approve or reject leave requests */
export function canApproveLeave(session) {
  if (!session) return false;
  return session.role === "ADMIN";
}

/** Admins may approve any leave in the org, including their own */
export function canApproveLeaveRequest(session, leaveEmployeeId) {
  if (!canApproveLeave(session)) return false;
  if (session.role === "ADMIN") return true;
  if (session.employeeId && leaveEmployeeId && session.employeeId === leaveEmployeeId) {
    return false;
  }
  return true;
}
