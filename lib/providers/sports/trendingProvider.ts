import type { MatchDetail, ScoreQuery, SportEvent } from "@/lib/types";
import { basketballProvider } from "@/lib/providers/sports/basketballProvider";
import { footballProvider } from "@/lib/providers/sports/footballProvider";
import { formula1Provider } from "@/lib/providers/sports/formula1Provider";
import { mockSportsProvider } from "@/lib/providers/sports/mockSportsProvider";
import { tennisProvider } from "@/lib/providers/sports/tennisProvider";
import { logProviderFallback } from "@/lib/utils/fetcher";
import { selectTrendingEvents } from "@/lib/utils/eventImportance";
import {
  getCachedTrendingEvents,
  getTrendingCacheKey,
  getTrendingCacheTtlMs,
  setCachedTrendingEvents
} from "@/lib/utils/trendingCache";

function enabled(name: "FOOTBALL" | "BASKETBALL" | "FORMULA1" | "TENNIS") {
  return process.env[`ENABLE_${name}`] !== "false";
}

function enabledSports() {
  return [
    enabled("FOOTBALL") ? "football" : undefined,
    enabled("TENNIS") ? "tennis" : undefined,
    enabled("BASKETBALL") ? "basketball" : undefined,
    enabled("FORMULA1") ? "formula1" : undefined
  ].filter(Boolean) as string[];
}

function realRequests(query: ScoreQuery) {
  const requests: Array<Promise<SportEvent[]>> = [];

  if (enabled("FOOTBALL") && process.env.API_SPORTS_KEY) {
    requests.push(footballProvider.getEvents({ ...query, sport: "football" }));
  }

  if (enabled("BASKETBALL") && process.env.API_SPORTS_KEY) {
    requests.push(basketballProvider.getEvents({ ...query, sport: "basketball" }));
  }

  if (enabled("FORMULA1") && process.env.API_SPORTS_KEY) {
    requests.push(formula1Provider.getEvents({ ...query, sport: "formula1" }));
  }

  if (enabled("TENNIS") && process.env.API_TENNIS_KEY) {
    requests.push(tennisProvider.getEvents({ ...query, sport: "tennis" }));
  }

  return requests;
}

export async function getTrendingEvents(query: ScoreQuery = {}) {
  const cacheKey = getTrendingCacheKey({
    date: query.date,
    enabledSports: enabledSports()
  });

  if (!query.noCache) {
    const cached = getCachedTrendingEvents(cacheKey);
    if (cached) return cached;
  }

  const requests = realRequests(query);

  if (!requests.length) {
    const selected = selectTrendingEvents(await mockSportsProvider.getEvents({ ...query, sport: "all" }));
    setCachedTrendingEvents(cacheKey, selected, getTrendingCacheTtlMs(query.date));
    return selected;
  }

  const settled = await Promise.allSettled(requests);
  const fulfilled = settled.filter((result): result is PromiseFulfilledResult<SportEvent[]> => result.status === "fulfilled");
  const events = fulfilled.flatMap((result) => result.value);

  for (const result of settled) {
    if (result.status === "rejected") logProviderFallback("Trending sports", result.reason);
  }

  if (fulfilled.length) {
    const selected = selectTrendingEvents(events);
    setCachedTrendingEvents(cacheKey, selected, getTrendingCacheTtlMs(query.date));
    return selected;
  }

  throw new Error("No configured sports provider returned trending events");
}

export async function getTrendingMatchDetail(id: string): Promise<MatchDetail | null> {
  if (id.startsWith("api-football-")) return footballProvider.getMatchDetail(id);
  if (id.startsWith("api-basketball-")) return basketballProvider.getMatchDetail(id);
  if (id.startsWith("api-tennis-")) return tennisProvider.getMatchDetail(id);
  if (id.startsWith("api-formula1-")) return formula1Provider.getMatchDetail(id);
  return mockSportsProvider.getMatchDetail(id);
}

export const trendingProvider = {
  name: "api-sports" as const,
  getEvents: getTrendingEvents,
  getMatchDetail: getTrendingMatchDetail
};
