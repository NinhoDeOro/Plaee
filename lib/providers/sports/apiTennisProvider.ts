import type { MatchDetail, MatchTimelineItem, PreMatchInsight, ScoreQuery, SportEvent } from "@/lib/types";
import { fetchJson } from "@/lib/utils/fetcher";
import { normalizeDateParam } from "@/lib/utils/date";
import { getStatusLabel } from "@/lib/utils/status";
import { classifyTennisMatch, compareTennisEvents, getTennisImportanceBase } from "@/lib/utils/tennisClassification";
import { normalizeSportEventStatus } from "@/lib/utils/normalizeEventStatus";
import { normalizeTennisScore } from "@/lib/utils/tennisScore";

const DEFAULT_API_TENNIS_BASE_URL = "https://api.api-tennis.com/tennis/";
const LIVE_CACHE_MS = 2 * 60 * 1000;
const EVENTS_CACHE_MS = 10 * 60 * 1000;
const PLAYER_CACHE_MS = 24 * 60 * 60 * 1000;

type ApiTennisScore = {
  score_first?: string;
  score_second?: string;
  score_set?: string;
};

type ApiTennisPointByPoint = {
  set_number?: string;
  number_game?: string;
  player_served?: string;
  serve_winner?: string;
  serve_lost?: string | null;
  score?: string;
  points?: Array<{
    number_point?: string;
    score?: string;
    break_point?: string | null;
    set_point?: string | null;
    match_point?: string | null;
  }>;
};

type ApiTennisStatistic = {
  player_key?: string | number;
  stat_period?: string;
  stat_type?: string;
  stat_name?: string;
  stat_value?: string | number | null;
  stat_won?: string | number | null;
  stat_total?: string | number | null;
};

type ApiTennisEvent = {
  event_key?: string | number;
  event_type_key?: string | number;
  event_date?: string;
  event_time?: string;
  event_first_player?: string;
  first_player_key?: string | number;
  event_second_player?: string;
  second_player_key?: string | number;
  event_final_result?: string;
  event_game_result?: string;
  event_serve?: string | null;
  event_winner?: string | null;
  event_status?: string;
  event_type_type?: string;
  tournament_name?: string;
  tournament_key?: string | number;
  tournament_round?: string;
  tournament_season?: string;
  event_live?: string;
  event_first_player_logo?: string | null;
  event_second_player_logo?: string | null;
  event_qualification?: string | null;
  first_player_country?: string;
  second_player_country?: string;
  first_player_ranking?: string | number;
  second_player_ranking?: string | number;
  first_player_image_source?: "fixture" | "players-lookup" | "fallback";
  second_player_image_source?: "fixture" | "players-lookup" | "fallback";
  pointbypoint?: ApiTennisPointByPoint[];
  scores?: ApiTennisScore[];
  statistics?: ApiTennisStatistic[];
};

type ApiTennisResponse = {
  success: 0 | 1;
  result?: ApiTennisEvent[] | ApiTennisEvent;
  error?: string;
};

type ApiTennisPlayer = {
  player_key?: string | number;
  player_name?: string;
  player_full_name?: string;
  player_country?: string;
  player_logo?: string;
  stats?: Array<{
    season?: string;
    type?: string;
    rank?: string | number;
  }>;
};

type ApiTennisPlayerResponse = {
  success?: 0 | 1;
  result?: ApiTennisPlayer[] | ApiTennisPlayer;
  error?: string;
};

const playerCache = new Map<string, { expiresAt: number; value: ApiTennisPlayer | null }>();

function getKey() {
  const key = process.env.API_TENNIS_KEY;
  if (!key) throw new Error("Missing API_TENNIS_KEY");
  return key;
}

function baseUrl() {
  return process.env.API_TENNIS_BASE_URL || DEFAULT_API_TENNIS_BASE_URL;
}

