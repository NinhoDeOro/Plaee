import { NextResponse } from "next/server";
import type { Sport } from "@/lib/types";
import { getActiveSportsProviderName, getScores } from "@/lib/providers/sports";
import { matchCompetitionName, normalizeSearchText, searchEvents } from "@/lib/utils/search";
import { isEventStatus } from "@/lib/utils/status";

export const revalidate = 600;

function parseSport(value: string | null): Sport | "all" | "trending" | "motors" | undefined {
  if (!value || value === "all") return "all";
  if (value === "trending" || value === "motors") return value;
  if (["football", "tennis", "basketball", "formula1", "other"].includes(value)) return value as Sport;
  return undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const statusValue = url.searchParams.get("status");
  const status = isEventStatus(statusValue) ? statusValue : statusValue === "all" ? "all" : undefined;
  const requestedSport = parseSport(url.searchParams.get("sport"));
  const activeProvider = getActiveSportsProviderName();
  const sport =
    (requestedSport === "all" || !requestedSport) && activeProvider === "api-football"
      ? "football"
      : (requestedSport === "all" || !requestedSport) && activeProvider === "api-sports"
        ? "trending"
      : requestedSport;
  const date = url.searchParams.get("date") ?? undefined;
  const competition = url.searchParams.get("competition") ?? undefined;
  const country = url.searchParams.get("country") ?? undefined;
  const team = url.searchParams.get("team") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const noCache = url.searchParams.get("noCache") === "1";

  let events = await getScores({ sport, date, status, noCache });

  if (competition && competition !== "all") {
    events = events.filter((event) => matchCompetitionName(competition, event));
  }

  if (country && country !== "all") {
    const target = normalizeSearchText(country);
    events = events.filter((event) => normalizeSearchText(event.country).includes(target));
  }

  if (team) {
    events = searchEvents(team, events);
  }

  if (q) {
    events = searchEvents(q, events);
  }

  return NextResponse.json(events, {
    headers: {
      "Cache-Control": status === "live" ? "s-maxage=120, stale-while-revalidate=60" : "s-maxage=600, stale-while-revalidate=300"
    }
  });
}
