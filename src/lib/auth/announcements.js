/** Admin always can post; others need explicit grant from admin */
export function canPostAnnouncements(session) {
  if (!session) return false;
  if (session.role === "ADMIN") return true;
  return Boolean(session.canPostAnnouncements);
}

export function canManageAnnouncementAccess(role) {
  return role === "ADMIN";
}
