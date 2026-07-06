import type { SportEvent } from "@/lib/types";
import { COMPETITION_PRIORITY, FEATURED_MIN_SCORE } from "@/lib/config/competitionPriority";
import { compareTennisEvents, getTennisImportanceBase } from "@/lib/utils/tennisClassification";

function normalize(value?: string | number) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function searchableValue(event: SportEvent) {
  return normalize(
    [
      event.competition,
      event.country,
      event.category,
      event.homeName,
      event.awayName,
      event.venue
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function isCountry(event: SportEvent, values: string[]) {
  const country = normalize(event.country);
  return values.some((value) => country === normalize(value));
}

function getDomesticLeaguePenalty(event: SportEvent) {
  const competition = normalize(event.competition);

  if (competition.includes("premier league") && !isCountry(event, ["England", "Inghilterra"])) return 28;
  if (competition.includes("serie a") && event.sport === "football" && !isCountry(event, ["Italy", "Italia"])) return 28;
  if (competition.includes("serie b") && event.sport === "football" && !isCountry(event, ["Italy", "Italia"])) return 24;
  if ((competition.includes("la liga") || competition.includes("laliga")) && !isCountry(event, ["Spain", "Spagna"])) return 28;
  if (competition.includes("bundesliga") && !isCountry(event, ["Germany", "Germania"])) return 28;
  if (competition.includes("ligue 1") && !isCountry(event, ["France", "Francia"])) return 28;

  return undefined;
}

export function getCompetitionPriority(event: SportEvent) {
  if (event.sport === "tennis") return Math.max(20, Math.floor(getTennisImportanceBase(event) / 10));

  const domesticPenalty = getDomesticLeaguePenalty(event);
  if (domesticPenalty !== undefined) return domesticPenalty;

  const value = searchableValue(event);
  const rule = COMPETITION_PRIORITY.find((item) =>
    item.match.some((pattern) => value.includes(normalize(pattern)))
  );

  return rule?.score ?? 20;
}

export function getMatchStatusPriority(event: SportEvent) {
  if (event.status === "live") return 30;
  if (event.status === "finished") return -20;
  if (event.status === "postponed" || event.status === "cancelled") return -50;
  return 0;
}

export function getTimePriority(event: SportEvent, now = new Date()) {
  if (event.status !== "scheduled") return 0;

  const startTime = new Date(event.startTime).getTime();
  if (Number.isNaN(startTime)) return 0;

  const diffHours = (startTime - now.getTime()) / (1000 * 60 * 60);
  if (diffHours < 0) return 0;
  if (diffHours <= 1) return 20;
  if (diffHours <= 3) return 15;
  if (diffHours <= 6) return 8;
  return 0;
}

export function getStagePriority(event: SportEvent) {
  const value = searchableValue(event);

  if (/\b(final|finale|grand final)\b/.test(value)) return 24;
  if (/\b(semi|semifinal|semifinale)\b/.test(value)) return 20;
  if (/\b(quarter|quarti|last 16|round of 16|ottavi)\b/.test(value)) return 16;
  if (/\b(playoff|play-off|knockout|eliminazione diretta)\b/.test(value)) return 14;
  if (/\b(group stage|girone)\b/.test(value)) return 4;
  return 0;
}

export function getMatchImportanceScore(event: SportEvent, now = new Date()) {
  return (
    getCompetitionPriority(event) +
    getMatchStatusPriority(event) +
    getTimePriority(event, now) +
    getStagePriority(event)
  );
}

export function isFeaturedMatch(event: SportEvent, now = new Date()) {
  const score = getMatchImportanceScore(event, now);
  return score >= FEATURED_MIN_SCORE || (event.isLive && score >= 55);
}

export function compareMatches(a: SportEvent, b: SportEvent, now = new Date()) {
  const scoreDiff = getMatchImportanceScore(b, now) - getMatchImportanceScore(a, now);
  if (scoreDiff !== 0) return scoreDiff;
  if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;

  const statusOrder = { live: 0, scheduled: 1, finished: 2, postponed: 3, cancelled: 4 };
  const statusDiff = statusOrder[a.status] - statusOrder[b.status];
  if (statusDiff !== 0) return statusDiff;

  return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
}

export function sortMatchesByImportance(events: SportEvent[], now = new Date()) {
  return [...events].sort((a, b) => compareMatches(a, b, now));
}

export function sortMatchesInCompetition(events: SportEvent[]) {
  return [...events].sort((a, b) => {
    if (a.sport === "tennis" && b.sport === "tennis") {
      const tennisDiff = compareTennisEvents(a, b);
      if (tennisDiff !== 0) return tennisDiff;
    }

    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;

    const statusOrder = { live: 0, scheduled: 1, finished: 2, postponed: 3, cancelled: 4 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    const timeDiff = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    if (timeDiff !== 0) return timeDiff;

    return getMatchImportanceScore(b) - getMatchImportanceScore(a);
  });
}

export function sortMatchesWithinCompetition(events: SportEvent[]) {
  return sortMatchesInCompetition(events);
}
