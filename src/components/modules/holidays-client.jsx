"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { startOfDay } from "date-fns";

function HolidayRow({ holiday }) {
  const isPublic = !holiday.isOptional;
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="min-w-0">
        <p className="font-medium">{holiday.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isPublic ? "Holiday for all employees" : "Optional — use as floater leave"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(holiday.date)}
        </span>
        <Badge variant={isPublic ? "success" : "secondary"}>
          {isPublic ? "Public" : "Floater leave"}
        </Badge>
      </div>
    </div>
  );
}

export function HolidaysClient({ initialHolidays, year = 2026 }) {
  const holidays = initialHolidays ?? [];

  const { upcoming, past } = useMemo(() => {
    const today = startOfDay(new Date());
    const sorted = [...holidays].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const up = [];
    const pa = [];
    for (const h of sorted) {
      const d = startOfDay(new Date(h.date));
      if (d >= today) up.push(h);
      else pa.push(h);
    }
    return { upcoming: up, past: pa.reverse() };
  }, [holidays]);

  return (
    <div>
      <PageHeader
        title="Holiday Calendar"
        description="India 2026 — public holidays for all and optional floater leave days"
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-2">
          <Badge variant="success">Public</Badge>
          <span className="text-muted-foreground">
            New Year, Republic Day, Independence Day, Gandhi Jayanti
          </span>
        </span>
        <span className="inline-flex items-center gap-2">
          <Badge variant="secondary">Floater leave</Badge>
          <span className="text-muted-foreground">Holi, Diwali, Eid, and other optional days</span>
        </span>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming — {year}</CardTitle>
            <CardDescription>{upcoming.length} holiday(s) ahead</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No upcoming holidays in the calendar.
              </p>
            ) : (
              upcoming.map((h) => <HolidayRow key={h.id} holiday={h} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Past — {year}</CardTitle>
            <CardDescription>{past.length} holiday(s) already observed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {past.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No past holidays recorded yet.
              </p>
            ) : (
              past.map((h) => <HolidayRow key={h.id} holiday={h} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
