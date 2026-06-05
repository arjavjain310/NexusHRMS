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

/** Fields employees may update on their own profile without admin/grant access */
export const EMPLOYEE_SELF_EDIT_FIELDS = [
  "phone",
  "address",
  "city",
  "bio",
  "education",
];

/** HR/admin fields — only admin or granted users may change these on any record */
export const EMPLOYEE_ADMIN_EDIT_FIELDS = [
  ...EMPLOYEE_SELF_EDIT_FIELDS,
  "firstName",
  "lastName",
  "email",
  "employeeCode",
  "gender",
  "country",
  "departmentId",
  "designationId",
  "managerId",
  "status",
  "dateOfJoining",
  "baseSalary",
  "panNumber",
  "uan",
  "pfNumber",
  "paymentMode",
  "businessUnit",
  "subDepartment",
];

/**
 * Whether the session may PATCH the given employee record.
 * Self-service edits are limited to EMPLOYEE_SELF_EDIT_FIELDS unless canManageEmployees.
 */
export function canModifyEmployeeRecord(session, employeeId) {
  if (!session) return false;
  const isSelf = session.employeeId === employeeId;
  if (isSelf) return true;
  return canManageEmployees(session);
}

export function getEditableEmployeeFields(session, employeeId) {
  const isSelf = session?.employeeId === employeeId;
  if (isSelf && !canManageEmployees(session)) {
    return EMPLOYEE_SELF_EDIT_FIELDS;
  }
  return EMPLOYEE_ADMIN_EDIT_FIELDS;
}
