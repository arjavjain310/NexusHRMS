/** Leave + correction events approvers may see org-wide */
export const ORG_APPROVER_ACTIONS = [
  "leave_requested",
  "leave_approved",
  "leave_rejected",
  "leave_cancelled",
  "attendance_correction_requested",
  "attendance_correction_approved",
  "attendance_correction_rejected",
];

/** Personal attendance — only visible to the subject employee */
export const PERSONAL_ATTENDANCE_ACTIONS = [
  "attendance_check_in",
  "attendance_check_out",
];

/** All actions a regular employee sees on their own feed */
export const PERSONAL_ACTIVITY_ACTIONS = [
  ...ORG_APPROVER_ACTIONS,
  ...PERSONAL_ATTENDANCE_ACTIONS,
  "payroll_published",
];
