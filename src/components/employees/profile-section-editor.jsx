"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Loader2, Plus, Trash2, X, Check } from "lucide-react";

export function EditableSectionHeader({ title, canEdit, editing, onEdit, onCancel }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-base font-semibold leading-none tracking-tight">{title}</span>
      {canEdit && !editing && (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit {title}</span>
        </Button>
      )}
      {editing && (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
          <X className="h-4 w-4" />
          <span className="sr-only">Cancel</span>
        </Button>
      )}
    </div>
  );
}

export function BioEditor({ employeeId, initialBio, fallbackBio, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(initialBio || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio: bio.trim() }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Failed to save");
      return;
    }
    setEditing(false);
    onSaved(json.data);
  }

  const display = initialBio?.trim() || fallbackBio;

  return (
    <>
      <EditableSectionHeader
        title="Summary"
        canEdit
        editing={editing}
        onEdit={() => {
          setBio(initialBio || "");
          setEditing(true);
        }}
        onCancel={() => setEditing(false)}
      />
      {editing ? (
        <div className="space-y-3 mt-4">
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write a short professional summary…"
            rows={5}
            className="resize-y"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="button" size="sm" disabled={loading} onClick={save}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            Save summary
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed mt-4">{display}</p>
      )}
    </>
  );
}

const EMPTY_EDU = { degree: "", branch: "", cgpa: "" };

export function EducationEditor({ employeeId, initialEducation, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState(
    Array.isArray(initialEducation) && initialEducation.length > 0
      ? initialEducation
      : [{ ...EMPTY_EDU }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function startEdit() {
    setRows(
      Array.isArray(initialEducation) && initialEducation.length > 0
        ? initialEducation.map((e) => ({ ...e }))
        : [{ ...EMPTY_EDU }]
    );
    setEditing(true);
  }

  async function save() {
    const cleaned = rows
      .map((r) => ({
        degree: r.degree?.trim() || "",
        branch: r.branch?.trim() || "",
        cgpa: r.cgpa?.trim() || "",
      }))
      .filter((r) => r.degree || r.branch || r.cgpa);

    setLoading(true);
    setError("");
    const res = await fetch(`/api/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ education: cleaned }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Failed to save");
      return;
    }
    setEditing(false);
    onSaved(json.data);
  }

  const list = Array.isArray(initialEducation) ? initialEducation : [];

  return (
    <>
      <EditableSectionHeader
        title="Degrees & Certificates"
        canEdit
        editing={editing}
        onEdit={startEdit}
        onCancel={() => setEditing(false)}
      />
      {editing ? (
        <div className="space-y-4 mt-4">
          {rows.map((row, i) => (
            <div key={i} className="grid sm:grid-cols-3 gap-3 border rounded-lg p-3">
              <div className="space-y-1">
                <Label className="text-xs">Degree</Label>
                <Input
                  value={row.degree || ""}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...next[i], degree: e.target.value };
                    setRows(next);
                  }}
                  placeholder="B.Tech"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Branch / Specialization</Label>
                <Input
                  value={row.branch || ""}
                  onChange={(e) => {
                    const next = [...rows];
                    next[i] = { ...next[i], branch: e.target.value };
                    setRows(next);
                  }}
                  placeholder="AIML"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CGPA / Percentage</Label>
                <div className="flex gap-2">
                  <Input
                    value={row.cgpa || ""}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...next[i], cgpa: e.target.value };
                      setRows(next);
                    }}
                    placeholder="8.5"
                  />
                  {rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setRows(rows.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setRows([...rows, { ...EMPTY_EDU }])}>
            <Plus className="h-4 w-4 mr-1" /> Add degree
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="button" size="sm" disabled={loading} onClick={save}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
            Save education
          </Button>
        </div>
      ) : list.length > 0 ? (
        <div className="space-y-4 mt-4">
          {list.map((edu, i) => (
            <div
              key={i}
              className="grid sm:grid-cols-3 gap-2 text-sm border-b pb-3 last:border-0"
            >
              <div>
                <p className="text-muted-foreground text-xs">Degree</p>
                <p className="font-medium">{edu.degree || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Branch / Specialization</p>
                <p>{edu.branch || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">CGPA / Percentage</p>
                <p>{edu.cgpa || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-4">
          No education records added. Click the pen to add your degrees and certificates.
        </p>
      )}
    </>
  );
}
