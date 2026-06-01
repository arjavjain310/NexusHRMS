import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY_LOCALE, DEFAULT_CURRENCY } from "@/lib/constants";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "INR" ? 0 : 2,
  }).format(amount);
}

const DATE_LOCALE = "en-IN";

export function formatDate(date, options) {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

/** e.g. Tuesday, 2 June 2026 — safe Intl options (no dateStyle + weekday mix) */
export function formatDateLong(date = new Date()) {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

/** e.g. Tue, 02 Jun */
export function formatDateShort(date) {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

export function formatTime(date, hour12 = true) {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12,
  }).format(new Date(date));
}

export function formatDurationMs(ms) {
  if (ms <= 0) return "0h 0m";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export function formatDurationBetween(start, end) {
  return formatDurationMs(new Date(end).getTime() - new Date(start).getTime());
}

export function getInitials(firstName, lastName) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
