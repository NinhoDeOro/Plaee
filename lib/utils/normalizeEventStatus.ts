import type { EventStatus, Sport, SportEvent } from "@/lib/types";
import { normalizeDateParam, toDateKey, toValidDate } from "@/lib/utils/date";

const STALE_HOURS: Record<Sport, number> = {
  football: 3,
  basketball: 4,
  tennis: 6,
  formula1: 4,
  other: 4
};

function hasScore(event: SportEvent) {
  return event.homeScore !== undefined && event.homeScore !== "" && event.awayScore !== undefined && event.awayScore !== "";
}

function normalizeStatusLabel(status: EventStatus, fallback: string) {
  if (status === "finished") return fallback === "Stato da verificare" ? fallback : "Conclusa";
  if (status === "scheduled") return "In programma";
  if (status === "live") return fallback || "Live";
  if (status === "postponed") return "Rinviata";
  if (status === "cancelled") return "Annullata";
  return fallback;
}

export function normalizeEventStatus(
  rawStatus: string | undefined,
  sport: Sport,
  startTime: string,
  selectedDate?: string,
  scoreAvailable = false
): { status: EventStatus; statusLabel?: string; isLive: boolean } {
  const value = String(rawStatus ?? "").toLowerCase();
  let status: EventStatus = "scheduled";

  if (/\b(cancel|cancelled|canceled|annull)\b/.test(value)) status = "cancelled";
  else if (/\b(postpon|rinviat|suspend)\b/.test(value)) status = "postponed";
  else if (/\b(finish|finished|final|ended|complete|ft|aet|pen|conclus)\b/.test(value)) status = "finished";
  else if (/\b(live|in play|inplay|progress|running|1h|2h|q1|q2|q3|q4|ot|set)\b/.test(value)) status = "live";

  const now = new Date();
  const eventStart = toValidDate(startTime);
  const todayKey = toDateKey(now);
  const selectedKey = selectedDate ? normalizeDateParam(selectedDate) : undefined;
  const eventKey = toDateKey(eventStart);
  const staleHours = STALE_HOURS[sport] ?? 4;
  const isOlderThanThreshold = now.getTime() - eventStart.getTime() > staleHours * 60 * 60 * 1000;
  const isPastDay = eventKey < todayKey || Boolean(selectedKey && selectedKey < todayKey);

  if (status === "live" && isPastDay && isOlderThanThreshold) {
    return {
      status: "finished",
      statusLabel: scoreAvailable ? "Conclusa" : "Stato da verificare",
      isLive: false
    };
  }

  if (status === "scheduled" && scoreAvailable && eventKey < todayKey && isOlderThanThreshold) {
    return {
      status: "finished",
      statusLabel: "Stato da verificare",
      isLive: false
    };
  }

  return { status, isLive: status === "live" };
}

export function normalizeSportEventStatus(event: SportEvent, selectedDate?: string): SportEvent {
  const result = normalizeEventStatus(
    event.status,
    event.sport,
    event.startTime,
    selectedDate,
    hasScore(event)
  );

  if (result.status === event.status && result.isLive === event.isLive && !result.statusLabel) return event;

  return {
    ...event,
    status: result.status,
    statusLabel: normalizeStatusLabel(result.status, result.statusLabel ?? event.statusLabel),
    isLive: result.isLive,
    minute: result.status === "live" ? event.minute : undefined
  };
}
