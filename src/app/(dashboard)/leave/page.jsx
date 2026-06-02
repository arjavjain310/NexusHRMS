import { LeaveClient } from "@/components/modules/leave-client";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export default async function LeavePage() {
  const session = await getSession();
  const canApprove = session ? hasPermission(session.role, "approveLeave") : false;
  return <LeaveClient canApprove={canApprove} />;
}
