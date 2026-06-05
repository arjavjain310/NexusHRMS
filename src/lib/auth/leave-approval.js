/** Only administrators may approve or reject leave requests */
export function canApproveLeave(session) {
  if (!session) return false;
  return session.role === "ADMIN";
}

/** Admins cannot approve their own leave requests */
export function canApproveLeaveRequest(session, leaveEmployeeId) {
  if (!canApproveLeave(session)) return false;
  if (session.employeeId && leaveEmployeeId && session.employeeId === leaveEmployeeId) {
    return false;
  }
  return true;
}
