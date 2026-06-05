"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ManageAnnouncementAccessDialog } from "./manage-announcement-access-dialog";

export function AnnouncementAccessSettings() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Organization announcements</CardTitle>
          <CardDescription>
            Control who can post company-wide messages visible in Recent activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Admins can always post announcements. Grant posting access to HR managers, team leads, or
            other trusted employees from the dashboard or here.
          </p>
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Manage announcement access
          </Button>
        </CardContent>
      </Card>
      <ManageAnnouncementAccessDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
