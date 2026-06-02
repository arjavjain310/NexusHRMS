import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { ApprovalsClient } from "@/components/modules/approvals-client";

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.role, "approveLeave")) {
    redirect("/dashboard");
  }
  return <ApprovalsClient />;
}
