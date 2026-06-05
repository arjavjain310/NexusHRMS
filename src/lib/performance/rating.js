/** Parse a 0–5 rating with at most one decimal place. Returns null if invalid. */
export function parsePerformanceRating(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 5) return null;
  const rounded = Math.round(n * 10) / 10;
  if (Math.abs(n - rounded) > 1e-9) return null;
  return rounded;
}

export function validatePerformanceRating(value) {
  const parsed = parsePerformanceRating(value);
  if (parsed == null) {
    return {
      ok: false,
      error: "Rating must be between 0 and 5 with at most one decimal place (e.g. 4.2).",
    };
  }
  return { ok: true, value: parsed };
}

/** Round average to one decimal (4.24 → 4.2, 4.26 → 4.3). */
export function averageRatingToOneDecimal(ratings) {
  if (!ratings?.length) return null;
  const nums = ratings.map((r) => Number(r)).filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  const avg = nums.reduce((s, n) => s + n, 0) / nums.length;
  return (Math.round(avg * 10) / 10).toFixed(1);
}

export function formatRatingDisplay(value) {
  const parsed = parsePerformanceRating(value);
  return parsed == null ? null : parsed.toFixed(1);
}
