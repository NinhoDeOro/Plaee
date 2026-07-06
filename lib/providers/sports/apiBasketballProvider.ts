import type { MatchDetail, ScoreQuery, SportEvent } from "@/lib/types";
import { fetchJson } from "@/lib/utils/fetcher";
import { normalizeDateParam } from "@/lib/utils/date";
import { getStatusLabel } from "@/lib/utils/status";
import { normalizeSportEventStatus } from "@/lib/utils/normalizeEventStatus";

const DEFAULT_API_BASKETBALL_BASE_URL = "https://v1.basketball.api-sports.io";
const LIVE_CACHE_MS = 2 * 60 * 1000;
const GAMES_CACHE_MS = 10 * 60 * 1000;

type ApiBasketballGame = {
  id: number;
  date?: string;
  time?: string;
  timestamp?: number;
  timezone?: string;
  venue?: string;
  status?: {
    long?: string;
    short?: string;
    timer?: string | null;
  };
  league?: {
    name?: string;
  };
  country?: {
    name?: string;
  };
  teams?: {
    home?: { name?: string; logo?: string };
    away?: { name?: string; logo?: string };
  };
  scores?: {
    home?: { total?: number | string | null };
    away?: { total?: number | string | null };
  };
};

type ApiBasketballResponse<T> = {
  response: T[];
  errors?: unknown;
};

function getKey() {
  const key = process.env.API_SPORTS_KEY;
  if (!key) throw new Error("Missing API_SPORTS_KEY");
  return key;
}

function baseUrl() {
  return process.env.API_BASKETBALL_BASE_URL || DEFAULT_API_BASKETBALL_BASE_URL;
}

function headers() {
  return { "x-apisports-key": getKey() };
}

function mapStatus(short?: string, long?: string) {
  const value = (short || long || "").toUpperCase();
  if (["Q1", "Q2", "Q3", "Q4", "OT", "BT", "HT"].includes(value)) return "live" as const;
  if (["FT", "AOT", "AP"].includes(value) || value.includes("FINISH")) return "finished" as const;
  if (value.includes("POST")) return "postponed" as const;
  if (value.includes("CANC")) return "cancelled" as const;
  return "scheduled" as const;
}

function toStartTime(game: ApiBasketballGame) {
  if (game.timestamp) return new Date(game.timestamp * 1000).toISOString();
  if (game.date) return new Date(game.date).toISOString();
  const date = normalizeDateParam();
  return new Date(`${date}T${game.time ?? "12:00"}:00`).toISOString();
}

function mapGame(game: ApiBasketballGame): SportEvent {
  const status = mapStatus(game.status?.short, game.status?.long);
  const minute = status === "live" ? game.status?.timer || game.status?.short : undefined;

  return {
    id: `api-basketball-${game.id}`,
    sport: "basketball",
    competition: game.league?.name ?? "Basket",
    country: game.country?.name,
    homeName: game.teams?.home?.name ?? "Casa",
    awayName: game.teams?.away?.name ?? "Trasferta",
    homeLogo: game.teams?.home?.logo,
    awayLogo: game.teams?.away?.logo,
    homeScore: game.scores?.home?.total ?? undefined,
    awayScore: game.scores?.away?.total ?? undefined,
    status,
    statusLabel: status === "live" ? getStatusLabel(status, minute) : game.status?.long ?? getStatusLabel(status),
    minute,
    startTime: toStartTime(game),
    isLive: status === "live",
    venue: game.venue,
    provider: "api-basketball"
  };
}

export async function getApiBasketballEvents(query: ScoreQuery = {}) {
  if (query.sport && query.sport !== "all" && query.sport !== "basketball") return [];

  const params = new URLSearchParams();
  if (query.status === "live") {
    params.set("live", "all");
  } else {
    params.set("date", normalizeDateParam(query.date));
  }

  const data = await fetchJson<ApiBasketballResponse<ApiBasketballGame>>(
    `${baseUrl()}/games?${params.toString()}`,
    {
      headers: headers(),
      revalidate: query.status === "live" ? 120 : 600,
      cacheTtlMs: query.status === "live" ? LIVE_CACHE_MS : GAMES_CACHE_MS,
      cacheKey: `api-basketball-games-${params.toString()}`
    }
  );

  const events = data.response.map(mapGame).map((event) => normalizeSportEventStatus(event, query.date));
  if (query.status && query.status !== "all") {
    return events.filter((event) => event.status === query.status);
  }

  return events;
}

export async function getApiBasketballMatchDetail(id: string): Promise<MatchDetail | null> {
  const gameId = id.replace("api-basketball-", "");
  const data = await fetchJson<ApiBasketballResponse<ApiBasketballGame>>(
    `${baseUrl()}/games?id=${gameId}`,
    {
      headers: headers(),
      revalidate: 60,
      cacheTtlMs: 60000,
      cacheKey: `api-basketball-game-${gameId}`
    }
  );

  const game = data.response[0];
  if (!game) return null;

  return {
    ...normalizeSportEventStatus(mapGame(game)),
    timeline: [],
    stats: [],
    relatedNews: []
  };
}

export const apiBasketballProvider = {
  name: "api-basketball" as const,
  getEvents: getApiBasketballEvents,
  getMatchDetail: getApiBasketballMatchDetail
};
