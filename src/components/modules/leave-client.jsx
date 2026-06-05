"use client";

import { useEffect, useState } from "react";
import { ModuleSubNav, ME_MODULE_TABS } from "@/components/layout/module-sub-nav";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Plus, Check, X } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";

export function LeaveClient({ canApprove = false, currentEmployeeId }) {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [eligibleTypes, setEligibleTypes] = useState([]);
  const [genderRequired, setGenderRequired] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "ANNUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  function load() {
    fetch("/api/leave").then((r) => r.json()).then((j) => setLeaves(j.data || []));
    fetch("/api/leave/balance")
      .then((r) => r.json())
      .then((j) => {
        setBalances(j.data || []);
        const types = j.meta?.eligibleTypes || [];
        setEligibleTypes(types);
        setGenderRequired(!!j.meta?.genderRequired);
        setForm((prev) => ({
          ...prev,
          type: types.includes(prev.type) ? prev.type : types[0] || "ANNUAL",
        }));
      });
  }

  useEffect(() => {
    load();
  }, []);

  const selectedBalance = balances.find((b) => b.type === form.type);
  const requestedDays =
    form.startDate && form.endDate
      ? Math.max(
          0,
          differenceInCalendarDays(new Date(form.endDate), new Date(form.startDate)) + 1
        )
      : 0;

  async function submitLeave(e) {
    e.preventDefault();
    const res = await fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Failed to submit");
      return;
    }
    setShowForm(false);
    setForm({ type: "ANNUAL", startDate: "", endDate: "", reason: "" });
    load();
  }

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
        description="Request time off and track your leave balance"
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Request Leave
          </Button>
        }
      />

      <ModuleSubNav items={ME_MODULE_TABS} />

      {genderRequired && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Your gender is not set on your employee profile. Maternity and paternity leave are
          unavailable until Admin or HR updates your record.
        </p>
      )}

      {balances.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {balances
            .filter((b) => b.type !== "UNPAID")
            .slice(0, 6)
            .map((b) => (
              <Card key={b.type}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {LEAVE_TYPE_LABELS[b.type] || b.type}
                  </p>
                  <p className="text-2xl font-semibold mt-1">{b.remaining} days</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {b.used} used · {b.pending} pending · {b.entitlement} annual
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Leave Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitLeave} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(eligibleTypes.length > 0
                      ? eligibleTypes
                      : Object.keys(LEAVE_TYPE_LABELS)
                    ).map((k) => (
                      <SelectItem key={k} value={k}>
                        {LEAVE_TYPE_LABELS[k] || k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedBalance && (
                <div className="sm:col-span-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                  <span className="font-medium">Balance after request: </span>
                  {requestedDays > 0 ? (
                    <span
                      className={
                        selectedBalance.remaining - requestedDays < 0
                          ? "text-red-600 font-medium"
                          : "text-emerald-600 font-medium"
                      }
                    >
                      {Math.max(0, selectedBalance.remaining - requestedDays)} days remaining
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {selectedBalance.remaining} days available (select dates)
                    </span>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Reason</Label>
                <Textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>
              <Button type="submit">Submit Request</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {leaves.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No leave requests</p>
          ) : (
            leaves.map((l) => (
              <div
                key={l.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {l.employee
                      ? `${l.employee.firstName} ${l.employee.lastName} — `
                      : ""}
                    {LEAVE_TYPE_LABELS[l.type]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(l.startDate)} – {formatDate(l.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      l.status === "APPROVED"
                        ? "success"
                        : l.status === "REJECTED"
                          ? "destructive"
                          : "warning"
                    }
                  >
                    {l.status}
                  </Badge>
                  {canApprove &&
                    l.status === "PENDING" &&
                    l.employeeId !== currentEmployeeId && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(l.id, "APPROVED")}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(l.id, "REJECTED")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
