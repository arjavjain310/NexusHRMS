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
export function LeaveClient() {
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "ANNUAL",
    startDate: "",
    endDate: "",
    reason: ""
  });
  function load() {
    fetch("/api/leave").then(r => r.json()).then(j => setLeaves(j.data || []));
  }
  useEffect(() => {
    load();
  }, []);
  async function submitLeave(e) {
    e.preventDefault();
    await fetch("/api/leave", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });
    setShowForm(false);
    load();
  }
  async function updateStatus(id, status) {
    await fetch("/api/leave", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id,
        status
      })
    });
    load();
  }
  return <div className="space-y-6">
      <PageHeader title="Leave Management" description="Request time off and manage approval workflows" action={<Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Request Leave
          </Button>} />

      <ModuleSubNav items={ME_MODULE_TABS} />

      {showForm && <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Leave Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitLeave} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({
              ...form,
              type: v
            })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" required value={form.startDate} onChange={e => setForm({
              ...form,
              startDate: e.target.value
            })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" required value={form.endDate} onChange={e => setForm({
              ...form,
              endDate: e.target.value
            })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Reason</Label>
                <Textarea value={form.reason} onChange={e => setForm({
              ...form,
              reason: e.target.value
            })} />
              </div>
              <Button type="submit">Submit Request</Button>
            </form>
          </CardContent>
        </Card>}

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {leaves.length === 0 ? <p className="text-muted-foreground text-center py-8">No leave requests</p> : leaves.map(l => <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="font-medium">
                    {l.employee.firstName}{" "}
                    {l.employee.lastName} — {LEAVE_TYPE_LABELS[l.type]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(l.startDate)} – {formatDate(l.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={l.status === "APPROVED" ? "success" : l.status === "REJECTED" ? "destructive" : "warning"}>
                    {l.status}
                  </Badge>
                  {l.status === "PENDING" && <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(l.id, "APPROVED")}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(l.id, "REJECTED")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>}
                </div>
              </div>)}
        </CardContent>
      </Card>
    </div>;
}