"use client";

import { useCallback, useEffect, useState } from "react";
import { ModuleSubNav, ME_MODULE_TABS } from "@/components/layout/module-sub-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { PerformanceBarChart } from "@/components/dashboard/charts";
import { SubmitReviewDialog } from "@/components/performance/submit-review-dialog";
import { ManageReviewAccessDialog } from "@/components/performance/manage-review-access-dialog";
import { Sparkles, Plus, Target, ClipboardPen, Shield, Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";

function formatReviewDate(value) {
  if (!value) return "—";
  return formatDate(value);
}

export function PerformanceClient() {
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const [summary, setSummary] = useState({
    avgRating: "—",
    reviewsCount: "0",
    isAdminProfile: false,
  });
  const [meta, setMeta] = useState(null);
  const [newGoal, setNewGoal] = useState("");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/performance").then((r) => r.json()),
      fetch("/api/performance/meta").then((r) => r.json()),
    ]).then(([perfJson, metaJson]) => {
      const data = perfJson.data || {};
      setGoals(data.goals || []);
      setReviews(data.reviews || []);
      setSubmittedReviews(data.submittedReviews || []);
      setSummary(
        data.summary || {
          avgRating: "—",
          reviewsCount: "0",
          isAdminProfile: false,
        }
      );
      setMeta(metaJson.data || null);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addGoal(e) {
    e.preventDefault();
    if (!newGoal.trim()) return;
    await fetch("/api/performance/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newGoal,
        status: "IN_PROGRESS",
        progress: 0,
      }),
    });
    setNewGoal("");
    setShowGoalForm(false);
    load();
  }

  const chartData = summary.isAdminProfile
    ? [{ name: "Admin", value: 100 }]
    : reviews.length
      ? reviews.slice(0, 6).map((r, i) => ({
          name: r.period?.slice(0, 8) || `R${i + 1}`,
          value: Math.round((Number(r.rating) || 0) * 20),
        }))
      : goals.slice(0, 4).map((g, i) => ({
          name: g.title.slice(0, 8) || `G${i + 1}`,
          value: Number(g.progress) || 0,
        }));

  const canSubmit = meta?.canSubmitReviews;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Performance</h1>
          <p className="text-muted-foreground mt-1">Goals, KPIs, reviews, and growth insights</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSubmit && (
            <Button onClick={() => { setEditingReview(null); setShowReviewDialog(true); }}>
              <ClipboardPen className="h-4 w-4" /> Submit Review
            </Button>
          )}
          {meta?.canGrantReviewAccess && (
            <Button variant="outline" onClick={() => setShowAccessDialog(true)}>
              <Shield className="h-4 w-4" /> Review access
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowGoalForm(!showGoalForm)}>
            <Plus className="h-4 w-4" /> Add Goal
          </Button>
        </div>
      </div>

      <ModuleSubNav items={ME_MODULE_TABS} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Active Goals</p>
            <p className="text-3xl font-semibold mt-1">{goals.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Avg Rating</p>
            <p className="text-3xl font-semibold mt-1">{summary.avgRating}/5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Reviews</p>
            <p className="text-3xl font-semibold mt-1">{summary.reviewsCount}</p>
          </CardContent>
        </Card>
      </div>

      {showGoalForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={addGoal} className="flex gap-2">
              <Input
                placeholder="Goal title..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
              />
              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Goals & KPIs
            </CardTitle>
            <CardDescription>Track progress on objectives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {goals.map((g) => (
              <div key={g.id}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-sm">{g.title}</span>
                  <span className="text-sm text-muted-foreground">{g.progress}%</span>
                </div>
                <Progress value={g.progress} />
                <p className="text-xs text-muted-foreground mt-1">{g.status}</p>
              </div>
            ))}
            {!goals.length && (
              <p className="text-sm text-muted-foreground">No goals yet. Add your first goal above.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceBarChart
              data={
                chartData.length
                  ? chartData
                  : [
                      { name: "—", value: 0 },
                    ]
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            My Performance Reviews
          </CardTitle>
          <CardDescription>Read-only — you cannot edit reviews assigned to you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.isAdminProfile && (
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-medium">Organization Administrator</p>
                <p className="text-primary font-semibold">5.0/5</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Reviewer: <span className="font-medium text-foreground">System Generated</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Administrators are excluded from the performance review workflow.
              </p>
            </div>
          )}
          {!summary.isAdminProfile &&
            reviews.map((r) => (
              <div key={r.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium">{r.period}</p>
                  <p className="text-primary font-semibold">{r.rating}/5</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Reviewer: <span className="text-foreground">{r.reviewerName}</span>
                  {" · "}
                  {formatReviewDate(r.reviewDate)}
                </p>
                {r.feedback && (
                  <p className="text-sm mt-3">{r.feedback}</p>
                )}
                {r.aiInsights && (
                  <p className="text-sm mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    {r.aiInsights}
                  </p>
                )}
              </div>
            ))}
          {!summary.isAdminProfile && !reviews.length && (
            <p className="text-sm text-muted-foreground">No performance reviews recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {canSubmit && submittedReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews you submitted</CardTitle>
            <CardDescription>Edit reviews you have created for employees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {submittedReviews.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {r.employee?.firstName} {r.employee?.lastName} — {r.period}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {r.rating}/5 · {formatReviewDate(r.reviewDate)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingReview({
                      id: r.id,
                      employeeId: r.employeeId,
                      period: r.period,
                      rating: r.rating,
                      feedback: r.feedback,
                    });
                    setShowReviewDialog(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <SubmitReviewDialog
        open={showReviewDialog}
        initial={editingReview}
        onClose={() => {
          setShowReviewDialog(false);
          setEditingReview(null);
        }}
        onSaved={load}
      />

      <ManageReviewAccessDialog
        open={showAccessDialog}
        onClose={() => setShowAccessDialog(false)}
      />
    </div>
  );
}
