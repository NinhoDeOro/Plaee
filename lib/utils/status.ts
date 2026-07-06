import type { EventStatus } from "@/lib/types";

const LABELS: Record<EventStatus, string> = {
  scheduled: "Programmato",
  live: "Live",
  finished: "Finale",
  postponed: "Rinviato",
  cancelled: "Annullato"
};

export function getStatusLabel(status: EventStatus, minute?: string | number) {
  if (status === "live" && minute) return `${minute}'`;
  return LABELS[status];
}

export function normalizeApiFootballStatus(short?: string): EventStatus {
  if (!short) return "scheduled";
  if (["1H", "2H", "ET", "BT", "P", "LIVE", "HT"].includes(short)) return "live";
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["PST", "SUSP", "INT"].includes(short)) return "postponed";
  if (["CANC", "ABD", "AWD", "WO"].includes(short)) return "cancelled";
  return "scheduled";
}

export function normalizeTheSportsDbStatus(
  status?: string | null,
  homeScore?: string | number | null,
  awayScore?: string | number | null,
  progress?: string | null
): EventStatus {
  const normalized = (status ?? "").toLowerCase();
  if (normalized.includes("postponed")) return "postponed";
  if (normalized.includes("cancelled") || normalized.includes("canceled")) return "cancelled";
  if (progress && progress !== "0") return "live";
  if (homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined) {
    return "finished";
  }
  if (normalized.includes("finished") || normalized.includes("full time")) return "finished";
  return "scheduled";
}

export function isEventStatus(value: string | null): value is EventStatus {
  return ["scheduled", "live", "finished", "postponed", "cancelled"].includes(value ?? "");
}
