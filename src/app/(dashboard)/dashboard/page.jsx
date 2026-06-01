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
  return <div>
      <PageHeader title={`Good ${getGreeting()}, ${session.name.split(" ")[0] || "there"}`} description={`${ROLE_LABELS[session.role]} dashboard — overview of your HR workspace`} />
      <RoleDashboard role={session.role} data={data} />
    </div>;
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}