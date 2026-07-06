import type { EventStatus, Sport, SportEvent } from "@/lib/types";
import { TOP_COMPETITION_MIN_SCORE } from "@/lib/config/competitionPriority";
import {
  getCompetitionPriority,
  getMatchImportanceScore,
  isFeaturedMatch,
  sortMatchesByImportance,
  sortMatchesInCompetition
} from "@/lib/utils/matchPriority";
import { sortEventsWithinSportCompetition } from "@/lib/utils/sportPageOrdering";

export type MatchGroup = {
  key: string;
  title: string;
  country?: string;
  countryCode?: string;
  countryFlag?: string;
  leagueLogo?: string;
  sport?: Sport;
  category?: string;
  gender?: SportEvent["gender"];
  events: SportEvent[];
  priority: number;
  isInternational: boolean;
};

export type MatchSection = {
  key: string;
  title: string;
  description?: string;
  groups: MatchGroup[];
};

export function getCompetitionGroupKey(event: SportEvent) {
  const fallback = `${event.competition}-${event.country ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "-")
    .toLowerCase();
  return `${event.sport}-${event.competitionId ?? fallback}`;
}

function normalize(value?: string | number) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function inferMatchGender(event: SportEvent): SportEvent["gender"] {
  if (event.gender) return event.gender;

  const value = normalize(`${event.competition} ${event.category ?? ""}`);
  if (/\b(junior|juniors|boys|girls)\b/.test(value)) return "junior";
  if (/\b(women|women's|femminile|female|wta)\b/.test(value)) return "women";
  if (/\b(men|maschile|male|atp)\b/.test(value)) return "men";
  return undefined;
}

export function isInternationalCompetition(event: SportEvent) {
  const value = normalize(`${event.competition} ${event.country ?? ""}`);
  return (
    /\b(world|fifa|uefa|euro|copa america|champions league|europa league|conference league|nations league|international)\b/.test(value) ||
    ["world", "mondo", "europe", "europa", "international", "internazionale"].includes(normalize(event.country))
  );
}

export function getCompetitionDisplayName(event: SportEvent) {
  return event.category && !event.competition.toLowerCase().includes(event.category.toLowerCase())
    ? `${event.competition}, ${event.category}`
    : event.competition;
}

export function getCompetitionCountryLabel(event: SportEvent) {
  if (event.country) return event.country;
  return isInternationalCompetition(event) ? "Mondo" : "Internazionale";
}

export function getCompetitionFlag(event: SportEvent) {
  if (event.countryFlag) return event.countryFlag;
  if (event.countryCode) return event.countryCode;
  return isInternationalCompetition(event) ? "🌐" : undefined;
}

export function sortCompetitionGroups(groups: MatchGroup[]) {
  return [...groups].sort((a, b) => {
    const priorityDiff = b.priority - a.priority;
    if (priorityDiff !== 0) return priorityDiff;

    const liveDiff = b.events.filter((event) => event.isLive).length - a.events.filter((event) => event.isLive).length;
    if (liveDiff !== 0) return liveDiff;

    const statusRank = (group: MatchGroup) => {
      if (group.events.some((event) => event.isLive)) return 0;
      if (group.events.some((event) => event.status === "scheduled")) return 1;
      if (group.events.every((event) => event.status === "finished")) return 3;
      return 2;
    };
    const statusDiff = statusRank(a) - statusRank(b);
    if (statusDiff !== 0) return statusDiff;

    return a.title.localeCompare(b.title, "it");
  });
}

type GroupOptions = {
  sportPage?: boolean;
};

export function groupMatchesByCompetition(events: SportEvent[], options: GroupOptions = {}) {
  const groups = new Map<string, MatchGroup>();

  for (const event of events) {
    const key = getCompetitionGroupKey(event);
    const current = groups.get(key);

    if (current) {
      current.events.push(event);
      current.priority = Math.max(current.priority, getCompetitionPriority(event));
      current.isInternational = current.isInternational || isInternationalCompetition(event);
      if (current.category !== event.category) current.category = undefined;
      if (current.gender !== inferMatchGender(event)) current.gender = undefined;
    } else {
      groups.set(key, {
        key,
        title: event.competition,
        country: event.country,
        countryCode: event.countryCode,
        countryFlag: event.countryFlag,
        leagueLogo: event.leagueLogo,
        sport: event.sport,
        category: event.category,
        gender: inferMatchGender(event),
        events: [event],
        priority: getCompetitionPriority(event),
        isInternational: isInternationalCompetition(event)
      });
    }
  }

  return sortCompetitionGroups(Array.from(groups.values())
    .map((group) => ({
      ...group,
      events: options.sportPage ? sortEventsWithinSportCompetition(group.events) : sortMatchesInCompetition(group.events)
    })));
}

export function groupMatchesByCountry(events: SportEvent[]) {
  const groups = new Map<string, MatchGroup>();

  for (const event of events) {
    const title = event.country ?? "Internazionale";
    const key = `${event.sport}-${event.countryCode ?? title}`;
    const current = groups.get(key);

    if (current) {
      current.events.push(event);
      current.priority = Math.max(current.priority, getCompetitionPriority(event));
    } else {
      groups.set(key, {
        key,
        title,
        country: event.country,
        countryCode: event.countryCode,
        countryFlag: event.countryFlag,
        sport: event.sport,
        events: [event],
        priority: getCompetitionPriority(event),
        isInternational: isInternationalCompetition(event)
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({ ...group, events: sortMatchesByImportance(group.events) }))
    .sort((a, b) => b.events.length - a.events.length || a.title.localeCompare(b.title, "it"));
}

export function groupMatchesByStatus(events: SportEvent[]) {
  return (["live", "scheduled", "finished", "postponed", "cancelled"] as EventStatus[])
    .map((status) => ({
      status,
      events: sortMatchesByImportance(events.filter((event) => event.status === status))
    }))
    .filter((group) => group.events.length);
}

export function groupMatchesBySport(events: SportEvent[]) {
  const groups = new Map<Sport, SportEvent[]>();
  for (const event of events) {
    groups.set(event.sport, [...(groups.get(event.sport) ?? []), event]);
  }
  return Array.from(groups.entries()).map(([sport, items]) => ({
    sport,
    events: sortMatchesByImportance(items)
  }));
}

export function groupMatchesByGender(events: SportEvent[]) {
  const groups = new Map<string, SportEvent[]>();
  for (const event of events) {
    const gender = inferMatchGender(event) ?? "unknown";
    groups.set(gender, [...(groups.get(gender) ?? []), event]);
  }
  return Array.from(groups.entries()).map(([gender, items]) => ({
    gender,
    events: sortMatchesByImportance(items)
  }));
}

export function getFeaturedMatches(events: SportEvent[], limit = 8) {
  const featured = events.filter((event) => isFeaturedMatch(event));
  const fallback = featured.length ? featured : events.filter((event) => getMatchImportanceScore(event) >= 55);
  return sortMatchesByImportance(fallback.length ? fallback : events).slice(0, limit);
}

export function getSmartMatchSections(events: SportEvent[], options: GroupOptions = {}) {
  const groups = groupMatchesByCompetition(events, options);
  const topGroups = groups.filter((group) => group.priority >= TOP_COMPETITION_MIN_SCORE);
  const internationalGroups = groups.filter(
    (group) => group.isInternational && group.priority < TOP_COMPETITION_MIN_SCORE
  );
  const nationalMainGroups = groups.filter(
    (group) => !group.isInternational && group.priority >= 55 && group.priority < TOP_COMPETITION_MIN_SCORE
  );
  const otherGroups = groups.filter(
    (group) => !topGroups.includes(group) && !internationalGroups.includes(group) && !nationalMainGroups.includes(group)
  );

  return {
    featured: getFeaturedMatches(events),
    live: sortMatchesByImportance(events.filter((event) => event.isLive)),
    sections: [
      {
        key: "top",
        title: "Competizioni principali",
        description: "Tornei e campionati con priorità più alta.",
        groups: topGroups
      },
      {
        key: "international",
        title: "Tornei internazionali",
        groups: internationalGroups
      },
      {
        key: "national-main",
        title: "Campionati nazionali principali",
        groups: nationalMainGroups
      },
      {
        key: "other",
        title: "Altri eventi",
        groups: otherGroups
      }
    ] satisfies MatchSection[],
    allGroups: groups,
    countries: groupMatchesByCountry(events),
    statusGroups: groupMatchesByStatus(events),
    sportGroups: groupMatchesBySport(events),
    genderGroups: groupMatchesByGender(events)
  };
}
