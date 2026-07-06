import type { Sport, SportEvent } from "@/lib/types";
import { classifyTennisMatch } from "@/lib/utils/tennisClassification";
import { getMatchImportanceScore } from "@/lib/utils/matchPriority";

function timeValue(event: SportEvent) {
  const value = new Date(event.startTime).getTime();
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
}

function sessionPriority(event: SportEvent) {
  const value = `${event.sessionType ?? ""} ${event.category ?? ""}`.toLowerCase();
  if (/\b(race|gara)\b/.test(value)) return 0;
  if (/\b(qualifying|qualifiche)\b/.test(value)) return 1;
  if (/\bsprint\b/.test(value)) return 2;
  if (/\b(practice|prove|fp\d)\b/.test(value)) return 3;
  return 4;
}

function compareChronological(a: SportEvent, b: SportEvent) {
  const diff = timeValue(a) - timeValue(b);
  if (diff !== 0) return diff;
  return getMatchImportanceScore(b) - getMatchImportanceScore(a);
}

function compareTennisForSportPage(a: SportEvent, b: SportEvent) {
  const classificationDiff = classifyTennisMatch(a).sortPriority - classifyTennisMatch(b).sortPriority;
  if (classificationDiff !== 0) {
    const aTime = timeValue(a);
    const bTime = timeValue(b);
    const sameCategory =
      a.tourLevel === b.tourLevel &&
      a.discipline === b.discipline &&
      a.gender === b.gender &&
      a.category === b.category;
    if (!sameCategory) return classificationDiff;
    return aTime - bTime;
  }
  return compareChronological(a, b);
}

export function sortEventsForSportPage(events: SportEvent[], sport?: Sport) {
  return [...events].sort((a, b) => {
    const effectiveSport = sport ?? a.sport;

    if (effectiveSport === "tennis") return compareTennisForSportPage(a, b);
    if (effectiveSport === "formula1") {
      const timeDiff = timeValue(a) - timeValue(b);
      if (timeDiff !== 0) return timeDiff;
      return sessionPriority(a) - sessionPriority(b);
    }

    return compareChronological(a, b);
  });
}

export function sortEventsWithinSportCompetition(events: SportEvent[]) {
  const sport = events[0]?.sport;
  return sortEventsForSportPage(events, sport);
}
