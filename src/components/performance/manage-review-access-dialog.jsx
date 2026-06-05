"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, X } from "lucide-react";

export function ManageReviewAccessDialog({ open, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/performance/access")
      .then((r) => r.json())
      .then((j) => setUsers(j.data || []))
      .finally(() => setLoading(false));
  }, [open]);

  async function toggle(user) {
    setToggling(user.id);
    const next = !user.canSubmitPerformanceReviews;
    const res = await fetch("/api/performance/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, canSubmitPerformanceReviews: next }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, canSubmitPerformanceReviews: next } : u
        )
      );
    }
    setToggling(null);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Performance review access
            </CardTitle>
            <CardDescription>
              Administrators and Senior Managers can always submit reviews. Grant access to
              others here.
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No eligible users found.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {u.employee
                        ? `${u.employee.firstName} ${u.employee.lastName}`
                        : u.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={u.canSubmitPerformanceReviews ? "default" : "outline"}
                    disabled={toggling === u.id}
                    onClick={() => toggle(u)}
                  >
                    {toggling === u.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : u.canSubmitPerformanceReviews ? (
                      "Granted"
                    ) : (
                      "Grant"
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
