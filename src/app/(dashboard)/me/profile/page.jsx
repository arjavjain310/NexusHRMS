import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { EmployeeProfile } from "@/components/employees/employee-profile";

export default async function MyProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.employeeId) redirect("/dashboard");

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My Profile</h1>
      <EmployeeProfile employeeId={session.employeeId} />
    </div>
  );
}
