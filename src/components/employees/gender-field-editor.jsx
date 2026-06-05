"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GENDER_LABELS, GENDER_OPTIONS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

export function GenderFieldEditor({ employeeId, initialGender, canEdit, onSaved }) {
  const [gender, setGender] = useState(initialGender || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!gender) {
      setError("Please select a gender.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gender }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error || "Failed to update gender");
      return;
    }
    onSaved?.(json.data);
  }

  return (
    <div className="space-y-2">
      <Label>Gender</Label>
      {canEdit ? (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="sm:max-w-xs">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((g) => (
                <SelectItem key={g} value={g}>
                  {GENDER_LABELS[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      ) : (
        <p className="font-medium">
          {initialGender ? GENDER_LABELS[initialGender] || initialGender : "Not set"}
        </p>
      )}
      {!initialGender && !canEdit && (
        <p className="text-xs text-amber-600">
          Gender is not set. Contact Admin or HR to update your profile for leave eligibility.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
