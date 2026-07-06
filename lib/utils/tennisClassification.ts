import type { SportEvent } from "@/lib/types";
import { normalizeSearchText } from "@/lib/utils/search";

export type TennisTourLevel =
  | "grand-slam"
  | "atp-finals"
  | "wta-finals"
  | "atp-1000"
  | "wta-1000"
  | "atp-500"
  | "wta-500"
  | "atp-250"
  | "wta-250"
  | "challenger"
  | "itf"
  | "junior"
  | "other";

export type TennisDiscipline = "singles" | "doubles" | "mixed-doubles" | "junior" | "unknown";
export type TennisGender = "men" | "women" | "mixed" | "junior" | "unknown";

export type TennisClassification = {
  tourLevel: TennisTourLevel;
  discipline: TennisDiscipline;
  gender: TennisGender;
  displayCategory: string;
  sortPriority: number;
  isJunior: boolean;
};

export type TennisFilterValue =
  | "all"
  | "singles"
  | "doubles"
  | "men"
  | "women"
  | "men-singles"
  | "women-singles"
  | "men-doubles"
  | "women-doubles"
  | "mixed-doubles"
  | "juniors";

const TOUR_ORDER: Record<TennisTourLevel, number> = {
  "grand-slam": 10,
  "atp-finals": 20,
  "wta-finals": 20,
  "atp-1000": 30,
  "wta-1000": 30,
  "atp-500": 40,
  "wta-500": 40,
  "atp-250": 50,
  "wta-250": 50,
  challenger: 60,
  itf: 70,
  junior: 90,
  other: 100
};

const TOUR_LABELS: Record<TennisTourLevel, string> = {
  "grand-slam": "Grand Slam",
  "atp-finals": "ATP Finals",
  "wta-finals": "WTA Finals",
  "atp-1000": "ATP 1000",
  "wta-1000": "WTA 1000",
  "atp-500": "ATP 500",
  "wta-500": "WTA 500",
  "atp-250": "ATP 250",
  "wta-250": "WTA 250",
  challenger: "Challenger",
  itf: "ITF",
  junior: "Juniors",
  other: "Tennis"
};

