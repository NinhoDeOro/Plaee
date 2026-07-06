import type { MatchDetail, ScoreQuery, SportEvent } from "@/lib/types";
import { fetchJson } from "@/lib/utils/fetcher";
import { normalizeDateParam } from "@/lib/utils/date";
import { getStatusLabel } from "@/lib/utils/status";
import { normalizeSportEventStatus } from "@/lib/utils/normalizeEventStatus";

const DEFAULT_API_FORMULA1_BASE_URL = "https://v1.formula-1.api-sports.io";
const FORMULA1_CACHE_MS = 30 * 60 * 1000;
const FORMULA1_LIVE_CACHE_MS = 2 * 60 * 1000;

type ApiFormula1Race = {
  id: number;
  competition?: {
    id?: number;
    name?: string;
    location?: {
      country?: string;
      city?: string;
    };
  };
  circuit?: {
    id?: number;
    name?: string;
    image?: string;
  };
  season?: number;
  type?: string;
  timezone?: string;
  date?: string;
  status?: string;
  winner?: {
    name?: string;
  };
  driver?: {
    name?: string;
  };
};

type ApiFormula1Response<T> = {
  response: T[];
  errors?: unknown;
};

function getKey() {
  const key = process.env.API_SPORTS_KEY;
  if (!key) throw new Error("Missing API_SPORTS_KEY");
  return key;
}

function baseUrl() {
  return process.env.API_FORMULA1_BASE_URL || DEFAULT_API_FORMULA1_BASE_URL;
}

function headers() {
  return { "x-apisports-key": getKey() };
}

function hasErrors(errors: unknown) {
  if (!errors) return false;
  if (Array.isArray(errors)) return errors.length > 0;
  if (typeof errors === "object") return Object.keys(errors).length > 0;
  return true;
}

function assertResponse<T extends { errors?: unknown }>(data: T) {
  if (hasErrors(data.errors)) {
    throw new Error("API-FORMULA-1 returned an error");
  }
  return data;
}

function mapStatus(value?: string) {
  const status = (value ?? "").toLowerCase();
  if (status.includes("live") || status.includes("progress") || status.includes("running")) return "live" as const;
  if (status.includes("complete") || status.includes("finish") || status.includes("ended")) return "finished" as const;
  if (status.includes("postpon")) return "postponed" as const;
  if (status.includes("cancel")) return "cancelled" as const;
  return "scheduled" as const;
}

function mapRace(race: ApiFormula1Race): SportEvent {
  const raceName = race.competition?.name ?? "Gran Premio";
  const sessionType = race.type ?? "Formula 1";
  const circuit = race.circuit?.name;
  const status = mapStatus(race.status);
  const winner = race.winner?.name ?? race.driver?.name;

  return {
    id: `api-formula1-${race.id}`,
    sport: "formula1",
    competition: raceName,
    competitionId: race.competition?.id,
    country: race.competition?.location?.country,
    leagueLogo: race.circuit?.image,
    homeName: raceName,
    awayName: circuit ?? sessionType,
    homeScore: winner ? "Vincitore" : undefined,
    awayScore: winner,
    status,
    statusLabel: status === "live" ? getStatusLabel(status) : race.status ?? getStatusLabel(status),
    startTime: race.date ?? new Date(`${normalizeDateParam()}T12:00:00`).toISOString(),
    isLive: status === "live",
    venue: [circuit, race.competition?.location?.city].filter(Boolean).join(" · ") || undefined,
    category: sessionType,
    raceName,
    circuit,
    sessionType,
    winner,
    provider: "api-formula1"
  };
}

function endpoint(params: URLSearchParams) {
  return `${baseUrl()}/races?${params.toString()}`;
}

export async function getFormula1Events(query: ScoreQuery = {}) {
  if (query.sport && query.sport !== "all" && query.sport !== "formula1" && query.sport !== "motors") return [];

  const date = normalizeDateParam(query.date);
  const params = new URLSearchParams({ date });

  const data = await fetchJson<ApiFormula1Response<ApiFormula1Race>>(endpoint(params), {
    headers: headers(),
    revalidate: query.status === "live" ? 120 : 1800,
    cacheTtlMs: query.status === "live" ? FORMULA1_LIVE_CACHE_MS : FORMULA1_CACHE_MS,
    cacheKey: `api-formula1-races-${params.toString()}`
  });

  const events = assertResponse(data).response.map(mapRace).map((event) => normalizeSportEventStatus(event, query.date));
  if (query.status && query.status !== "all") {
    return events.filter((event) => event.status === query.status);
  }

  return events;
}

export async function getFormula1MatchDetail(id: string): Promise<MatchDetail | null> {
  const raceId = id.replace("api-formula1-", "");
  const params = new URLSearchParams({ id: raceId });
  const data = await fetchJson<ApiFormula1Response<ApiFormula1Race>>(endpoint(params), {
    headers: headers(),
    revalidate: 1800,
    cacheTtlMs: FORMULA1_CACHE_MS,
    cacheKey: `api-formula1-race-${raceId}`
  });

  const race = assertResponse(data).response[0];
  if (!race) return null;

  return {
    ...normalizeSportEventStatus(mapRace(race)),
    timeline: [],
    stats: [],
    relatedNews: []
  };
}

export const formula1Provider = {
  name: "api-formula1" as const,
  getEvents: getFormula1Events,
  getMatchDetail: getFormula1MatchDetail
};
