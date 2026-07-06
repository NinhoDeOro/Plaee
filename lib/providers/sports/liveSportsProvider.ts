import type { Sport, SportEvent } from "@/lib/types";
import { getScores } from "@/lib/providers/sports";

export type LiveSportsResponse = {
  football: SportEvent[];
  tennis: SportEvent[];
  basketball: SportEvent[];
  formula1: SportEvent[];
};

const SPORTS: Array<keyof LiveSportsResponse> = ["football", "tennis", "basketball", "formula1"];

async function getLiveForSport(sport: Sport) {
  const events = await getScores({ sport, status: "live" });
  return events.filter((event) => event.sport === sport && event.isLive && event.status === "live");
}

export async function getLiveSportsEvents(): Promise<LiveSportsResponse> {
  const settled = await Promise.allSettled(SPORTS.map((sport) => getLiveForSport(sport)));

  return SPORTS.reduce<LiveSportsResponse>(
    (acc, sport, index) => {
      const result = settled[index];
      acc[sport] = result.status === "fulfilled" ? result.value : [];
      return acc;
    },
    {
      football: [],
      tennis: [],
      basketball: [],
      formula1: []
    }
  );
}

export function flattenLiveSports(response: LiveSportsResponse) {
  return SPORTS.flatMap((sport) => response[sport]);
}