function tennisRequest<T = ApiTennisResponse>(params: Record<string, string | undefined>, cacheKey: string, revalidate: number) {
  const search = new URLSearchParams({ APIkey: getKey() });
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });

  return fetchJson<T>(`${baseUrl()}?${search.toString()}`, {
    cache: "no-store",
    timeoutMs: 5500,
    cacheTtlMs: revalidate * 1000,
    cacheKey
  });
}

function asArray(value?: ApiTennisEvent[] | ApiTennisEvent) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function asPlayerArray(value?: ApiTennisPlayer[] | ApiTennisPlayer) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getLatestSinglesRanking(player?: ApiTennisPlayer | null) {
  const stats = player?.stats?.filter((item) => item.type === "singles" && item.rank) ?? [];
  return stats.sort((a, b) => Number(b.season ?? 0) - Number(a.season ?? 0))[0]?.rank;
}

async function getTennisPlayer(playerKey?: string | number) {
  if (!playerKey) return null;
  const key = String(playerKey);
  const cached = playerCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const data = await tennisRequest<ApiTennisPlayerResponse>(
      { method: "get_players", player_key: key },
      `api-tennis-player-${key}`,
      PLAYER_CACHE_MS / 1000
    );
    const player = data.success === 1 ? asPlayerArray(data.result)[0] ?? null : null;
    playerCache.set(key, { expiresAt: Date.now() + PLAYER_CACHE_MS, value: player });
    return player;
  } catch {
    playerCache.set(key, { expiresAt: Date.now() + 60 * 60 * 1000, value: null });
    return null;
  }
}

function cachedPlayer(playerKey?: string | number) {
  if (!playerKey) return null;
  const cached = playerCache.get(String(playerKey));
  return cached && cached.expiresAt > Date.now() ? cached.value : null;
}

async function enrichEventsWithPlayers(events: ApiTennisEvent[]) {
  const limit = Number(process.env.TENNIS_PLAYER_LOOKUP_LIMIT ?? 40);
  const lookupLimit = Number.isFinite(limit) && limit > 0 ? limit : 40;
  const missingKeys = new Set<string>();

  for (const event of events) {
    if (!event.event_first_player_logo && event.first_player_key) missingKeys.add(String(event.first_player_key));
    if (!event.event_second_player_logo && event.second_player_key) missingKeys.add(String(event.second_player_key));
  }

  await Promise.all(Array.from(missingKeys).slice(0, lookupLimit).map((key) => getTennisPlayer(key)));

  return events.map((event) => {
    const first = cachedPlayer(event.first_player_key);
    const second = cachedPlayer(event.second_player_key);
    const firstLogo = event.event_first_player_logo ?? first?.player_logo ?? null;
    const secondLogo = event.event_second_player_logo ?? second?.player_logo ?? null;
    const firstImageSource: ApiTennisEvent["first_player_image_source"] = event.event_first_player_logo
      ? "fixture"
      : first?.player_logo
        ? "players-lookup"
        : "fallback";
    const secondImageSource: ApiTennisEvent["second_player_image_source"] = event.event_second_player_logo
      ? "fixture"
      : second?.player_logo
        ? "players-lookup"
        : "fallback";

    return {
      ...event,
      event_first_player_logo: firstLogo,
      event_second_player_logo: secondLogo,
      first_player_image_source: firstImageSource,
      second_player_image_source: secondImageSource,
      first_player_country: event.first_player_country ?? first?.player_country,
      second_player_country: event.second_player_country ?? second?.player_country,
      first_player_ranking: event.first_player_ranking ?? getLatestSinglesRanking(first),
      second_player_ranking: event.second_player_ranking ?? getLatestSinglesRanking(second)
    };
  });
}

function toStartTime(event: ApiTennisEvent) {
  const date = event.event_date ?? normalizeDateParam();
  const rawTime = event.event_time?.slice(0, 5) ?? "12:00";
  return new Date(`${date}T${rawTime}:00`).toISOString();
}

