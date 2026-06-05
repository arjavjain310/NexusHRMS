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
const STATUSES = ["ACTIVE", "PROBATION", "ON_LEAVE"];

function toForm(employee) {
  if (!employee) return null;
  return {
    firstName: employee.firstName || "",
    lastName: employee.lastName || "",
    phone: employee.phone || "",
    gender: employee.gender || "",
    role: employee.user?.role || "EMPLOYEE",
    status: employee.status || "ACTIVE",
    departmentId: employee.departmentId || "",
    designationId: employee.designationId || "",
    managerId: employee.managerId || "",
    city: employee.city || "",
    country: employee.country || "India",
    businessUnit: employee.businessUnit || "",
    subDepartment: employee.subDepartment || "",
  };
}

export function EditEmployeeDialog({ open, employee, onClose, onSaved, canManage = false }) {
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !employee) return;
    setError(null);
    setForm(toForm(employee));
    fetch("/api/employees/meta")
      .then((r) => r.json())
      .then((j) => setMeta(j.data || null));
  }, [open, employee]);

  const designationsForDept = useMemo(() => {
    if (!meta?.designations || !form?.departmentId) return [];
    return meta.designations.filter((d) => d.departmentId === form.departmentId);
  }, [meta, form?.departmentId]);

  const managerOptions = useMemo(() => {
    return (meta?.managers || []).filter((m) => m.id !== employee?.id);
  }, [meta, employee?.id]);

  if (!open || !employee || !form || !canManage) return null;

  if (meta && !meta.canManageEmployees) {
    return null;
  }

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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || null,
          gender: form.gender,
          role: form.role,
          status: form.status,
          departmentId: form.departmentId || null,
          designationId: form.designationId || null,
          managerId: form.managerId || null,
          city: form.city.trim() || null,
          country: form.country.trim() || "India",
          businessUnit: form.businessUnit.trim() || null,
          subDepartment: form.subDepartment.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to update employee");
        return;
      }
      onSaved?.(json.data);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
      <Card className="relative z-50 w-full max-w-2xl shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Edit employee</CardTitle>
            <CardDescription>
              Update {employee.firstName} {employee.lastName} — {employee.email} ({employee.employeeCode})
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
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
              <div className="space-y-2">
                <Label>System role</Label>
                <Select value={form.role} onValueChange={(v) => updateField("role", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r] || r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Employment status</Label>
                <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Department</Label>
                <Select
                  value={form.departmentId || "__none__"}
                  onValueChange={(v) => updateField("departmentId", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="__none__">— None —</SelectItem>
                    {(meta?.departments || []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Select
                  value={form.designationId || "__none__"}
                  onValueChange={(v) => updateField("designationId", v === "__none__" ? "" : v)}
                  disabled={!form.departmentId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={form.departmentId ? "Select designation" : "Pick department first"}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="__none__">— None —</SelectItem>
                    {designationsForDept.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Reporting manager</Label>
                <Select
                  value={form.managerId || "__none__"}
                  onValueChange={(v) => updateField("managerId", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-background">
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
              <div className="space-y-2">
                <Label htmlFor="edit-businessUnit">Business unit</Label>
                <Input
                  id="edit-businessUnit"
                  value={form.businessUnit}
                  onChange={(e) => updateField("businessUnit", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subDepartment">Sub department</Label>
                <Input
                  id="edit-subDepartment"
                  value={form.subDepartment}
                  onChange={(e) => updateField("subDepartment", e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                {error}
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
        </CardContent>
      </Card>
    </div>
  );
}
