"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatDateShort, formatDurationBetween, formatDurationMs, formatTime } from "@/lib/utils";
import { Clock, Globe, Laptop, LogOut, MoreHorizontal, User, FileText, Loader2 } from "lucide-react";
import { format, startOfWeek, eachDayOfInterval, isToday, addDays } from "date-fns";
import { ModuleSubNav, ME_MODULE_TABS } from "@/components/layout/module-sub-nav";
const MONTH_FILTERS = ["30 DAYS", "MAY", "APR", "MAR", "FEB", "JAN"];
function LiveClock({
  hour12
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <div className="text-center">
      <p className="text-3xl font-semibold tabular-nums tracking-tight">
        {formatTime(now, hour12)}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{formatDateShort(now)}</p>
    </div>;
}
function mergeRecord(list, incoming) {
  const next = list.filter(r => r.id !== incoming.id);
  next.unshift(incoming);
  return next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
function recordsToLogRows(records, hour12) {
  return records.filter(r => r.checkIn != null && r.checkIn !== "").map(rec => {
    const date = new Date(rec.date);
    const hasOut = !!rec.checkOut;
    const effective = hasOut && rec.checkIn && rec.checkOut ? formatDurationBetween(rec.checkIn, rec.checkOut) : "—";
    const logNote = hasOut ? `In ${formatTime(rec.checkIn, hour12)} · Out ${formatTime(rec.checkOut, hour12)}` : `Clocked in at ${formatTime(rec.checkIn, hour12)} — not checked out`;
    return {
      id: rec.id,
      date,
      visual: hasOut ? "present" : "partial",
      effectiveHours: effective,
      breakTaken: "—",
      grossHours: effective,
      arrival: formatTime(rec.checkIn, hour12),
      logNote
    };
  });
}
export function AttendanceClient() {
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [status, setStatus] = useState({
    checkedIn: false,
    checkedOut: false,
    canCheckIn: true,
    canCheckOut: false
  });
  const [hour12, setHour12] = useState(true);
  const [statsRange, setStatsRange] = useState("last-week");
  const [periodFilter, setPeriodFilter] = useState("30 DAYS");
  const [logTab, setLogTab] = useState("log");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const weekStart = startOfWeek(new Date(), {
    weekStartsOn: 1
  });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6)
  });
  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        cache: "no-store"
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: json.error || "Failed to load attendance"
        });
        return;
      }
      const data = json.data || [];
      setRecords(data);
      setTodayRecord(json.today || null);
      setStatus(json.status || {
        checkedIn: false,
        checkedOut: false,
        canCheckIn: true,
        canCheckOut: false
      });
      if (!json.employeeId) {
        setMessage({
          type: "error",
          text: "Your session has no employee profile. Log out and sign in with employee@nexus.demo"
        });
      }
    } catch (e) {
      setMessage({
        type: "error",
        text: "Network error loading attendance"
      });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);
  async function handleClock(action, source = "web") {
    setActionLoading(`${action}-${source}`);
    setMessage(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          source
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: json.error || "Action failed"
        });
        return;
      }
      setMessage({
        type: "success",
        text: json.message || "Saved"
      });
      if (json.records.length) {
        setRecords(json.records);
      } else if (json.data) {
        setRecords(prev => mergeRecord(prev, json.data));
      }
      if (json.data) {
        const saved = json.data;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const savedDay = new Date(saved.date);
        savedDay.setHours(0, 0, 0, 0);
        if (savedDay.getTime() === today.getTime() || Math.abs(savedDay.getTime() - today.getTime()) < 86400000) {
          setTodayRecord(saved);
        }
      }
      setStatus({
        checkedIn: !!json.data.checkIn,
        checkedOut: !!json.data.checkOut,
        canCheckIn: !json.data.checkIn || !!json.data.checkOut,
        canCheckOut: !!json.data.checkIn && !json.data.checkOut
      });
      await loadAttendance();
    } catch (e2) {
      setMessage({
        type: "error",
        text: "Network error. Could not save to server."
      });
    } finally {
      setActionLoading(null);
    }
  }
  const logRows = useMemo(() => recordsToLogRows(records, hour12), [records, hour12]);
  const avgHrsMe = useMemo(() => {
    const completed = records.filter(r => r.checkIn && r.checkOut);
    if (!completed.length) return "—";
    const total = completed.reduce((sum, r) => sum + (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()), 0);
    const avg = total / completed.length;
    const h = Math.floor(avg / 3600000);
    const m = Math.floor(avg % 3600000 / 60000);
    return `${h}h ${m}m`;
  }, [records]);
  const todayDuration = useMemo(() => {
    if (!todayRecord.checkIn) return null;
    const end = todayRecord.checkOut ? new Date(todayRecord.checkOut) : new Date();
    return formatDurationMs(end.getTime() - new Date(todayRecord.checkIn).getTime());
  }, [todayRecord]);
  const shiftProgress = useMemo(() => {
    if (!todayRecord.checkIn) return 0;
    const start = new Date(todayRecord.checkIn).getTime();
    const end = todayRecord.checkOut ? new Date(todayRecord.checkOut).getTime() : Date.now();
    const target = 9 * 3600000;
    return Math.min(100, Math.round((end - start) / target * 100));
  }, [todayRecord]);
  const recordsByDay = useMemo(() => {
    const map = new Map();
    records.forEach(r => map.set(new Date(r.date).toDateString(), r));
    return map;
  }, [records]);
  return <div className="space-y-6">
      {message && <div className={cn("rounded-lg border px-4 py-3 text-sm", message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300")}>
          {message.text}
        </div>}

      <ModuleSubNav items={ME_MODULE_TABS} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">Attendance Stats</CardTitle>
            <Select value={statsRange} onValueChange={setStatsRange}>
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-3 text-sm items-center">
              <span />
              <span className="text-xs text-muted-foreground text-center">AVG HRS / DAY</span>
              <span className="text-xs text-muted-foreground text-center">ON TIME ARRIVAL</span>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-amber-700" />
                </div>
                <span className="font-medium">Me</span>
              </div>
              <span className="text-center font-medium">{avgHrsMe}</span>
              <span className="text-center font-medium text-muted-foreground">—</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Timings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between gap-1">
              {weekDays.map(d => {
              const rec = recordsByDay.get(d.toDateString());
              const hasAttendance = !!rec.checkIn;
              return <div key={d.toISOString()} className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium", isToday(d) && "bg-primary text-primary-foreground", !isToday(d) && hasAttendance && "bg-emerald-100 text-emerald-700", !isToday(d) && !hasAttendance && "text-muted-foreground")} title={format(d, "EEE, d MMM")}>
                    {format(d, "EEEEE")}
                  </div>;
            })}
            </div>
            <div>
              {todayRecord.checkIn ? <>
                  <p className="text-sm font-medium">
                    Today · In {formatTime(todayRecord.checkIn, hour12)}
                    {todayRecord.checkOut ? ` · Out ${formatTime(todayRecord.checkOut, hour12)}` : " · Active"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Duration: {todayDuration}
                  </p>
                </> : <p className="text-sm text-muted-foreground">Not clocked in today</p>}
              <Progress value={shiftProgress} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 py-4">
              <LiveClock hour12={hour12} />
            </div>
            <div className="space-y-2">
              <Button className="w-full justify-start gap-2" variant="outline" onClick={() => handleClock("check-in", "web")} disabled={!status.canCheckIn || !!actionLoading}>
                {actionLoading === "check-in-web" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4 text-primary" />}
                Web Clock-In
              </Button>
              <Button className="w-full justify-start gap-2" variant="outline" onClick={() => handleClock("check-in", "remote")} disabled={!status.canCheckIn || !!actionLoading}>
                {actionLoading === "check-in-remote" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Laptop className="h-4 w-4 text-primary" />}
                Remote Clock-In
              </Button>
              <Button className="w-full justify-start gap-2" variant={status.canCheckOut ? "default" : "secondary"} onClick={() => handleClock("check-out")} disabled={!status.canCheckOut || !!actionLoading}>
                {actionLoading.startsWith("check-out") ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Clock Out
              </Button>
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:underline">
                <FileText className="h-4 w-4" />
                Attendance Policy
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Logs & Requests</CardTitle>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <span className="text-muted-foreground">24 hour format</span>
            <button type="button" role="switch" aria-checked={!hour12} onClick={() => setHour12(h => !h)} className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors", !hour12 ? "bg-primary" : "bg-muted")}>
              <span className={cn("pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform", !hour12 ? "translate-x-5" : "translate-x-0")} />
            </button>
          </label>
        </CardHeader>
        <CardContent>
          <Tabs value={logTab} onValueChange={setLogTab}>
            <TabsList className="bg-muted/60 mb-6">
              <TabsTrigger value="log">Attendance Log</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="requests">Attendance Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="log" className="mt-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Last 30 Days</p>
                <div className="flex flex-wrap gap-2">
                  {MONTH_FILTERS.map(m => <button key={m} type="button" onClick={() => setPeriodFilter(m)} className={cn("rounded-md px-3 py-1 text-xs font-semibold tracking-wide transition-colors", periodFilter === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                      {m}
                    </button>)}
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Attendance Visual</th>
                      <th className="px-4 py-3">Effective Hours</th>
                      <th className="px-4 py-3">Break Taken</th>
                      <th className="px-4 py-3">Gross Hours</th>
                      <th className="px-4 py-3">Arrival</th>
                      <th className="px-4 py-3">Log</th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </td>
                      </tr> : logRows.length === 0 ? <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                          No time entries yet. Use Clock-In to record your attendance.
                        </td>
                      </tr> : logRows.map(row => <tr key={row.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-4 font-medium whitespace-nowrap">
                            {formatDateShort(row.date)}
                          </td>
                          <td className="px-4 py-4">
                            {row.visual === "present" ? <div className="flex gap-0.5">
                                {Array.from({
                          length: 8
                        }).map((_, i) => <div key={i} className="h-6 w-1.5 rounded-sm bg-emerald-500" />)}
                              </div> : <div className="flex gap-0.5">
                                {Array.from({
                          length: 4
                        }).map((_, i) => <div key={i} className="h-6 w-1.5 rounded-sm bg-primary/70" />)}
                              </div>}
                          </td>
                          <td className="px-4 py-4">{row.effectiveHours}</td>
                          <td className="px-4 py-4">{row.breakTaken}</td>
                          <td className="px-4 py-4">{row.grossHours}</td>
                          <td className="px-4 py-4">{row.arrival}</td>
                          <td className="px-4 py-4 text-xs text-muted-foreground">
                            {row.logNote}
                          </td>
                          <td className="px-4 py-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>)}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="calendar">
              <div className="rounded-lg border p-8 text-center text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-foreground mb-2">Last 30 days</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {records.filter(r => r.checkIn).map(r => <span key={r.id} className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs">
                      {formatDateShort(r.date)}
                    </span>)}
                  {!records.some(r => r.checkIn) && <p>No entries recorded</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="requests">
              <div className="rounded-lg border p-8 text-center text-muted-foreground">
                <p>No attendance adjustment requests</p>
                <p className="text-xs mt-2">Corrections can be added in a future release</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
}