function mapStatus(event: ApiTennisEvent) {
  const status = (event.event_status ?? "").toLowerCase();
  if (status.includes("finish")) return "finished" as const;
  if (status.includes("retired") || status.includes("walkover")) return "finished" as const;
  if (status.includes("postpon")) return "postponed" as const;
  if (status.includes("cancel")) return "cancelled" as const;
  if (event.event_live === "1") return "live" as const;
  if (event.event_winner && event.event_final_result?.match(/\d+\s*-\s*\d+/)) return "finished" as const;
  return "scheduled" as const;
}

function mapEvent(event: ApiTennisEvent): SportEvent {
  const status = mapStatus(event);
  const minute = status === "live" ? event.event_status || event.event_game_result : undefined;
  const firstPlayer = event.event_first_player?.trim() || "Giocatore 1";
  const secondPlayer = event.event_second_player?.trim() || "Giocatore 2";
  const tennisScore = normalizeTennisScore(event);
  const classification = classifyTennisMatch({
    sport: "tennis",
    competition: event.tournament_name ?? event.event_type_type ?? "Tennis",
    category: event.event_type_type,
    eventTypeType: event.event_type_type,
    eventTypeKey: event.event_type_key,
    homeName: firstPlayer,
    awayName: secondPlayer,
    venue: event.tournament_round,
    tournament_name: event.tournament_name,
    event_type_type: event.event_type_type,
    event_first_player: firstPlayer,
    event_second_player: secondPlayer
  });
  const gender = classification.gender === "unknown" ? undefined : classification.gender;

  return {
    id: `api-tennis-${event.event_key}`,
    sport: "tennis",
    competitionId: event.tournament_key,
    competition: event.tournament_name ?? event.event_type_type ?? "Tennis",
    category: classification.displayCategory,
    gender,
    discipline: classification.discipline,
    tourLevel: classification.tourLevel,
    eventTypeType: event.event_type_type,
    eventTypeKey: event.event_type_key,
    firstPlayerKey: event.first_player_key,
    secondPlayerKey: event.second_player_key,
    firstPlayerImage: event.event_first_player_logo ?? undefined,
    secondPlayerImage: event.event_second_player_logo ?? undefined,
    firstPlayerImageSource: event.first_player_image_source ?? (event.event_first_player_logo ? "fixture" : "fallback"),
    secondPlayerImageSource: event.second_player_image_source ?? (event.event_second_player_logo ? "fixture" : "fallback"),
    firstPlayerCountry: event.first_player_country,
    secondPlayerCountry: event.second_player_country,
    firstPlayerRanking: event.first_player_ranking,
    secondPlayerRanking: event.second_player_ranking,
    homeName: firstPlayer,
    awayName: secondPlayer,
    homeLogo: event.event_first_player_logo ?? undefined,
    awayLogo: event.event_second_player_logo ?? undefined,
    homeScore: tennisScore.totalSetsHome ?? undefined,
    awayScore: tennisScore.totalSetsAway ?? undefined,
    status,
    statusLabel: tennisScore.statusLabel || (status === "live" ? getStatusLabel(status, minute) : event.event_status || getStatusLabel(status)),
    minute: status === "live" ? tennisScore.statusLabel : minute,
    startTime: toStartTime(event),
    isLive: status === "live",
    venue: event.tournament_round,
    tennisScore,
    importanceScore: getTennisImportanceBase(classification),
    provider: "api-tennis"
  };
}

function mapTimeline(event: ApiTennisEvent): MatchTimelineItem[] {
  return (event.pointbypoint ?? []).slice(0, 30).map((item) => ({
    minute: item.set_number,
    type: "game",
    team: item.serve_winner,
    player: item.player_served,
    description: [
      item.number_game ? `Game ${item.number_game}` : undefined,
      item.score ? `punteggio ${item.score}` : undefined,
      item.serve_lost ? "break concesso" : undefined
    ].filter(Boolean).join(" - ") || "Aggiornamento game"
  }));
}

function valueFromRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") return value;
  }
  return undefined;
}

function mapTennisStats(event: ApiTennisEvent) {
  if (event.statistics?.length && event.first_player_key && event.second_player_key) {
    const homeKey = String(event.first_player_key);
    const awayKey = String(event.second_player_key);
    const labels = [
      { api: "Aces", label: "Ace" },
      { api: "Double Faults", label: "Doppi falli" },
      { api: "1st serve percentage", label: "Prime di servizio" },
      { api: "1st serve points won", label: "Punti vinti con la prima" },
      { api: "2nd serve points won", label: "Punti vinti con la seconda" },
      { api: "Break Points Saved", label: "Break point salvati" },
      { api: "1st return points won", label: "Punti vinti in risposta sulla prima" },
      { api: "2nd return points won", label: "Punti vinti in risposta sulla seconda" },
      { api: "Service games won", label: "Turni di servizio vinti" },
      { api: "Return games won", label: "Turni in risposta vinti" }
    ];

    return labels
      .map((item) => {
        const home = event.statistics?.find((stat) => String(stat.player_key) === homeKey && stat.stat_name === item.api);
        const away = event.statistics?.find((stat) => String(stat.player_key) === awayKey && stat.stat_name === item.api);

        return {
          label: item.label,
          homeValue: home?.stat_value ?? undefined,
          awayValue: away?.stat_value ?? undefined
        };
      })
      .filter((item): item is { label: string; homeValue: string | number; awayValue: string | number } => {
        return item.homeValue !== undefined && item.awayValue !== undefined;
      });
  }

  const record = event as Record<string, unknown>;
  const statPairs = [
    {
      label: "Ace",
      home: ["event_first_player_aces", "first_player_aces", "player1_aces", "home_aces"],
      away: ["event_second_player_aces", "second_player_aces", "player2_aces", "away_aces"]
    },
    {
      label: "Doppi falli",
      home: ["event_first_player_double_faults", "first_player_double_faults", "player1_double_faults", "home_double_faults"],
      away: ["event_second_player_double_faults", "second_player_double_faults", "player2_double_faults", "away_double_faults"]
    },
    {
      label: "Prime di servizio",
      home: ["event_first_player_first_serve", "first_player_first_serve", "player1_first_serve", "home_first_serve"],
      away: ["event_second_player_first_serve", "second_player_first_serve", "player2_first_serve", "away_first_serve"]
    },
    {
      label: "Punti al servizio",
      home: ["event_first_player_service_points", "first_player_service_points", "player1_service_points", "home_service_points"],
      away: ["event_second_player_service_points", "second_player_service_points", "player2_service_points", "away_service_points"]
    },
    {
      label: "Break point",
      home: ["event_first_player_break_points", "first_player_break_points", "player1_break_points", "home_break_points"],
      away: ["event_second_player_break_points", "second_player_break_points", "player2_break_points", "away_break_points"]
    }
  ];

  return statPairs
    .map((item) => ({
      label: item.label,
      homeValue: valueFromRecord(record, item.home),
      awayValue: valueFromRecord(record, item.away)
    }))
    .filter((item): item is { label: string; homeValue: string | number; awayValue: string | number } => {
      return item.homeValue !== undefined && item.awayValue !== undefined;
    });
}

function summarizeH2H(items: ApiTennisEvent[], firstPlayer: string, secondPlayer: string): PreMatchInsight[] {
  if (!items.length) return [];

  let firstWins = 0;
  let secondWins = 0;
  for (const item of items) {
    const winner = item.event_winner?.toLowerCase();
    if (winner?.includes("first")) firstWins += 1;
    if (winner?.includes("second")) secondWins += 1;
  }

  return [
    {
      label: "Head to head",
      value: `${firstPlayer} ${firstWins} - ${secondWins} ${secondPlayer}`,
      detail: `${items.length} confronti disponibili`
    },
    ...items.slice(0, 4).map((item) => ({
      label: item.tournament_name ?? "Confronto",
      value: `${item.event_first_player ?? firstPlayer} ${item.event_final_result ?? "-"} ${item.event_second_player ?? secondPlayer}`,
      detail: [item.event_date, item.tournament_round].filter(Boolean).join(" · ")
    }))
  ];
}

