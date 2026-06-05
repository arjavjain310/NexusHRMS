/** Actions visible to approvers for any employee in the org */
export const APPROVER_VISIBLE_ACTIONS = [
  "leave_requested",
  "leave_approved",
  "leave_rejected",
  "leave_cancelled",
  "attendance_correction_requested",
  "attendance_correction_approved",
  "attendance_correction_rejected",
  "attendance_check_in",
  "attendance_check_out",
];

/** Personal attendance + leave actions for the subject employee */
export const PERSONAL_ACTIVITY_ACTIONS = [
  ...APPROVER_VISIBLE_ACTIONS,
  "payroll_published",
];
