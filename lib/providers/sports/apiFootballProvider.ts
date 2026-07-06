import type { MatchDetail, MatchStat, MatchTimelineItem, PreMatchInsight, ScoreQuery, Scorer, SportEvent } from "@/lib/types";
import { fetchJson } from "@/lib/utils/fetcher";
import { normalizeDateParam } from "@/lib/utils/date";
import { getStatusLabel, normalizeApiFootballStatus } from "@/lib/utils/status";
import { normalizeSearchText } from "@/lib/utils/search";
import { normalizeSportEventStatus } from "@/lib/utils/normalizeEventStatus";

const DEFAULT_API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
const LIVE_CACHE_MS = 2 * 60 * 1000;
const FIXTURES_CACHE_MS = 10 * 60 * 1000;
const MATCH_CACHE_MS = 5 * 60 * 1000;
const STATS_CACHE_MS = 10 * 60 * 1000;

type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    status: {
      long?: string;
      short?: string;
      elapsed?: number | null;
    };
    venue?: {
      name?: string;
    };
  };
  league: {
    id?: number;
    name: string;
    country?: string;
    logo?: string;
    flag?: string;
    round?: string;
  };
  teams: {
    home: { id: number; name: string; logo?: string };
    away: { id: number; name: string; logo?: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

type ApiFootballResponse<T> = {
  response: T[];
  errors?: unknown;
};

type ApiFootballStatusResponse = {
  response?: {
    requests?: {
      current?: number;
      limit_day?: number;
    };
    subscription?: {
      plan?: string;
      end?: string;
      active?: boolean;
    };
  };
  errors?: unknown;
};

type ApiFootballEvent = {
  time?: { elapsed?: number | null; extra?: number | null };
  team?: { name?: string };
  player?: { name?: string };
  type?: string;
  detail?: string;
  comments?: string | null;
};

type ApiFootballStats = {
  team?: { id?: number; name?: string };
  statistics?: Array<{ type: string; value: number | string | null }>;
};

function getApiFootballKey() {
  return process.env.API_SPORTS_KEY;
}

function getApiFootballBaseUrl() {
  return process.env.API_FOOTBALL_BASE_URL || DEFAULT_API_FOOTBALL_BASE_URL;
}

function apiFootballHeaders(): HeadersInit {
  const key = getApiFootballKey();
  if (!key) throw new Error("Missing API_SPORTS_KEY");
  return { "x-apisports-key": key };
}

function hasErrors(errors: unknown) {
  if (!errors) return false;
  if (Array.isArray(errors)) return errors.length > 0;
  if (typeof errors === "object") return Object.keys(errors).length > 0;
  return true;
}

function describeApiErrors(errors: unknown) {
  if (!hasErrors(errors)) return undefined;
  if (typeof errors === "string") return errors;
  if (Array.isArray(errors)) return errors.join(", ");
  if (typeof errors === "object" && errors !== null) {
    return Object.values(errors)
      .map((value) => (typeof value === "string" ? value : JSON.stringify(value)))
      .join(", ");
  }
  return "API-FOOTBALL error";
}

function assertApiFootballResponse<T extends { errors?: unknown }>(data: T) {
  if (hasErrors(data.errors)) {
    throw new Error(describeApiErrors(data.errors));
  }
  return data;
}

function apiFootballUrl(path: string, params?: URLSearchParams) {
  const query = params?.toString();
  return `${getApiFootballBaseUrl()}${path}${query ? `?${query}` : ""}`;
}

function inferGender(value: string) {
  const normalized = value.toLowerCase();
  if (/\b(women|women's|femminile|female)\b/.test(normalized)) return "women" as const;
  if (/\b(men|maschile|male)\b/.test(normalized)) return "men" as const;
  return undefined;
}

function mapFixtureToEvent(item: ApiFootballFixture): SportEvent {
  const status = normalizeApiFootballStatus(item.fixture.status.short);
  const minute = item.fixture.status.elapsed ?? undefined;
  const category = item.league.round;
  const gender = inferGender(`${item.league.name} ${category ?? ""}`);

  return {
    id: `api-football-${item.fixture.id}`,
    sport: "football",
    competition: item.league.name,
    competitionId: item.league.id,
    country: item.league.country,
    countryFlag: item.league.flag,
    leagueLogo: item.league.logo,
    homeName: item.teams.home.name,
    awayName: item.teams.away.name,
    homeLogo: item.teams.home.logo,
    awayLogo: item.teams.away.logo,
    homeScore: item.goals.home ?? undefined,
    awayScore: item.goals.away ?? undefined,
    status,
    statusLabel: status === "live" ? getStatusLabel(status, minute) : item.fixture.status.long ?? getStatusLabel(status),
    minute,
    startTime: item.fixture.date,
    isLive: status === "live",
    venue: item.fixture.venue?.name,
    category,
    gender,
    provider: "api-football"
  };
}

function parseFixtureId(id: string) {
  return id.replace("api-football-", "");
}

function isGoalEvent(event: ApiFootballEvent) {
  if (normalizeSearchText(event.type) !== "goal") return false;
  const detail = normalizeSearchText(event.detail);
  if (detail.includes("missed")) return false;
  if (!detail) return true;
  return ["normal goal", "penalty", "own goal"].some((value) => detail.includes(value));
}

function eventMinute(event: ApiFootballEvent) {
  const elapsed = event.time?.elapsed;
  const extra = event.time?.extra;
  if (elapsed === null || elapsed === undefined) return "";
  return extra ? `${elapsed}+${extra}` : elapsed;
}

function mapGoalScorers(events: ApiFootballEvent[], fixture: ApiFootballFixture): SportEvent["scorers"] {
  const homeName = fixture.teams.home.name;
  const awayName = fixture.teams.away.name;
  const home: Scorer[] = [];
  const away: Scorer[] = [];

  for (const event of events.filter(isGoalEvent)) {
    const scorer: Scorer = {
      playerName: event.player?.name ?? "Marcatore",
      minute: eventMinute(event),
      teamName: event.team?.name ?? "",
      detail: event.detail,
      isOwnGoal: normalizeSearchText(event.detail).includes("own goal"),
      isPenalty: normalizeSearchText(event.detail).includes("penalty")
    };
    const eventTeam = normalizeSearchText(event.team?.name);

    if (eventTeam === normalizeSearchText(homeName)) {
      home.push({ ...scorer, teamName: homeName });
    } else if (eventTeam === normalizeSearchText(awayName)) {
      away.push({ ...scorer, teamName: awayName });
    }
  }

  return home.length || away.length ? { home, away } : undefined;
}

export async function getApiFootballStatus() {
  const data = await fetchJson<ApiFootballStatusResponse>(apiFootballUrl("/status"), {
    headers: apiFootballHeaders(),
    revalidate: 300,
    cacheTtlMs: 5 * 60 * 1000,
    cacheKey: "api-football-status"
  });

  return assertApiFootballResponse(data).response ?? {};
}

export async function getFootballFixturesByDate(date: string) {
  const params = new URLSearchParams();
  params.set("date", normalizeDateParam(date));

  const data = await fetchJson<ApiFootballResponse<ApiFootballFixture>>(
    apiFootballUrl("/fixtures", params),
    {
      headers: apiFootballHeaders(),
      revalidate: 600,
      cacheTtlMs: FIXTURES_CACHE_MS,
      cacheKey: `api-football-fixtures-${params.toString()}`
    }
  );

  return assertApiFootballResponse(data).response;
}

export async function getLiveFootballFixtures() {
  const params = new URLSearchParams({ live: "all" });
  const data = await fetchJson<ApiFootballResponse<ApiFootballFixture>>(
    apiFootballUrl("/fixtures", params),
    {
      headers: apiFootballHeaders(),
      revalidate: 120,
      cacheTtlMs: LIVE_CACHE_MS,
      cacheKey: "api-football-live-fixtures"
    }
  );

  return assertApiFootballResponse(data).response;
}

export async function getFootballMatchById(id: string) {
  const fixtureId = parseFixtureId(id);
  const params = new URLSearchParams({ id: fixtureId });
  const data = await fetchJson<ApiFootballResponse<ApiFootballFixture>>(
    apiFootballUrl("/fixtures", params),
    {
      headers: apiFootballHeaders(),
      revalidate: 300,
      cacheTtlMs: MATCH_CACHE_MS,
      cacheKey: `api-football-fixture-${fixtureId}`
    }
  );

  return assertApiFootballResponse(data).response[0] ?? null;
}

export async function getFootballMatchEvents(id: string) {
  const fixtureId = parseFixtureId(id);
  const params = new URLSearchParams({ fixture: fixtureId });
  const data = await fetchJson<ApiFootballResponse<ApiFootballEvent>>(
    apiFootballUrl("/fixtures/events", params),
    {
      headers: apiFootballHeaders(),
      revalidate: 300,
      cacheTtlMs: MATCH_CACHE_MS,
      cacheKey: `api-football-events-${fixtureId}`
    }
  );

  return assertApiFootballResponse(data).response;
}

export async function getFootballMatchStatistics(id: string) {
  const fixtureId = parseFixtureId(id);
  const params = new URLSearchParams({ fixture: fixtureId });
  const data = await fetchJson<ApiFootballResponse<ApiFootballStats>>(
    apiFootballUrl("/fixtures/statistics", params),
    {
      headers: apiFootballHeaders(),
      revalidate: 600,
      cacheTtlMs: STATS_CACHE_MS,
      cacheKey: `api-football-stats-${fixtureId}`
    }
  );

  return assertApiFootballResponse(data).response;
}

export async function getFootballHeadToHead(homeId: number, awayId: number) {
  const params = new URLSearchParams({ h2h: `${homeId}-${awayId}` });
  const data = await fetchJson<ApiFootballResponse<ApiFootballFixture>>(
    apiFootballUrl("/fixtures/headtohead", params),
    {
      headers: apiFootballHeaders(),
      revalidate: 600,
      cacheTtlMs: STATS_CACHE_MS,
      cacheKey: `api-football-h2h-${homeId}-${awayId}`
    }
  );

  return assertApiFootballResponse(data).response;
}

function mapHeadToHead(items: ApiFootballFixture[], currentFixtureId: number): PreMatchInsight[] {
  return items
    .filter((item) => item.fixture.id !== currentFixtureId)
    .slice(0, 5)
    .map((item) => ({
      label: item.league.name,
      value: `${item.teams.home.name} ${item.goals.home ?? "-"}-${item.goals.away ?? "-"} ${item.teams.away.name}`,
      detail: item.fixture.date.slice(0, 10)
    }));
}

export async function getApiFootballEvents(query: ScoreQuery = {}) {
  if (query.sport && query.sport !== "all" && query.sport !== "football") return [];

  const fixtures =
    query.status === "live"
      ? await getLiveFootballFixtures()
      : await getFootballFixturesByDate(query.date ?? "today");

  const events = fixtures.map(mapFixtureToEvent).map((event) => normalizeSportEventStatus(event, query.date));
  if (query.status && query.status !== "all") {
    return events.filter((event) => event.status === query.status);
  }

  return events;
}

export async function getApiFootballMatchDetail(id: string): Promise<MatchDetail | null> {
  const fixture = await getFootballMatchById(id);
  if (!fixture) return null;

  const [timelineData, statsData, h2hData] = await Promise.allSettled([
    getFootballMatchEvents(id),
    getFootballMatchStatistics(id),
    getFootballHeadToHead(fixture.teams.home.id, fixture.teams.away.id)
  ]);

  const matchEvents = timelineData.status === "fulfilled" ? timelineData.value : [];

  const timeline: MatchTimelineItem[] =
    matchEvents.length
      ? matchEvents.map((event) => ({
          minute: event.time?.elapsed ?? undefined,
          type: event.type ?? "event",
          team: event.team?.name,
          player: event.player?.name,
          description: [event.detail, event.comments].filter(Boolean).join(" - ") || event.type || "Evento partita"
        }))
      : [];

  const stats: MatchStat[] = [];
  if (statsData.status === "fulfilled" && statsData.value.length >= 2) {
    const [homeStats, awayStats] = statsData.value;
    const awayByLabel = new Map(
      (awayStats.statistics ?? []).map((item) => [item.type, item.value ?? "-"])
    );

    for (const stat of homeStats.statistics ?? []) {
      stats.push({
        label: stat.type,
        homeValue: stat.value ?? "-",
        awayValue: awayByLabel.get(stat.type) ?? "-"
      });
    }
  }

  return {
    ...normalizeSportEventStatus(mapFixtureToEvent(fixture)),
    scorers: mapGoalScorers(matchEvents, fixture),
    timeline,
    stats,
    preMatchInsights: h2hData.status === "fulfilled" ? mapHeadToHead(h2hData.value, fixture.fixture.id) : [],
    relatedNews: []
  };
}

export const apiFootballProvider = {
  name: "api-football" as const,
  getStatus: getApiFootballStatus,
  getEvents: getApiFootballEvents,
  getMatchDetail: getApiFootballMatchDetail
};
