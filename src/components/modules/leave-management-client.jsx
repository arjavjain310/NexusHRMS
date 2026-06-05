"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Check, X } from "lucide-react";

const STATUS_TABS = [
  { key: "ALL", label: "All requests" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const STATUS_VARIANT = {
  PENDING: "secondary",
  APPROVED: "success",
  REJECTED: "destructive",
  CANCELLED: "outline",
};

export function LeaveManagementClient({ canApprove = false }) {
  const [tab, setTab] = useState("ALL");
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const qs = tab === "ALL" ? "" : `?status=${tab}`;
    fetch(`/api/leave/management${qs}`)
      .then((r) => r.json())
      .then((j) => {
        setLeaves(j.data || []);
        setStats(j.stats || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id, status) {
    await fetch("/api/leave", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Admin and HR view — all leave requests, approvals, and employee leave history"
        action={
          canApprove ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/approvals">Open approval inbox</Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {["PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((s) => (
          <Card key={s}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stats[s] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <Button
            key={t.key}
            type="button"
            size="sm"
            variant={tab === t.key ? "default" : "outline"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employee leave records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : leaves.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No leave records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Employee</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Dates</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Reason</th>
                    {canApprove && <th className="pb-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium">
                          {l.employee.firstName} {l.employee.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {l.employee.employeeCode}
                          {l.employee.department?.name ? ` · ${l.employee.department.name}` : ""}
                        </p>
                      </td>
                      <td className="py-3 pr-4">{LEAVE_TYPE_LABELS[l.type] || l.type}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {formatDate(l.startDate)} – {formatDate(l.endDate)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={STATUS_VARIANT[l.status] || "outline"}>{l.status}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground max-w-xs truncate">
                        {l.reason || "—"}
                      </td>
                      {canApprove && (
                        <td className="py-3">
                          {l.status === "PENDING" ? (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(l.id, "APPROVED")}
                                aria-label="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatus(l.id, "REJECTED")}
                                aria-label="Reject"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
