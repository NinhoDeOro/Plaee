import type { Sport, SportEvent } from "@/lib/types";
import { getMatchImportanceScore } from "@/lib/utils/matchPriority";
import { normalizeSearchText } from "@/lib/utils/search";
import { classifyTennisMatch, getTennisImportanceBase } from "@/lib/utils/tennisClassification";

const FOOTBALL_BIG_TEAMS = [
  "inter",
  "juventus",
  "milan",
  "roma",
  "lazio",
  "napoli",
  "manchester city",
  "manchester united",
  "liverpool",
  "arsenal",
  "chelsea",
  "real madrid",
  "barcelona",
  "atletico madrid",
  "bayern",
  "borussia dortmund",
  "psg",
  "paris saint germain",
  "marseille"
];

const FOOTBALL_DERBIES = [
  ["inter", "milan"],
  ["juventus", "inter"],
  ["roma", "lazio"],
  ["manchester city", "manchester united"],
  ["manchester city", "liverpool"],
  ["real madrid", "barcelona"],
  ["bayern", "borussia dortmund"],
  ["psg", "marseille"],
  ["napoli", "juventus"]
];

const FOOTBALL_TOP_LEAGUES = [
  "premier league",
  "serie a",
  "la liga",
  "laliga",
  "bundesliga",
  "ligue 1"
];

const FOOTBALL_MAJOR_COMPETITIONS = [
  "world cup",
  "fifa world cup",
  "mondiali",
  "uefa euro",
  "europei",
  "copa america",
  "champions league",
  "europa league",
  "conference league"
];

const BASKET_TOP = ["nba", "euroleague", "eurolega", "playoff", "final"];
const BASKET_BIG_TEAMS = [
  "lakers",
  "celtics",
  "warriors",
  "knicks",
  "heat",
  "bulls",
  "real madrid",
  "panathinaikos",
  "olympiacos",
  "fenerbahce",
  "olimpia milano",
  "virtus bologna"
];

const TENNIS_TOP = [
  "grand slam",
  "wimbledon",
  "australian open",
  "roland garros",
  "french open",
  "us open",
  "atp finals",
  "wta finals",
  "atp 1000",
  "wta 1000",
  "masters",
  "atp",
  "wta",
  "final"
];
const TENNIS_TOP_PLAYERS = [
  "sinner",
  "alcaraz",
  "djokovic",
  "nadal",
  "medvedev",
  "zverev",
  "fritz",
  "de minaur",
  "shelton",
  "sabalenka",
  "swiatek",
  "gauff",
  "rybakina",
  "pegula",
  "osaka",
  "paolini"
];

const FORMULA1_TOP = [
  "race",
  "gara",
  "qualifying",
  "qualifiche",
  "sprint",
  "grand prix",
  "gran premio",
  "monaco",
  "italy",
  "italia",
  "britain",
  "gran bretagna",
  "abu dhabi"
];

export const TRENDING_SPORT_ORDER: Sport[] = ["football", "tennis", "basketball", "formula1"];

function text(event: SportEvent) {
  return normalizeSearchText(
    [
      event.sport,
      event.competition,
      event.country,
      event.category,
      event.tourLevel,
      event.discipline,
      event.eventTypeType,
      event.eventTypeKey,
      event.homeName,
      event.awayName,
      event.venue,
      event.raceName,
      event.circuit,
      event.sessionType,
      event.winner
    ].filter(Boolean).join(" ")
  );
}

function containsAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(normalizeSearchText(pattern)));
}

function hasBigMatch(value: string, pairs: string[][]) {
  return pairs.some(([a, b]) => value.includes(normalizeSearchText(a)) && value.includes(normalizeSearchText(b)));
}

function startsSoon(event: SportEvent, now = new Date()) {
  if (event.status !== "scheduled") return false;
  const start = new Date(event.startTime).getTime();
  if (Number.isNaN(start)) return false;
  const diffHours = (start - now.getTime()) / (1000 * 60 * 60);
  return diffHours >= 0 && diffHours <= 3;
}

function stageScore(value: string) {
  if (/\b(final|finale|grand final)\b/.test(value)) return 220;
  if (/\b(semi|semifinal|semifinale)\b/.test(value)) return 180;
  if (/\b(quarter|quarti|last 16|round of 16|ottavi|playoff|play-off|knockout)\b/.test(value)) return 110;
  return 0;
}

function footballCompetitionScore(value: string, event: SportEvent) {
  if (/\b(world cup|fifa world cup|mondiali)\b/.test(value)) return 1000;
  if (/\b(champions league)\b/.test(value)) return 850;
  if (/\b(uefa euro|europei|copa america)\b/.test(value)) return 800;
  if (/\b(europa league)\b/.test(value)) return 760;
  if (/\b(conference league)\b/.test(value)) return 700;
  if (containsAny(value, FOOTBALL_TOP_LEAGUES)) return 600;
  if (/\b(fa cup|coppa italia|copa del rey|dfb pokal|coupe de france)\b/.test(value)) return 450;
  if (event.country && ["England", "Italy", "Spain", "Germany", "France", "Brazil", "Argentina"].includes(event.country)) return 220;
  return containsAny(value, FOOTBALL_MAJOR_COMPETITIONS) ? 650 : 50;
}

