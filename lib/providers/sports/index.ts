import type { MatchDetail, ScoreQuery, Sport, SportEvent, SportsProviderName } from "@/lib/types";
import { logProviderFallback } from "@/lib/utils/fetcher";
import { basketballProvider } from "@/lib/providers/sports/basketballProvider";
import { footballProvider } from "@/lib/providers/sports/footballProvider";
import { formula1Provider } from "@/lib/providers/sports/formula1Provider";
import { mockSportsProvider } from "@/lib/providers/sports/mockSportsProvider";
import { tennisProvider } from "@/lib/providers/sports/tennisProvider";
import { theSportsDbProvider } from "@/lib/providers/sports/theSportsDbProvider";
import { trendingProvider } from "@/lib/providers/sports/trendingProvider";
import { selectTrendingEvents } from "@/lib/utils/eventImportance";

export function getActiveSportsProviderName(): SportsProviderName {
  const value = process.env.SPORTS_PROVIDER;
  if (
    value === "auto" ||
    value === "api-sports" ||
    value === "api-football" ||
    value === "api-tennis" ||
    value === "api-basketball" ||
    value === "api-formula1" ||
    value === "thesportsdb" ||
    value === "mock"
  ) {
    return value;
  }
  return "auto";
}

export function hasSportsProviderKey(provider = getActiveSportsProviderName()) {
  if (provider === "auto") {
    return true;
  }
  if (provider === "api-sports") return Boolean(process.env.API_SPORTS_KEY || process.env.API_TENNIS_KEY);
  if (provider === "api-football") return Boolean(process.env.API_SPORTS_KEY);
  if (provider === "api-tennis") return Boolean(process.env.API_TENNIS_KEY);
  if (provider === "api-basketball") return Boolean(process.env.API_SPORTS_KEY);
  if (provider === "api-formula1") return Boolean(process.env.API_SPORTS_KEY);
  if (provider === "thesportsdb") return true;
  return true;
}

function wantsSport(query: ScoreQuery, sport: Sport) {
  return !query.sport || query.sport === "all" || query.sport === sport || (sport === "formula1" && query.sport === "motors");
}

function getExplicitSport(sport?: ScoreQuery["sport"]): Sport | undefined {
  if (sport === "motors") return "formula1";
  if (sport === "football" || sport === "tennis" || sport === "basketball" || sport === "formula1") return sport;
  return undefined;
}

function isSportEnabled(sport: Sport) {
  if (sport === "football") return process.env.ENABLE_FOOTBALL !== "false";
  if (sport === "tennis") return process.env.ENABLE_TENNIS !== "false";
  if (sport === "basketball") return process.env.ENABLE_BASKETBALL !== "false";
  if (sport === "formula1") return process.env.ENABLE_FORMULA1 !== "false";
  return true;
}

