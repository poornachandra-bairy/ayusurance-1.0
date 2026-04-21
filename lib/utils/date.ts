/**
 * Lightweight date/time formatting utilities.
 * No external library dependency — all built on Intl.
 */

const DATE_LOCALE = "en-IN";

/** Format an ISO date string to a readable date, e.g. "21 Apr 2026" */
export function formatDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(DATE_LOCALE, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Format an ISO datetime string to date + time, e.g. "21 Apr 2026, 14:30" */
export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(DATE_LOCALE, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Return number of days since an ISO date, e.g. "5 days ago" */
export function daysAgo(iso: string | undefined | null): string {
  if (!iso) return "—";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  } catch {
    return iso;
  }
}

/** Return today as ISO date string YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Return current ISO datetime */
export function nowISO(): string {
  return new Date().toISOString();
}
