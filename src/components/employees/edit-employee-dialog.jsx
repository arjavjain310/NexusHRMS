"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GENDER_LABELS, GENDER_OPTIONS, ROLE_LABELS } from "@/lib/constants";
import { Loader2, X } from "lucide-react";

const ROLES = ["EMPLOYEE", "HR_RECRUITER", "SENIOR_MANAGER", "ADMIN"];
const STATUSES = ["ACTIVE", "PROBATION", "ON_LEAVE", "TERMINATED"];

function formatDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function toForm(employee) {
  if (!employee) return null;
  return {
    firstName: employee.firstName || "",
    lastName: employee.lastName || "",
    email: employee.email || "",
    phone: employee.phone || "",
    employeeCode: employee.employeeCode || "",
    gender: employee.gender || "",
    role: employee.user?.role || "EMPLOYEE",
    departmentId: employee.departmentId || "",
    designationId: employee.designationId || "",
    managerId: employee.managerId || "",
    dateOfJoining: formatDateInput(employee.dateOfJoining) || new Date().toISOString().slice(0, 10),
    status: employee.status || "ACTIVE",
    city: employee.city || "",
    country: employee.country || "India",
    baseSalary: employee.baseSalary != null ? String(employee.baseSalary) : "",
  };
}

export function EditEmployeeDialog({ open, employee, onClose, onSaved, canManage = false }) {
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!open || !employee?.id) return;
    setError(null);
    setSuccess(null);
    setLoadingEmployee(true);
    setForm(null);

    Promise.all([
      fetch("/api/employees/meta").then((r) => r.json()),
      fetch(`/api/employees/${employee.id}`).then((r) => r.json()),
    ])
      .then(([metaJson, detailJson]) => {
        setMeta(metaJson.data || null);
        const detail = detailJson.data;
        if (detail) {
          setForm(toForm({ ...employee, ...detail, user: detail.user || employee.user }));
        } else {
          setForm(toForm(employee));
        }
      })
      .catch(() => {
        setForm(toForm(employee));
      })
      .finally(() => setLoadingEmployee(false));
  }, [open, employee]);

  const designationsForDept = useMemo(() => {
    if (!meta?.designations || !form?.departmentId) return [];
    return meta.designations.filter((d) => d.departmentId === form.departmentId);
  }, [meta, form?.departmentId]);

  const managerOptions = useMemo(() => {
    return (meta?.managers || []).filter((m) => m.id !== employee?.id);
  }, [meta, employee?.id]);

  if (!open || !employee || !canManage) return null;
  if (meta && !meta.canManageEmployees) return null;

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
    if (!canManage || !meta?.canManageEmployees) {
      setError("You do not have permission to modify employee records.");
      return;
    }
    if (!form.gender) {
      setError("Gender is required.");
      return;
    }
    if (!form.baseSalary || Number(form.baseSalary) <= 0) {
      setError("Monthly Base Salary is required.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          employeeCode: form.employeeCode.trim(),
          gender: form.gender,
          role: form.role,
          status: form.status,
          departmentId: form.departmentId || null,
          designationId: form.designationId || null,
          managerId: form.managerId || null,
          dateOfJoining: form.dateOfJoining,
          baseSalary: Number(form.baseSalary),
          city: form.city.trim() || null,
          country: form.country.trim() || "India",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to update employee");
        return;
      }
      const message =
        json.message || `${form.firstName} ${form.lastName} was updated successfully.`;
      setSuccess(message);
      onSaved?.(json.data, message);
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1800);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
      <Card className="relative z-50 w-full max-w-2xl shadow-lg overflow-visible">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Edit employee</CardTitle>
            <CardDescription>
              Update all employee details — same fields as when adding a new employee.
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-visible">
          {loadingEmployee || !form ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading employee details…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 overflow-visible">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First name *</Label>
                  <Input
                    id="edit-firstName"
                    required
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last name *</Label>
                  <Input
                    id="edit-lastName"
                    required
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-email">Work email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-employeeCode">Employee code *</Label>
                  <Input
                    id="edit-employeeCode"
                    required
                    value={form.employeeCode}
                    onChange={(e) => updateField("employeeCode", e.target.value)}
                  />
                </div>
                <div className="space-y-2 relative z-10">
                  <Label>Gender *</Label>
                  <Select value={form.gender} onValueChange={(v) => updateField("gender", v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {GENDER_LABELS[g]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    onValueChange={(v) => updateField("departmentId", v === "__none__" ? "" : v)}
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
                    onValueChange={(v) => updateField("designationId", v === "__none__" ? "" : v)}
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
                      {managerOptions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.firstName} {m.lastName} ({m.employeeCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dateOfJoining">Date of joining</Label>
                  <Input
                    id="edit-dateOfJoining"
                    type="date"
                    value={form.dateOfJoining}
                    onChange={(e) => updateField("dateOfJoining", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-baseSalary">Monthly base salary (INR) *</Label>
                  <Input
                    id="edit-baseSalary"
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 50000"
                    value={form.baseSalary}
                    onChange={(e) => updateField("baseSalary", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-country">Country</Label>
                  <Input
                    id="edit-country"
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
                    "Save changes"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
