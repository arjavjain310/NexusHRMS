import { getSession } from "@/lib/auth/session";
import { getDashboardData, getMockDashboardData } from "@/lib/data/dashboard";
import { PageHeader } from "@/components/dashboard/page-header";
import { RoleDashboard } from "@/components/dashboard/role-dashboards";
import { ROLE_LABELS } from "@/lib/constants";
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  let data;
  try {
    if (process.env.DATABASE_URL) {
      data = await getDashboardData(session.organizationId, session.role, session.employeeId);
    } else {
      data = getMockDashboardData(session.role);
    }
  } catch (e) {
    data = getMockDashboardData(session.role);
  }
  const firstName =
    session.name?.split(" ")[0] || session.email?.split("@")[0] || "there";

  return (
    <div>
      <PageHeader
        title={`Hi, ${firstName}`}
        description={`${ROLE_LABELS[session.role]} dashboard — overview of your HR workspace`}
      />
      <RoleDashboard role={session.role} data={data} />
    </div>
  );
}