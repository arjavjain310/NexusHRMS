"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Megaphone, Pencil, Trash2 } from "lucide-react";
import { AnnouncementFormDialog } from "./announcement-form-dialog";
import { ManageAnnouncementAccessDialog } from "./manage-announcement-access-dialog";

const ACTION_LABELS = {
  leave_requested: "Leave request submitted",
  leave_approved: "Leave approved",
  leave_rejected: "Leave rejected",
  leave_cancelled: "Leave cancelled",
  attendance_correction_requested: "Attendance correction requested",
  attendance_correction_approved: "Attendance correction approved",
  attendance_correction_rejected: "Attendance correction rejected",
  attendance_check_in: "Clocked in",
  attendance_check_out: "Clocked out",
  payroll_published: "Payslip published",
};

export function RecentActivity({ showApprovalsLink = false }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((j) => {
        setItems(j.data || []);
        setMeta(j.meta || {});
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteAnnouncement(item) {
    if (!confirm("Delete this announcement for everyone?")) return;
    const res = await fetch(`/api/announcements/${item.announcementId}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const description = meta.isApprover
    ? "Organization announcements and your team's leave & attendance updates"
    : "Organization announcements and your personal leave & attendance updates";

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
          <div>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 justify-end">
            {meta.canPostAnnouncements && (
              <Button type="button" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
                Post announcement
              </Button>
            )}
            {meta.canManageAnnouncementAccess && (
              <Button type="button" size="sm" variant="outline" onClick={() => setAccessOpen(true)}>
                Announcement access
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Activity will appear here — organization announcements and your leave & attendance
              updates.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) =>
                item.kind === "announcement" ? (
                  <li
                    key={item.id}
                    className="flex gap-3 text-sm border-b pb-3 last:border-0 rounded-md bg-primary/5 -mx-1 px-2 py-2"
                  >
                    <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium flex items-center gap-2 flex-wrap">
                            {item.title}
                            <Badge variant="outline" className="text-[10px] font-normal">
                              Organization
                            </Badge>
                            {item.priority === "high" && (
                              <Badge variant="destructive" className="text-[10px]">
                                Important
                              </Badge>
                            )}
                          </p>
                          <p className="text-muted-foreground text-xs mt-1 whitespace-pre-wrap">
                            {item.content}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Posted by {item.authorName} ·{" "}
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {item.canEdit && meta.canPostAnnouncements && (
                          <div className="flex shrink-0 gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Edit"
                              onClick={() => {
                                setEditing(item);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              aria-label="Delete"
                              onClick={() => deleteAnnouncement(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ) : (
                  <li key={item.id} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {ACTION_LABELS[item.action] || item.action.replace(/_/g, " ")}
                      </p>
                      {item.metadata?.employeeName && (
                        <p className="text-muted-foreground text-xs">{item.metadata.employeeName}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
          {showApprovalsLink && (
            <Link href="/approvals" className="text-xs text-primary hover:underline mt-4 inline-block">
              Open approval inbox →
            </Link>
          )}
        </CardContent>
      </Card>

      <AnnouncementFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={load}
        initial={editing}
      />
      <ManageAnnouncementAccessDialog open={accessOpen} onClose={() => setAccessOpen(false)} />
    </>
  );
}
