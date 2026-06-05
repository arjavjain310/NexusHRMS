/** Only administrators or users explicitly granted access by an admin */
export function canManageEmployees(session) {
  if (!session) return false;
  if (session.role === "ADMIN") return true;
  return session.canManageEmployees === true;
}

export function isOrgAdmin(role) {
  return role === "ADMIN";
}

export function canGrantEmployeeManagementAccess(session) {
  return isOrgAdmin(session?.role);
}
