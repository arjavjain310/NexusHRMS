import { Users, Clock, CalendarDays, Wallet, Briefcase, FileSearch, TrendingUp, Building2, UserCheck } from "lucide-react";
import { StatCard } from "./stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceAreaChart, PerformanceBarChart } from "./charts";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
export function RoleDashboard({ role, data }) {
  return (
    <div className="space-y-8">
      {role === "ADMIN" ? (
        <AdminDashboard data={data} />
      ) : role === "SENIOR_MANAGER" ? (
        <ManagerDashboard data={data} />
      ) : role === "HR_RECRUITER" ? (
        <RecruiterDashboard data={data} />
      ) : (
        <EmployeeDashboard data={data} />
      )}
    </div>
  );
}
function AdminDashboard({
  data
}) {
  return <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Employees" value={data.employeeCount} change="+12 this quarter" trend="up" icon={Users} />
        <StatCard title="Present Today" value={data.todayAttendance} change={`${data.attendanceRate}% rate`} trend="up" icon={Clock} />
        <StatCard title="Pending Leaves" value={data.pendingLeaves} change="Needs approval" trend="neutral" icon={CalendarDays} />
        <StatCard title="Monthly Payroll" value={formatCurrency(data.payrollTotal || 0)} change="Processed" trend="neutral" icon={Wallet} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Last 7 days across organization</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceAreaChart data={data.attendanceChart} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hiring Analytics</CardTitle>
            <CardDescription>Active recruitment pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Candidates</span>
              <span className="text-2xl font-semibold">{data.candidates}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">AI Shortlisted</span>
              <Badge variant="success">{data.shortlisted}</Badge>
            </div>
            <PerformanceBarChart data={data.performanceChart} height={200} />
          </CardContent>
        </Card>
      </div>
    </div>;
}
function ManagerDashboard({
  data
}) {
  return <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Team Size" value={data.activeEmployees} icon={Users} />
        <StatCard title="Attendance Rate" value={`${data.attendanceRate}%`} trend="up" change="vs last week" icon={Clock} />
        <StatCard title="Leave Approvals" value={data.pendingLeaves} icon={CalendarDays} />
        <StatCard title="Avg Performance" value="4.2/5" trend="up" change="+0.3" icon={TrendingUp} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceAreaChart data={data.attendanceChart} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Performance by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceBarChart data={data.performanceChart} />
          </CardContent>
        </Card>
      </div>
    </div>;
}
function pipelineCount(pipeline, status) {
  const row = (pipeline || []).find((p) => p.status === status);
  const count = row?._count;
  if (typeof count === "number") return count;
  if (count && typeof count === "object" && "_all" in count) return count._all ?? 0;
  return 0;
}
function RecruiterDashboard({
  data
}) {
  return <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Open Candidates" value={data.candidates} icon={Briefcase} />
        <StatCard title="AI Shortlisted" value={data.shortlisted} trend="up" change="Top matches" icon={FileSearch} />
        <StatCard title="In Screening" value={pipelineCount(data.pipeline, "SCREENING")} icon={UserCheck} />
        <StatCard title="Interviews" value={pipelineCount(data.pipeline, "INTERVIEW")} icon={Building2} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Days Present" value={data.daysPresent ?? 0} change="This month" icon={Clock} />
        <StatCard title="Leave Balance" value={`${data.leaveBalance ?? 14} days`} icon={CalendarDays} />
        <StatCard
          title="Last Net Pay"
          value={data.netPay ? formatCurrency(data.netPay) : "—"}
          change="Open Payroll for details"
          trend="neutral"
          icon={Wallet}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Candidate Pipeline</CardTitle>
          <CardDescription>Recruitment funnel status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(data.pipeline || []).map(p => <div key={p.status} className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-semibold">{pipelineCount(data.pipeline, p.status)}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.status.replace("_", " ")}</p>
              </div>)}
          </div>
        </CardContent>
      </Card>
    </div>;
}
function EmployeeDashboard({
  data
}) {
  return <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Days Present" value={data.daysPresent ?? 0} change="This month" icon={Clock} />
        <StatCard title="Leave Balance" value={`${data.leaveBalance ?? 14} days`} icon={CalendarDays} />
        <StatCard title="Last Net Pay" value={data.netPay ? formatCurrency(data.netPay) : "—"} icon={Wallet} />
        <StatCard title="Performance" value="On Track" trend="up" icon={TrendingUp} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Attendance</CardTitle>
          <CardDescription>Weekly overview</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceAreaChart data={data.attendanceChart} />
        </CardContent>
      </Card>
    </div>;
}