"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/constants";
import { Loader2, X } from "lucide-react";

const ROLES = ["EMPLOYEE", "HR_RECRUITER", "SENIOR_MANAGER", "ADMIN"];
const STATUSES = ["ACTIVE", "PROBATION", "ON_LEAVE", "TERMINATED"];

const emptyForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  employeeCode: "",
  role: "EMPLOYEE",
  departmentId: "",
  designationId: "",
  managerId: "",
  dateOfJoining: new Date().toISOString().slice(0, 10),
  status: "ACTIVE",
  city: "",
  country: "India",
  baseSalary: "",
});

export function AddEmployeeForm({ open, onClose, onCreated }) {
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(null);
    fetch("/api/employees/meta")
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          setMeta(j.data);
          setForm((f) => ({
            ...emptyForm(),
            employeeCode: j.data.suggestedCode || "",
          }));
        }
      });
  }, [open]);

  const designationsForDept = useMemo(() => {
    if (!meta?.designations || !form.departmentId) return [];
    return meta.designations.filter((d) => d.departmentId === form.departmentId);
  }, [meta, form.departmentId]);

  function updateField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "departmentId") {
        const stillValid = meta?.designations?.some(
          (d) => d.id === prev.designationId && d.departmentId === value
        );
        if (!stillValid) next.designationId = "";
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          managerId: form.managerId || null,
          departmentId: form.departmentId || null,
          designationId: form.designationId || null,
          baseSalary: form.baseSalary ? Number(form.baseSalary) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to add employee");
        return;
      }
      setSuccess(
        json.message ||
          "Employee added. They can sign up at /signup with this work email, then sign in."
      );
      onCreated?.(json.data);
      setTimeout(() => {
        onClose();
        setForm(emptyForm());
        setSuccess(null);
      }, 2200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
      <Card className="relative z-50 w-full max-w-2xl shadow-lg overflow-visible">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Add Employee</CardTitle>
            <CardDescription>
              Creates a company record and login email. They complete sign-up at /signup with this
              email.
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-visible">
          <form onSubmit={handleSubmit} className="space-y-6 overflow-visible">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name *</Label>
                <Input
                  id="firstName"
                  required
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name *</Label>
                <Input
                  id="lastName"
                  required
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Work email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeCode">Employee code *</Label>
                <Input
                  id="employeeCode"
                  required
                  value={form.employeeCode}
                  onChange={(e) => updateField("employeeCode", e.target.value)}
                />
              </div>
              <div className="space-y-2 relative z-10">
                <Label>System role *</Label>
                <Select value={form.role} onValueChange={(v) => updateField("role", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="left" align="start" className="min-w-[12rem] bg-background">
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r] || r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 relative z-0">
                <Label>Employment status</Label>
                <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="end" className="bg-background">
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 relative z-10">
                <Label>Department</Label>
                <Select
                  value={form.departmentId || "__none__"}
                  onValueChange={(v) =>
                    updateField("departmentId", v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent side="left" align="start" className="min-w-[14rem] bg-background">
                    <SelectItem value="__none__">— None —</SelectItem>
                    {(meta?.departments || []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 relative z-0">
                <Label>Designation</Label>
                <Select
                  value={form.designationId || "__none__"}
                  onValueChange={(v) =>
                    updateField("designationId", v === "__none__" ? "" : v)
                  }
                  disabled={!form.departmentId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        form.departmentId ? "Select designation" : "Pick department first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="end" className="min-w-[14rem] bg-background">
                    <SelectItem value="__none__">— None —</SelectItem>
                    {designationsForDept.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2 relative z-0">
                <Label>Reporting manager</Label>
                <Select
                  value={form.managerId || "__none__"}
                  onValueChange={(v) => updateField("managerId", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" className="max-h-60 bg-background">
                    <SelectItem value="__none__">— None —</SelectItem>
                    {(meta?.managers || []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfJoining">Date of joining</Label>
                <Input
                  id="dateOfJoining"
                  type="date"
                  value={form.dateOfJoining}
                  onChange={(e) => updateField("dateOfJoining", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseSalary">Monthly base salary (INR)</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Optional"
                  value={form.baseSalary}
                  onChange={(e) => updateField("baseSalary", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
                {success}
              </p>
            )}

            <div className="flex flex-wrap gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  "Add employee"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
