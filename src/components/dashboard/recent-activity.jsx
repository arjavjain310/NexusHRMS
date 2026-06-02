"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

const ACTION_LABELS = {
  leave_requested: "Leave request submitted",
  leave_approved: "Leave approved",
  leave_rejected: "Leave rejected",
  attendance_correction_requested: "Attendance correction requested",
  attendance_correction_approved: "Attendance correction approved",
  attendance_correction_rejected: "Attendance correction rejected",
  payroll_published: "Payslip published",
  policy_update: "Policy update",
  interview_scheduled: "Interview scheduled",
};

export function RecentActivity({ showApprovalsLink = false }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((j) => setItems(j.data || []));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest updates across your organization</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Activity will appear here as your team uses Nexus-HRMS.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {ACTION_LABELS[item.action] || item.action.replace(/_/g, " ")}
                  </p>
                  {item.metadata?.employeeName && (
                    <p className="text-muted-foreground text-xs">{item.metadata.employeeName}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {showApprovalsLink && (
          <Link href="/approvals" className="text-xs text-primary hover:underline mt-4 inline-block">
            Open approval inbox →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