function dedupeEvents(events: SportEvent[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.provider}-${event.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getSportSpecificScores(query: ScoreQuery = {}, sport: Sport) {
  if (!isSportEnabled(sport)) return [];

  if (sport === "football") {
    if (!process.env.API_SPORTS_KEY) throw new Error("Missing API_SPORTS_KEY");
    return footballProvider.getEvents({ ...query, sport: "football" });
  }

  if (sport === "tennis") {
    if (!process.env.API_TENNIS_KEY) throw new Error("Missing API_TENNIS_KEY");
    return tennisProvider.getEvents({ ...query, sport: "tennis" });
  }

  if (sport === "basketball") {
    if (!process.env.API_SPORTS_KEY) throw new Error("Missing API_SPORTS_KEY");
    return basketballProvider.getEvents({ ...query, sport: "basketball" });
  }

  if (sport === "formula1") {
    if (!process.env.API_SPORTS_KEY) throw new Error("Missing API_SPORTS_KEY");
    return formula1Provider.getEvents({ ...query, sport: "formula1" });
  }

  return [];
}

async function getAutoScores(query: ScoreQuery = {}) {
  const requests: Array<Promise<SportEvent[]>> = [];

  if (wantsSport(query, "football") && process.env.API_SPORTS_KEY) {
    requests.push(footballProvider.getEvents({ ...query, sport: "football" }));
  }

  if (wantsSport(query, "tennis") && process.env.API_TENNIS_KEY) {
    requests.push(tennisProvider.getEvents({ ...query, sport: "tennis" }));
  }

  if (wantsSport(query, "basketball") && process.env.API_SPORTS_KEY) {
    requests.push(basketballProvider.getEvents({ ...query, sport: "basketball" }));
  }

  if (wantsSport(query, "formula1") && process.env.API_SPORTS_KEY) {
    requests.push(formula1Provider.getEvents({ ...query, sport: "formula1" }));
  }

  if (!requests.length) {
    requests.push(theSportsDbProvider.getEvents(query));
  }

  const settled = await Promise.allSettled(requests);
  const hasFulfilledProvider = settled.some((result) => result.status === "fulfilled");
  const events = settled.flatMap((result) => {
    if (result.status === "fulfilled") return result.value;
    logProviderFallback("auto sports", result.reason);
    return [];
  });

  if (!events.length) {
    if (hasFulfilledProvider || query.status === "live") return [];
    return mockSportsProvider.getEvents(query);
  }

  return dedupeEvents(events).sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
}

async function getApiSportsScores(query: ScoreQuery = {}) {
  if (!query.sport || query.sport === "all" || query.sport === "trending") {
    return trendingProvider.getEvents({ ...query, sport: "trending" });
  }

  const sport = getExplicitSport(query.sport);
  if (sport) return getSportSpecificScores(query, sport);

  return [];
}

export async function getScores(query: ScoreQuery = {}) {
  const provider = getActiveSportsProviderName();
  const explicitSport = getExplicitSport(query.sport);

  if (query.sport === "trending") {
    if (provider === "mock") return selectMockFallback(query);

    try {
      return await trendingProvider.getEvents(query);
    } catch (error) {
      logProviderFallback("Trending sports", error);
      return selectMockFallback(query);
    }
  }

  if (provider === "mock") {
    return selectMockFallback(query);
  }

  if (explicitSport) {
    try {
      return await getSportSpecificScores(query, explicitSport);
    } catch (error) {
      logProviderFallback(`API ${explicitSport}`, error);
      return selectMockFallback(query);
    }
  }

  if (provider === "auto") {
    return getAutoScores(query);
  }

  if (provider === "api-sports") {
    try {
      return await getApiSportsScores(query);
    } catch (error) {
      logProviderFallback("API-Sports", error);
    }
  }

  if (provider === "api-football" && process.env.API_SPORTS_KEY) {
    try {
      const footballEvents = await footballProvider.getEvents({
        ...query,
        sport: !query.sport || query.sport === "all" ? "football" : query.sport
      });
      return footballEvents;
    } catch (error) {
      logProviderFallback("API-FOOTBALL", error);
    }
  }

  if (provider === "api-tennis" && process.env.API_TENNIS_KEY) {
    try {
      return await tennisProvider.getEvents(query);
    } catch (error) {
      logProviderFallback("API Tennis", error);
    }
  }

  if (provider === "api-basketball" && process.env.API_SPORTS_KEY) {
    try {
      return await basketballProvider.getEvents(query);
    } catch (error) {
      logProviderFallback("API Basketball", error);
    }
  }

  if (provider === "api-formula1" && process.env.API_SPORTS_KEY) {
    try {
      return await formula1Provider.getEvents(query);
    } catch (error) {
      logProviderFallback("API Formula 1", error);
    }
  }

  if (provider === "thesportsdb") {
    try {
      return await theSportsDbProvider.getEvents(query);
    } catch (error) {
      logProviderFallback("TheSportsDB", error);
    }
  }

  if (!hasSportsProviderKey(provider)) {
    logProviderFallback(provider, new Error("API key not configured"));
  }

  if (query.status === "live") return [];

  return selectMockFallback(query);
}

function selectMockFallback(query: ScoreQuery = {}) {
  if (query.sport === "trending") {
    return mockSportsProvider
      .getEvents({ ...query, sport: "all" })
      .then((events) => selectTrendingEvents(events));
  }

  return mockSportsProvider.getEvents(query.sport === "motors" ? { ...query, sport: "formula1" } : query);
}

export async function getMatchDetail(id: string): Promise<MatchDetail | null> {
  const provider = getActiveSportsProviderName();

  if (id.startsWith("api-football-") || provider === "api-football") {
    if (process.env.API_SPORTS_KEY) {
      try {
        return await footballProvider.getMatchDetail(id);
      } catch (error) {
        logProviderFallback("API-FOOTBALL match detail", error);
      }
    }
  }

  if (id.startsWith("api-tennis-") || provider === "api-tennis") {
    if (process.env.API_TENNIS_KEY) {
      try {
        return await tennisProvider.getMatchDetail(id);
      } catch (error) {
        logProviderFallback("API Tennis match detail", error);
      }
    }
  }

  if (id.startsWith("api-basketball-") || provider === "api-basketball") {
    if (process.env.API_SPORTS_KEY) {
      try {
        return await basketballProvider.getMatchDetail(id);
      } catch (error) {
        logProviderFallback("API Basketball match detail", error);
      }
    }
  }

  if (id.startsWith("api-formula1-") || provider === "api-formula1") {
    if (process.env.API_SPORTS_KEY) {
      try {
        return await formula1Provider.getMatchDetail(id);
      } catch (error) {
        logProviderFallback("API Formula 1 match detail", error);
      }
    }
  }

  if (id.startsWith("thesportsdb-") || provider === "thesportsdb") {
    try {
      return await theSportsDbProvider.getMatchDetail(id);
    } catch (error) {
      logProviderFallback("TheSportsDB match detail", error);
    }
  }

  return mockSportsProvider.getMatchDetail(id);
}
