const ROLE_HIERARCHY = {
  ADMIN: 4,
  SENIOR_MANAGER: 3,
  HR_RECRUITER: 2,
  EMPLOYEE: 1,
};

export function hasMinimumRole(userRole, requiredRole) {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessRoute(userRole, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
}

export const PERMISSIONS = {
  manageEmployees: ["ADMIN", "HR_RECRUITER"] ,
  approveLeave: ["ADMIN", "SENIOR_MANAGER"] ,
  managePayroll: ["ADMIN"] ,
  viewTeamAnalytics: ["ADMIN", "SENIOR_MANAGER"] ,
  manageRecruitment: ["ADMIN", "HR_RECRUITER"] ,
  systemSettings: ["ADMIN"] ,
} ;

export function hasPermission(userRole, permission) {
  return (PERMISSIONS[permission] ).includes(userRole);
}
