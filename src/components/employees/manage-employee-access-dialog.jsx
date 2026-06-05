"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import { Loader2, X } from "lucide-react";

export function ManageEmployeeAccessDialog({ open, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/employees/access")
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

  async function revokeAllDelegated() {
    if (!confirm("Remove employee add/remove access from everyone except administrators?")) return;
    setMessage("");
    const res = await fetch("/api/employees/access", { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Failed to revoke access");
      return;
    }
    setMessage(json.message || "Access revoked");
    load();
  }

  async function toggleAccess(user) {
    if (user.role === "ADMIN") return;
    setSavingId(user.id);
    setMessage("");
    const next = !user.canManageEmployees;
    const res = await fetch("/api/employees/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, canManageEmployees: next }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[85vh] flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 shrink-0">
          <div>
            <CardTitle>Employee management access</CardTitle>
            <CardDescription>
              Grant HR or other staff permission to add and remove employees. Only admins can
              change these settings.
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto space-y-3 flex-1">
          <Button type="button" variant="outline" size="sm" onClick={revokeAllDelegated}>
            Revoke all delegated access
          </Button>
          {message && <p className="text-sm text-primary">{message}</p>}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            users.map((u) => {
              const emp = u.employee;
              const isAdmin = u.role === "ADMIN";
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {emp ? `${emp.firstName} ${emp.lastName}` : u.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <Badge variant="outline" className="mt-1">
                      {ROLE_LABELS[u.role] || u.role}
                    </Badge>
                  </div>
                  {isAdmin ? (
                    <Badge variant="success">Always allowed</Badge>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant={u.canManageEmployees ? "default" : "outline"}
                      disabled={savingId === u.id}
                      onClick={() => toggleAccess(u)}
                    >
                      {savingId === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : u.canManageEmployees ? (
                        "Revoke access"
                      ) : (
                        "Grant access"
                      )}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