async function getTennisH2H(event: ApiTennisEvent) {
  if (!event.first_player_key || !event.second_player_key) return [];

  const data = await tennisRequest(
    {
      method: "get_H2H",
      first_player_key: String(event.first_player_key),
      second_player_key: String(event.second_player_key)
    },
    `api-tennis-h2h-${event.first_player_key}-${event.second_player_key}`,
    600
  );

  if (data.success !== 1) return [];
  return asArray(data.result);
}

export async function getApiTennisEvents(query: ScoreQuery = {}) {
  if (query.sport && query.sport !== "all" && query.sport !== "tennis") return [];

  const method = query.status === "live" ? "get_livescore" : "get_fixtures";
  const date = normalizeDateParam(query.date);
  const data = await tennisRequest(
    {
      method,
      date_start: method === "get_fixtures" ? date : undefined,
      date_stop: method === "get_fixtures" ? date : undefined
    },
    `api-tennis-${method}-${date}`,
    method === "get_livescore" ? LIVE_CACHE_MS / 1000 : EVENTS_CACHE_MS / 1000
  );

  if (data.success !== 1) throw new Error(data.error ?? "API Tennis returned an error");

  const rawEvents = asArray(data.result)
    .filter((event) => event.event_key && event.event_first_player && event.event_second_player);
  const events = (await enrichEventsWithPlayers(rawEvents))
    .map(mapEvent)
    .map((event) => normalizeSportEventStatus(event, date))
    .sort(compareTennisEvents);
  if (query.status && query.status !== "all") {
    return events.filter((event) => event.status === query.status);
  }

  return events;
}

export async function getApiTennisMatchDetail(id: string): Promise<MatchDetail | null> {
  const matchKey = id.replace("api-tennis-", "");
  const [fixtureResult, livescoreResult] = await Promise.allSettled([
    tennisRequest(
      { method: "get_fixtures", match_key: matchKey },
      `api-tennis-match-${matchKey}`,
      60
    ),
    tennisRequest(
      { method: "get_livescore" },
      `api-tennis-live-detail-${matchKey}`,
      LIVE_CACHE_MS / 1000
    )
  ]);

  if (fixtureResult.status === "rejected") throw fixtureResult.reason;
  const data = fixtureResult.value;

  if (data.success !== 1) throw new Error(data.error ?? "API Tennis returned an error");
  const fixtureEvent = asArray(data.result).find((item) => String(item.event_key) === matchKey) ?? asArray(data.result)[0];
  if (!fixtureEvent) return null;

  const liveEvent =
    livescoreResult.status === "fulfilled" && livescoreResult.value.success === 1
      ? asArray(livescoreResult.value.result).find((item) => String(item.event_key) === matchKey)
      : undefined;
  const [event] = await enrichEventsWithPlayers([liveEvent ? { ...fixtureEvent, ...liveEvent } : fixtureEvent]);

  const h2hData = await Promise.allSettled([getTennisH2H(event)]);
  const h2h = h2hData[0].status === "fulfilled" ? h2hData[0].value : [];

  return {
    ...mapEvent(event),
    timeline: mapTimeline(event),
    stats: mapTennisStats(event),
    preMatchInsights: summarizeH2H(
      h2h,
      event.event_first_player ?? "Giocatore 1",
      event.event_second_player ?? "Giocatore 2"
    ),
    relatedNews: []
  };
}

export const apiTennisProvider = {
  name: "api-tennis" as const,
  getEvents: getApiTennisEvents,
  getMatchDetail: getApiTennisMatchDetail
};
