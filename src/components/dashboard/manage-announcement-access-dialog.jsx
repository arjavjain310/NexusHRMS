"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import { Loader2, X } from "lucide-react";

export function ManageAnnouncementAccessDialog({ open, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/announcements/access")
      .then((r) => r.json())
      .then((j) => {
        setUsers(j.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!open) return null;

  async function toggleAccess(user) {
    if (user.role === "ADMIN") return;
    setSavingId(user.id);
    setMessage("");
    const next = !user.canPostAnnouncements;
    const res = await fetch("/api/announcements/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, canPostAnnouncements: next }),
    });
    const json = await res.json();
    setSavingId(null);
    if (!res.ok) {
      setMessage(json.error || "Update failed");
      return;
    }
    setMessage(json.message || "Access updated");
    load();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
      <Card className="relative z-50 w-full max-w-2xl shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Announcement posting access</CardTitle>
            <CardDescription>
              Grant HR managers, team leads, or others permission to post organization-wide
              messages. Admins always have access.
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {message && <p className="mb-4 text-sm text-muted-foreground">{message}</p>}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {u.employee
                        ? `${u.employee.firstName} ${u.employee.lastName}`
                        : u.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABELS[u.role] || u.role}
                      {u.employee?.employeeCode ? ` · ${u.employee.employeeCode}` : ""}
                    </p>
                  </div>
                  {u.role === "ADMIN" ? (
                    <Badge>Always allowed</Badge>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant={u.canPostAnnouncements ? "default" : "outline"}
                      disabled={savingId === u.id}
                      onClick={() => toggleAccess(u)}
                    >
                      {savingId === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : u.canPostAnnouncements ? (
                        "Revoke"
                      ) : (
                        "Grant"
                      )}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
