import { EmployeesClient } from "@/components/modules/employees-client";
import { getSession } from "@/lib/auth/session";
import { canManageEmployees, isOrgAdmin } from "@/lib/auth/employee-management";

export default async function EmployeesPage() {
  const session = await getSession();
  return (
    <EmployeesClient
      canManage={session ? canManageEmployees(session) : false}
      isAdmin={session ? isOrgAdmin(session.role) : false}
    />
  );
}
