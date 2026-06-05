import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { LeaveManagementClient } from "@/components/modules/leave-management-client";

export default async function LeaveManagementPage() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "manageLeave")) {
    redirect("/dashboard");
  }

  const canApprove = hasPermission(session.role, "approveLeave");

  return <LeaveManagementClient canApprove={canApprove} />;
}