function tennisText(event: Partial<SportEvent> & Record<string, unknown>) {
  return normalizeSearchText(
    [
      event.eventTypeType,
      event.eventTypeKey,
      event.competition,
      event.category,
      event.gender,
      event.discipline,
      event.tourLevel,
      event.venue,
      event.homeName,
      event.awayName,
      event["tournament_name"],
      event["tournament_type"],
      event["event_name"],
      event["event_type_type"],
      event["tournament_round"],
      event["event_first_player"],
      event["event_second_player"]
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function hasDoublesNames(event: Partial<SportEvent>) {
  return [event.homeName, event.awayName].some((name) => /[/&+]/.test(String(name ?? "")));
}

function isJuniorValue(value: string) {
  return /\b(junior|juniors|boys?|girls?)\b/.test(value);
}

function getTourLevel(value: string): TennisTourLevel {
  if (isJuniorValue(value)) return "junior";
  if (/\b(grand slam|australian open|roland garros|french open|wimbledon|us open|u s open)\b/.test(value)) {
    return "grand-slam";
  }
  if (/\batp\b.*\bfinals?\b|\bfinals?\b.*\batp\b/.test(value)) return "atp-finals";
  if (/\bwta\b.*\bfinals?\b|\bfinals?\b.*\bwta\b/.test(value)) return "wta-finals";
  if (/\batp\b.*\b1000\b|\bmasters\b/.test(value)) return "atp-1000";
  if (/\bwta\b.*\b1000\b/.test(value)) return "wta-1000";
  if (/\batp\b.*\b500\b/.test(value)) return "atp-500";
  if (/\bwta\b.*\b500\b/.test(value)) return "wta-500";
  if (/\batp\b.*\b250\b/.test(value)) return "atp-250";
  if (/\bwta\b.*\b250\b/.test(value)) return "wta-250";
  if (/\bchallenger\b/.test(value)) return "challenger";
  if (/\bitf\b/.test(value)) return "itf";
  if (/\batp\b/.test(value)) return "atp-250";
  if (/\bwta\b/.test(value)) return "wta-250";
  return "other";
}

function getDiscipline(value: string, event: Partial<SportEvent>): TennisDiscipline {
  if (isJuniorValue(value)) return "junior";
  if (/\bmixed\b.*\bdoubles?\b|\bdoubles?\b.*\bmixed\b|doppio misto/.test(value)) return "mixed-doubles";
  if (/\bdoubles?\b|\bdoppio\b|\bdobles\b/.test(value) || hasDoublesNames(event)) return "doubles";
  if (/\bsingles?\b|\bsingolare\b|\bindividual\b/.test(value)) return "singles";
  return "unknown";
}

function getGender(value: string, event: Partial<SportEvent>, discipline: TennisDiscipline): TennisGender {
  if (discipline === "junior" || isJuniorValue(value)) return "junior";
  if (discipline === "mixed-doubles" || /\bmixed\b|misto/.test(value)) return "mixed";
  if (event.gender === "women" || /\bwta\b|\bwomen\b|\bfemale\b|femminile|chicas|girls/.test(value)) return "women";
  if (event.gender === "men" || /\batp\b|\bmen\b|\bmale\b|maschile|boys/.test(value)) return "men";
  if (event.gender === "mixed") return "mixed";
  return "unknown";
}

function getDisciplineOrder(discipline: TennisDiscipline, gender: TennisGender) {
  if (discipline === "singles" && gender === "men") return 10;
  if (discipline === "singles" && gender === "women") return 20;
  if (discipline === "doubles" && gender === "men") return 30;
  if (discipline === "doubles" && gender === "women") return 40;
  if (discipline === "mixed-doubles") return 50;
  if (discipline === "junior" || gender === "junior") return 90;
  return 100;
}

function getDisplayCategory(discipline: TennisDiscipline, gender: TennisGender, tourLevel: TennisTourLevel) {
  if (tourLevel === "junior" || discipline === "junior" || gender === "junior") return "Juniors";
  if (discipline === "singles" && gender === "men") return "Singolare maschile";
  if (discipline === "singles" && gender === "women") return "Singolare femminile";
  if (discipline === "doubles" && gender === "men") return "Doppio maschile";
  if (discipline === "doubles" && gender === "women") return "Doppio femminile";
  if (discipline === "mixed-doubles" || gender === "mixed") return "Doppio misto";
  if (discipline === "singles") return "Singolare";
  if (discipline === "doubles") return "Doppio";
  return TOUR_LABELS[tourLevel];
}

export function classifyTennisMatch(event: Partial<SportEvent> & Record<string, unknown>): TennisClassification {
  const value = tennisText(event);
  const tourLevel = getTourLevel(value);
  const discipline = getDiscipline(value, event);
  const gender = getGender(value, event, discipline);
  const isJunior = tourLevel === "junior" || discipline === "junior" || gender === "junior";

  return {
    tourLevel,
    discipline,
    gender,
    displayCategory: getDisplayCategory(discipline, gender, tourLevel),
    sortPriority: TOUR_ORDER[tourLevel] * 1000 + getDisciplineOrder(discipline, gender),
    isJunior
  };
}

export function tennisFilterMatches(event: SportEvent, filter: TennisFilterValue) {
  if (filter === "all") return true;

  const classification = classifyTennisMatch(event);
  if (filter === "singles") return classification.discipline === "singles";
  if (filter === "doubles") return classification.discipline === "doubles" || classification.discipline === "mixed-doubles";
  if (filter === "men") return classification.gender === "men";
  if (filter === "women") return classification.gender === "women";
  if (filter === "men-singles") return classification.discipline === "singles" && classification.gender === "men";
  if (filter === "women-singles") return classification.discipline === "singles" && classification.gender === "women";
  if (filter === "men-doubles") return classification.discipline === "doubles" && classification.gender === "men";
  if (filter === "women-doubles") return classification.discipline === "doubles" && classification.gender === "women";
  if (filter === "mixed-doubles") return classification.discipline === "mixed-doubles" || classification.gender === "mixed";
  if (filter === "juniors") return classification.isJunior;
  return true;
}

export function getTennisSidebarBucket(event: SportEvent) {
  const classification = classifyTennisMatch(event);

  if (classification.tourLevel === "grand-slam") return "Grand Slam";
  if (classification.tourLevel.startsWith("atp")) return "ATP";
  if (classification.tourLevel.startsWith("wta")) return "WTA";
  if (classification.tourLevel === "challenger") return "Challenger";
  if (classification.tourLevel === "itf") return "ITF";
  if (classification.tourLevel === "junior" || classification.isJunior) return "Juniors";
  return "Altri";
}

export function compareTennisEvents(a: SportEvent, b: SportEvent) {
  const diff = classifyTennisMatch(a).sortPriority - classifyTennisMatch(b).sortPriority;
  if (diff !== 0) return diff;

  const statusOrder = { live: 0, scheduled: 1, finished: 2, postponed: 3, cancelled: 4 };
  const statusDiff = statusOrder[a.status] - statusOrder[b.status];
  if (statusDiff !== 0) return statusDiff;

  return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
}

export function getTennisImportanceBase(eventOrClassification: SportEvent | TennisClassification) {
  const classification =
    "sortPriority" in eventOrClassification && "isJunior" in eventOrClassification
      ? eventOrClassification
      : classifyTennisMatch(eventOrClassification);

  const tourScore: Record<TennisTourLevel, number> = {
    "grand-slam": 1000,
    "atp-finals": 900,
    "wta-finals": 900,
    "atp-1000": 800,
    "wta-1000": 800,
    "atp-500": 650,
    "wta-500": 650,
    "atp-250": 500,
    "wta-250": 500,
    challenger: 250,
    itf: 120,
    junior: -500,
    other: 40
  };

  let disciplineScore = 0;
  if (classification.discipline === "singles") disciplineScore = 250;
  else if (classification.discipline === "doubles" && classification.gender !== "junior") disciplineScore = 80;
  else if (classification.discipline === "mixed-doubles") disciplineScore = 60;
  else if (classification.isJunior) disciplineScore = -500;

  return tourScore[classification.tourLevel] + disciplineScore;
}

export function getTennisSidebarEntryKey(event: SportEvent) {
  const classification = classifyTennisMatch(event);
  return `${event.competition}-${classification.displayCategory}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "-")
    .toLowerCase();
}

export function getTennisSidebarEntryLabel(event: SportEvent) {
  const classification = classifyTennisMatch(event);
  return `${event.competition} · ${classification.displayCategory}`;
}

export function sortTennisEvents(events: SportEvent[]) {
  return [...events].sort(compareTennisEvents);
}
