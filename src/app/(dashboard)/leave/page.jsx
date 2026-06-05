import { LeaveClient } from "@/components/modules/leave-client";
import { getSession } from "@/lib/auth/session";
import { canApproveLeave } from "@/lib/auth/leave-approval";

export default async function LeavePage() {
  const session = await getSession();
  return (
    <LeaveClient
      canApprove={session ? canApproveLeave(session) : false}
      currentEmployeeId={session?.employeeId}
    />
  );
}