function formula1SessionScore(value: string) {
  if (/\b(race|gara)\b/.test(value)) return 900;
  if (/\b(qualifying|qualifiche)\b/.test(value)) return 700;
  if (/\bsprint\b/.test(value)) return 650;
  if (/\b(practice|prove libere|free practice|fp1|fp2|fp3)\b/.test(value)) return 300;
  return 150;
}

function sportScore(event: SportEvent, now = new Date()) {
  const value = text(event);

  if (event.sport === "football") {
    const competitionValue = normalizeSearchText([event.competition, event.category, event.country].filter(Boolean).join(" "));
    return (
      footballCompetitionScore(competitionValue, event) +
      (containsAny(value, FOOTBALL_BIG_TEAMS) ? 80 : 0) +
      (hasBigMatch(value, FOOTBALL_DERBIES) ? 300 : 0) +
      stageScore(competitionValue) +
      (event.isLive ? 100 : 0) +
      (startsSoon(event, now) ? 80 : 0)
    );
  }

  if (event.sport === "basketball") {
    const leagueScore = value.includes("summer league")
      ? 250
      : value.includes("nba")
        ? 900
        : value.includes("euroleague") || value.includes("eurolega")
          ? 750
          : 50;

    return (
      leagueScore +
      (/\b(playoff|final|finale)\b/.test(value) ? 400 : 0) +
      (containsAny(value, BASKET_BIG_TEAMS) ? 200 : 0) +
      (containsAny(value, BASKET_TOP) ? 80 : 0) +
      (event.isLive ? 100 : 0) +
      (startsSoon(event, now) ? 80 : 0)
    );
  }

  if (event.sport === "tennis") {
    const classification = classifyTennisMatch(event);
    return (
      getTennisImportanceBase(classification) +
      (containsAny(value, TENNIS_TOP) && !classification.isJunior ? 80 : 0) +
      (containsAny(value, TENNIS_TOP_PLAYERS) && !classification.isJunior ? 250 : 0) +
      stageScore(value) +
      (event.isLive ? 100 : 0) +
      (startsSoon(event, now) ? 80 : 0)
    );
  }

  if (event.sport === "formula1") {
    return (
      formula1SessionScore(value) +
      (containsAny(value, FORMULA1_TOP) ? 200 : 0) +
      (event.isLive ? 100 : 0)
    );
  }

  return 0;
}

export function getEventImportanceScore(event: SportEvent, now = new Date()) {
  return sportScore(event, now) + Math.max(0, getMatchImportanceScore(event, now));
}

export function withImportanceScore(event: SportEvent, now = new Date()): SportEvent {
  return {
    ...event,
    importanceScore: getEventImportanceScore(event, now)
  };
}

export function selectTrendingEvents(events: SportEvent[], limit = 12, maxPerSport = 5) {
  const now = new Date();
  const buckets = new Map<Sport, SportEvent[]>();
  const primaryThreshold: Partial<Record<Sport, number>> = {
    football: 500,
    tennis: 500,
    basketball: 500,
    formula1: 500
  };
  const fallbackThreshold: Partial<Record<Sport, number>> = {
    football: 350,
    tennis: 350,
    basketball: 250,
    formula1: 300
  };

  for (const sport of TRENDING_SPORT_ORDER) {
    buckets.set(sport, []);
  }

  for (const event of events) {
    if (!TRENDING_SPORT_ORDER.includes(event.sport)) continue;
    buckets.get(event.sport)?.push(withImportanceScore(event, now));
  }

  for (const sport of TRENDING_SPORT_ORDER) {
    const items = (buckets.get(sport) ?? []).sort((a, b) => (b.importanceScore ?? 0) - (a.importanceScore ?? 0));
    const primary = items.filter((event) => (event.importanceScore ?? 0) >= (primaryThreshold[sport] ?? 500));
    const fallback = items.filter((event) => (event.importanceScore ?? 0) >= (fallbackThreshold[sport] ?? 300));
    buckets.set(sport, primary.length ? primary : fallback);
  }

  const selected: SportEvent[] = [];
  const taken = new Map<Sport, number>();
  const basePerSport = Math.max(1, Math.floor(limit / TRENDING_SPORT_ORDER.length));

  for (const sport of TRENDING_SPORT_ORDER) {
    if (selected.length >= limit) break;
    const items = (buckets.get(sport) ?? []).slice(0, basePerSport);
    selected.push(...items);
    taken.set(sport, items.length);
  }

  for (const sport of TRENDING_SPORT_ORDER) {
    if (selected.length >= limit) break;
    const current = taken.get(sport) ?? 0;
    if (current >= maxPerSport) continue;

    const extra = (buckets.get(sport) ?? []).slice(current, maxPerSport);
    for (const event of extra) {
      if (selected.length >= limit) break;
      selected.push(event);
      taken.set(sport, (taken.get(sport) ?? 0) + 1);
    }
  }

  return selected.slice(0, limit);
}
