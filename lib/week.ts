/**
 * Monday–Sunday week helpers. All dates are local calendar days as
 * `YYYY-MM-DD` strings — never UTC midnight, which can shift the day.
 */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Format a local Date as YYYY-MM-DD. */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Parse YYYY-MM-DD into a local Date at midnight. */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Monday of the week containing `date` (or today). Sunday is the end of that
 * week (ISO-style week start Monday).
 */
export function mondayOf(date: Date = new Date()): string {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = local.getDay(); // 0=Sun … 6=Sat
  const offset = day === 0 ? -6 : 1 - day;
  local.setDate(local.getDate() + offset);
  return formatDate(local);
}

export function sundayOf(weekStartMonday: string): string {
  const monday = parseDate(weekStartMonday);
  monday.setDate(monday.getDate() + 6);
  return formatDate(monday);
}

export function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function shiftWeek(weekStartMonday: string, weeks: number): string {
  return addDays(weekStartMonday, weeks * 7);
}

/** Mon–Sun dates for a week that starts on `weekStartMonday`. */
export function weekDates(weekStartMonday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartMonday, i));
}

const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function weekdayShort(iso: string): string {
  const monday = mondayOf(parseDate(iso));
  const idx = Math.round(
    (parseDate(iso).getTime() - parseDate(monday).getTime()) /
      (24 * 60 * 60 * 1000),
  );
  return WEEKDAY_SHORT[idx] ?? "Mon";
}

/** Human label like "Sep 1 – Sep 7, 2026". */
export function formatWeekRange(weekStartMonday: string): string {
  const start = parseDate(weekStartMonday);
  const end = parseDate(sundayOf(weekStartMonday));
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}
