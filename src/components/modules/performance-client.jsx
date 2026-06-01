"use client";

import { useEffect, useState } from "react";
import { ModuleSubNav, ME_MODULE_TABS } from "@/components/layout/module-sub-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { PerformanceBarChart } from "@/components/dashboard/charts";
import { Sparkles, Plus, Target } from "lucide-react";
export function PerformanceClient() {
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [showForm, setShowForm] = useState(false);
  function load() {
    fetch("/api/performance").then(r => r.json()).then(j => {
      setGoals(j.data.goals || []);
      setReviews(j.data.reviews || []);
    });
  }
  useEffect(() => {
    load();
  }, []);
  async function addGoal(e) {
    e.preventDefault();
    if (!newGoal.trim()) return;
    await fetch("/api/performance/goals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: newGoal,
        status: "IN_PROGRESS",
        progress: 0
      })
    });
    setNewGoal("");
    setShowForm(false);
    load();
  }
  const chartData = reviews.length ? reviews.slice(0, 6).map((r, i) => ({
    name: `R${i + 1}`,
    value: Math.round((Number(r.rating) || 3.5) * 20)
  })) : goals.slice(0, 4).map((g, i) => ({
    name: g.title.slice(0, 8) || `G${i + 1}`,
    value: Number(g.progress) || 0
  }));
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1) : "—";
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Performance</h1>
          <p className="text-muted-foreground mt-1">Goals, KPIs, reviews, and growth insights</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
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
            <p className="text-3xl font-semibold mt-1">{avgRating}/5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Reviews</p>
            <p className="text-3xl font-semibold mt-1">{reviews.length}</p>
          </CardContent>
        </Card>
      </div>

      {showForm && <Card>
          <CardContent className="p-4">
            <form onSubmit={addGoal} className="flex gap-2">
              <Input placeholder="Goal title..." value={newGoal} onChange={e => setNewGoal(e.target.value)} />
              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>}

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
            {goals.map(g => <div key={g.id}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-sm">{g.title}</span>
                  <span className="text-sm text-muted-foreground">{g.progress}%</span>
                </div>
                <Progress value={g.progress} />
                <p className="text-xs text-muted-foreground mt-1">{g.status}</p>
              </div>)}
            {!goals.length && <p className="text-sm text-muted-foreground">No goals yet. Add your first goal above.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceBarChart data={chartData.length ? chartData : [{
            name: "Q1",
            value: 75
          }, {
            name: "Q2",
            value: 82
          }]} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Reviews & AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.map(r => <div key={r.id} className="rounded-lg border p-4">
              <div className="flex justify-between">
                <p className="font-medium">{r.period}</p>
                <p className="text-primary font-semibold">{r.rating}/5</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{r.feedback}</p>
              {r.aiInsights && <p className="text-sm mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  {r.aiInsights}
                </p>}
            </div>)}
          {!reviews.length && <p className="text-sm text-muted-foreground">No performance reviews recorded yet.</p>}
        </CardContent>
      </Card>
    </div>;
}