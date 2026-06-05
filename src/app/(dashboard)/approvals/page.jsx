import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canApproveLeave } from "@/lib/auth/leave-approval";
import { ApprovalsClient } from "@/components/modules/approvals-client";

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canApproveLeave(session)) {
    redirect("/dashboard");
  }
  return <ApprovalsClient />;
}
