import type { Sport } from "@/lib/types";

export const SPORT_LABELS: Record<Sport, string> = {
  football: "Calcio",
  tennis: "Tennis",
  basketball: "Basket",
  formula1: "Motori",
  other: "Sport"
};

export function isSport(value: string): value is Sport {
  return ["football", "tennis", "basketball", "formula1", "other"].includes(value);
}

export function getSportLabel(sport: Sport | string) {
  return SPORT_LABELS[sport as Sport] ?? sport;
}
