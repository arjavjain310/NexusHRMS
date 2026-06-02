import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { EmployeeProfile } from "@/components/employees/employee-profile";

export default async function MyProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.employeeId) {
    return (
      <div className="py-12 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-2">My Profile</h1>
        <p className="text-muted-foreground">
          No employee record is linked to your account. Sign in with an employee email such as{" "}
          <strong>employee@nexushrms.com</strong>, or ask HR to link your user to an employee profile.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My Profile</h1>
      <EmployeeProfile employeeId={session.employeeId} />
    </div>
  );
}
