import type { MatchDetail, MatchStat, MatchTimelineItem, ScoreQuery, Sport, SportEvent } from "@/lib/types";
import { normalizeDateParam } from "@/lib/utils/date";
import { fetchJson } from "@/lib/utils/fetcher";
import { getStatusLabel, normalizeTheSportsDbStatus } from "@/lib/utils/status";

type TheSportsDbEvent = {
  idEvent: string;
  strSport?: string;
  strLeague?: string;
  strCountry?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string | null;
  strProgress?: string | null;
  dateEvent?: string;
  strTime?: string | null;
  strVenue?: string;
  strThumb?: string;
};

type TheSportsDbResponse<T> = {
  events?: T[] | null;
  event?: T[] | null;
  timeline?: Array<{
    strTimeline?: string;
    strTimelineDetail?: string;
    strPlayer?: string;
    strTeam?: string;
    intTime?: string;
  }> | null;
  eventstats?: Array<{
    strStat?: string;
    intHome?: string;
    intAway?: string;
  }> | null;
};

const SPORT_MAP: Partial<Record<Sport, string>> = {
  football: "Soccer",
  tennis: "Tennis",
  basketball: "Basketball",
  formula1: "Motorsport"
};

function getKey() {
  return process.env.THESPORTSDB_KEY || "3";
}

function baseUrl() {
  return `https://www.thesportsdb.com/api/v1/json/${getKey()}`;
}

function sportsForQuery(sport?: ScoreQuery["sport"]) {
  if (sport && sport !== "all" && sport !== "trending") {
    const key = sport === "motors" ? "formula1" : sport;
    return SPORT_MAP[key as Sport] ? [SPORT_MAP[key as Sport] as string] : [];
  }

  return ["Soccer", "Tennis", "Basketball", "Motorsport"];
}

function toStartTime(event: TheSportsDbEvent) {
  const date = event.dateEvent ?? normalizeDateParam();
  const time = event.strTime && event.strTime !== "00:00:00" ? event.strTime : "12:00:00";
  return new Date(`${date}T${time.replace("Z", "")}Z`).toISOString();
}

function mapSport(value?: string): Sport {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("soccer") || normalized.includes("football")) return "football";
  if (normalized.includes("tennis")) return "tennis";
  if (normalized.includes("basket")) return "basketball";
  if (normalized.includes("motor")) return "formula1";
  return "other";
}

function mapEvent(event: TheSportsDbEvent): SportEvent {
  const status = normalizeTheSportsDbStatus(
    event.strStatus,
    event.intHomeScore,
    event.intAwayScore,
    event.strProgress
  );

  return {
    id: `thesportsdb-${event.idEvent}`,
    sport: mapSport(event.strSport),
    competition: event.strLeague ?? "Competizione",
    country: event.strCountry,
    homeName: event.strHomeTeam ?? "Casa",
    awayName: event.strAwayTeam ?? "Trasferta",
    homeScore: event.intHomeScore ?? undefined,
    awayScore: event.intAwayScore ?? undefined,
    status,
    statusLabel: status === "live" ? getStatusLabel(status, event.strProgress ?? undefined) : getStatusLabel(status),
    minute: event.strProgress ?? undefined,
    startTime: toStartTime(event),
    isLive: status === "live",
    venue: event.strVenue,
    provider: "thesportsdb"
  };
}

function parseId(id: string) {
  return id.replace("thesportsdb-", "");
}

export async function getTheSportsDbEvents(query: ScoreQuery = {}) {
  const date = normalizeDateParam(query.date);
  const sports = sportsForQuery(query.sport);
  const results = await Promise.all(
    sports.map((sport) => {
      const params = new URLSearchParams({ d: date, s: sport });
      return fetchJson<TheSportsDbResponse<TheSportsDbEvent>>(`${baseUrl()}/eventsday.php?${params.toString()}`, {
        revalidate: 300,
        cacheTtlMs: 300000,
        cacheKey: `thesportsdb-events-${params.toString()}`
      });
    })
  );

  const events = results.flatMap((result) => result.events ?? []).map(mapEvent);
  if (query.status && query.status !== "all") {
    return events.filter((event) => event.status === query.status);
  }

  return events;
}

export async function getTheSportsDbMatchDetail(id: string): Promise<MatchDetail | null> {
  const eventId = parseId(id);
  const [eventData, timelineData, statsData] = await Promise.allSettled([
    fetchJson<TheSportsDbResponse<TheSportsDbEvent>>(`${baseUrl()}/lookupevent.php?id=${eventId}`, {
      revalidate: 60,
      cacheTtlMs: 60000,
      cacheKey: `thesportsdb-event-${eventId}`
    }),
    fetchJson<TheSportsDbResponse<TheSportsDbEvent>>(`${baseUrl()}/lookuptimeline.php?id=${eventId}`, {
      revalidate: 60,
      cacheTtlMs: 60000,
      cacheKey: `thesportsdb-timeline-${eventId}`
    }),
    fetchJson<TheSportsDbResponse<TheSportsDbEvent>>(`${baseUrl()}/lookupeventstats.php?id=${eventId}`, {
      revalidate: 60,
      cacheTtlMs: 60000,
      cacheKey: `thesportsdb-stats-${eventId}`
    })
  ]);

  if (eventData.status !== "fulfilled") throw eventData.reason;
  const event = eventData.value.events?.[0] ?? eventData.value.event?.[0];
  if (!event) return null;

  const timeline: MatchTimelineItem[] =
    timelineData.status === "fulfilled"
      ? (timelineData.value.timeline ?? []).map((item) => ({
          minute: item.intTime,
          type: item.strTimeline ?? "event",
          team: item.strTeam,
          player: item.strPlayer,
          description: item.strTimelineDetail ?? item.strTimeline ?? "Evento partita"
        }))
      : [];

  const stats: MatchStat[] =
    statsData.status === "fulfilled"
      ? (statsData.value.eventstats ?? []).map((item) => ({
          label: item.strStat ?? "Statistica",
          homeValue: item.intHome ?? "-",
          awayValue: item.intAway ?? "-"
        }))
      : [];

  return {
    ...mapEvent(event),
    timeline,
    stats,
    relatedNews: []
  };
}

export const theSportsDbProvider = {
  name: "thesportsdb" as const,
  getEvents: getTheSportsDbEvents,
  getMatchDetail: getTheSportsDbMatchDetail
};
