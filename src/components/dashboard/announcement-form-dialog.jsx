"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

export function AnnouncementFormDialog({ open, onClose, onSaved, initial }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setContent(initial?.content || "");
      setPriority(initial?.priority || "normal");
      setError("");
    }
  }, [open, initial]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = initial?.announcementId
      ? `/api/announcements/${initial.announcementId}`
      : "/api/announcements";
    const method = initial?.announcementId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, priority }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Failed to save");
      return;
    }

    onSaved?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>{initial?.announcementId ? "Edit announcement" : "Post announcement"}</CardTitle>
            <CardDescription>Visible to everyone in your organization</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Office closed on Friday"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-content">Message</Label>
              <Textarea
                id="ann-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="e.g. Quarterly meeting at 3 PM in the main hall."
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-priority">Priority</Label>
              <select
                id="ann-priority"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="high">High (shown first)</option>
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : initial?.announcementId ? "Update" : "Post"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
