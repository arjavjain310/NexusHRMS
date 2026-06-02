/** Admin always has access; others need explicit grant from admin */
export function canManageEmployees(session) {
  if (!session) return false;
  if (session.role === "ADMIN") return true;
  return Boolean(session.canManageEmployees);
}

export function isOrgAdmin(role) {
  return role === "ADMIN";
}
