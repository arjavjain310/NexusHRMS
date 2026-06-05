"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X } from "lucide-react";

function isValidRatingInput(value) {
  if (!value?.trim()) return false;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 5) return false;
  const rounded = Math.round(n * 10) / 10;
  return Math.abs(n - rounded) <= 1e-9;
}

export function SubmitReviewDialog({ open, onClose, onSaved, initial }) {
  const [meta, setMeta] = useState(null);
  const [employeeId, setEmployeeId] = useState("");
  const [period, setPeriod] = useState("");
  const [rating, setRating] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setEmployeeId(initial.employeeId || "");
      setPeriod(initial.period || "");
      setRating(initial.rating != null ? String(initial.rating) : "");
      setFeedback(initial.feedback || "");
    } else {
      setEmployeeId("");
      setPeriod("");
      setRating("");
      setFeedback("");
    }
    fetch("/api/performance/meta")
      .then((r) => r.json())
      .then((j) => setMeta(j.data || null));
  }, [open, initial]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValidRatingInput(rating)) {
      setError("Rating must be between 0 and 5 with at most one decimal place (e.g. 4.2).");
      return;
    }
    if (!employeeId || !period.trim()) {
      setError("Employee and review period are required.");
      return;
    }

    setLoading(true);
    setError(null);

    const url = initial?.id
      ? `/api/performance/reviews/${initial.id}`
      : "/api/performance";
    const method = initial?.id ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          period: period.trim(),
          rating: Number(rating),
          feedback: feedback.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to save review");
        return;
      }
      onSaved?.();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
      <Card className="relative z-50 w-full max-w-lg shadow-lg">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{initial?.id ? "Edit performance review" : "Submit performance review"}</CardTitle>
            <CardDescription>Rating scale 0–5, one decimal place only (e.g. 4.2)</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select
                value={employeeId || "__none__"}
                onValueChange={(v) => setEmployeeId(v === "__none__" ? "" : v)}
                disabled={!!initial?.id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-background">
                  <SelectItem value="__none__">— Select —</SelectItem>
                  {(meta?.employees || []).map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-period">Review period *</Label>
              <Input
                id="review-period"
                placeholder="e.g. Q1 2026"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-rating">Rating (0–5) *</Label>
              <Input
                id="review-rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="e.g. 4.2"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-feedback">Comments</Label>
              <Textarea
                id="review-feedback"
                rows={4}
                placeholder="Performance feedback and observations…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : initial?.id ? (
                  "Update review"
                ) : (
                  "Submit review"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
