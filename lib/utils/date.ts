const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function toValidDate(value: Date | string | number | null | undefined = new Date(), fallback: Date | string | number = new Date()) {
  const fallbackDate = fallback instanceof Date ? new Date(fallback) : new Date(fallback);
  const safeFallback = Number.isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate;

  if (value === null || value === undefined || value === "") {
    return safeFallback;
  }

  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? safeFallback : date;
}

export function toDateKey(value: Date | string = new Date()) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return DATE_FORMATTER.format(toValidDate(value));
}

export function shiftDate(base: Date | string = new Date(), days = 0) {
  const date = toValidDate(base);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function normalizeDateParam(date?: string) {
  if (!date || date === "today") return toDateKey();
  if (date === "yesterday") return shiftDate(new Date(), -1);
  if (date === "tomorrow") return shiftDate(new Date(), 1);
  return toDateKey(date);
}

export function dateAt(dayOffset: number, hours: number, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(toValidDate(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(toValidDate(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(toValidDate(value));
}

export function getRelativeDateOptions() {
  return [
    { label: "Ieri", value: "yesterday", date: shiftDate(new Date(), -1) },
    { label: "Oggi", value: "today", date: toDateKey() },
    { label: "Domani", value: "tomorrow", date: shiftDate(new Date(), 1) }
  ];
}
