"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Check, X, Clock, CalendarDays } from "lucide-react";

export function ApprovalsClient() {
  const [leaves, setLeaves] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/approvals")
      .then((r) => r.json())
      .then((j) => {
        setLeaves(j.data?.leaves || []);
        setCorrections(j.data?.corrections || []);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function act(kind, id, status) {
    let rejectReason;
    if (status === "REJECTED") {
      rejectReason = window.prompt("Rejection reason (optional):") || undefined;
    }
    await fetch("/api/approvals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, status, rejectReason }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Inbox"
        description="Review pending leave requests and attendance regularizations"
      />

      <Tabs defaultValue="leave">
        <TabsList>
          <TabsTrigger value="leave" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Leave ({leaves.length})
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Clock className="h-4 w-4" />
            Attendance ({corrections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leave" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending leave requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : leaves.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">All caught up — no pending leave</p>
              ) : (
                leaves.map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {l.employee.firstName} {l.employee.lastName}
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          · {l.employee.employeeCode}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {LEAVE_TYPE_LABELS[l.type]} · {formatDate(l.startDate)} –{" "}
                        {formatDate(l.endDate)}
                      </p>
                      {l.reason && (
                        <p className="text-sm mt-1 text-muted-foreground">{l.reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => act("leave", l.id, "APPROVED")}>
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => act("leave", l.id, "REJECTED")}
                      >
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance regularization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : corrections.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No pending attendance corrections
                </p>
              ) : (
                corrections.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {c.employee.firstName} {c.employee.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Date: {formatDate(c.date)}
                      </p>
                      <p className="text-sm mt-1">{c.reason}</p>
                      <Badge variant="warning" className="mt-2">
                        PENDING
                      </Badge>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => act("attendance", c.id, "APPROVED")}>
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => act("attendance", c.id, "REJECTED")}
                      >
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
