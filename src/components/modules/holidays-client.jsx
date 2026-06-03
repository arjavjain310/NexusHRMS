"use client";

import { useEffect, useMemo, useState } from "react";
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

export function HolidaysClient() {
  const [holidays, setHolidays] = useState([]);
  const [year, setYear] = useState(2026);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/holidays")
      .then((r) => r.json())
      .then((j) => {
        setHolidays(j.data || []);
        if (j.year) setYear(j.year);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
        description="Company holidays (public) and optional floater leave days — India 2026"
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-2">
          <Badge variant="success">Public</Badge>
          <span className="text-muted-foreground">Holiday for all (New Year, Republic Day, Independence Day, Gandhi Jayanti)</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <Badge variant="secondary">Floater leave</Badge>
          <span className="text-muted-foreground">Optional — employees may apply as floater</span>
        </span>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Loading holidays…</p>
      ) : (
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
      )}
    </div>
  );
}
