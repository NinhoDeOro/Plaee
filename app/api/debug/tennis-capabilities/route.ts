import { NextResponse } from "next/server";
import { normalizeDateParam } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const DEFAULT_API_TENNIS_BASE_URL = "https://api.api-tennis.com/tennis/";

type ApiTennisResponse = {
  success?: 0 | 1;
  result?: unknown;
  error?: string;
};

type ApiRecord = Record<string, unknown>;

type CapabilityCall = {
  label: string;
  ok: boolean;
  success?: 0 | 1;
  count: number;
  error?: string;
  fields: string[];
  items: ApiRecord[];
};

function baseUrl() {
  return process.env.API_TENNIS_BASE_URL || DEFAULT_API_TENNIS_BASE_URL;
}

function asRecords(value: unknown): ApiRecord[] {
  if (!value) return [];
  const items = Array.isArray(value) ? value : [value];
  return items.filter((item): item is ApiRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item));
}

function collectFields(items: ApiRecord[]) {
  return Array.from(new Set(items.flatMap((item) => Object.keys(item)))).sort((a, b) => a.localeCompare(b, "it"));
}

function hasArrayField(items: ApiRecord[], field: string) {
  return items.some((item) => Array.isArray(item[field]) && (item[field] as unknown[]).length > 0);
}

function hasStatLikeField(items: ApiRecord[]) {
  const pattern = /(ace|double|fault|serve|service|break|winner|unforced|statistic|statistics)/i;
  return items.some((item) => {
    if (Array.isArray(item.statistics) && item.statistics.length > 0) return true;
    return Object.keys(item).some((key) => {
      if (!pattern.test(key) || key === "statistics") return false;
      const value = item[key];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== "";
    });
  });
}

function safeSample(items: ApiRecord[]) {
  return items.slice(0, 3).map((item) => {
    const sample: ApiRecord = {};
    for (const key of Object.keys(item).slice(0, 30)) {
      const value = item[key];
      if (Array.isArray(value)) {
        sample[key] = `array(${value.length})`;
      } else if (value && typeof value === "object") {
        sample[key] = "object";
      } else {
        sample[key] = value;
      }
    }
    return sample;
  });
}

async function callApi(label: string, params: Record<string, string | undefined>): Promise<CapabilityCall> {
  const key = process.env.API_TENNIS_KEY;
  if (!key) {
    return {
      label,
      ok: false,
      count: 0,
      error: "missing_api_tennis_key",
      fields: [],
      items: []
    };
  }

  const search = new URLSearchParams({ APIkey: key });
  Object.entries(params).forEach(([paramKey, value]) => {
    if (value) search.set(paramKey, value);
  });

  try {
    const response = await fetch(`${baseUrl()}?${search.toString()}`, { cache: "no-store" });
    const data = (await response.json()) as ApiTennisResponse;
    const items = asRecords(data.result);

    console.info(`[Plaee tennis capabilities] ${label}: ok=${response.ok} success=${data.success ?? "n/a"} count=${items.length}`);

    return {
      label,
      ok: response.ok,
      success: data.success,
      count: items.length,
      error: data.error,
      fields: collectFields(items),
      items
    };
  } catch (error) {
    const message = error instanceof Error ? error.message.replace(/APIkey=[^&\s]+/gi, "APIkey=[redacted]") : "unknown_error";
    console.warn(`[Plaee tennis capabilities] ${label}: failed ${message}`);

    return {
      label,
      ok: false,
      count: 0,
      error: message,
      fields: [],
      items: []
    };
  }
}

function summarize(call: CapabilityCall) {
  return {
    ok: call.ok,
    success: call.success,
    count: call.count,
    error: call.error,
    fields: call.fields,
    sample: safeSample(call.items)
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId")?.replace("api-tennis-", "");
  const firstPlayerKey = url.searchParams.get("firstPlayerKey") ?? undefined;
  const secondPlayerKey = url.searchParams.get("secondPlayerKey") ?? undefined;
  const date = normalizeDateParam(url.searchParams.get("date") ?? "today");

  const calls = await Promise.all([
    callApi("fixtures/detail", eventId
      ? { method: "get_fixtures", match_key: eventId }
      : { method: "get_fixtures", date_start: date, date_stop: date }),
    callApi("livescore", { method: "get_livescore" }),
    firstPlayerKey && secondPlayerKey
      ? callApi("h2h", { method: "get_H2H", first_player_key: firstPlayerKey, second_player_key: secondPlayerKey })
      : Promise.resolve<CapabilityCall>({
          label: "h2h",
          ok: false,
          count: 0,
          error: "provide firstPlayerKey and secondPlayerKey",
          fields: [],
          items: []
        }),
    firstPlayerKey
      ? callApi("players", { method: "get_players", player_key: firstPlayerKey })
      : callApi("players", { method: "get_players" }),
    callApi("standings", { method: "get_standings" }),
    callApi("rankings", { method: "get_rankings" })
  ]);

  const [fixtureDetail, livescore, h2h, players, standings, rankings] = calls;
  const allItems = calls.flatMap((call) => call.items);
  const availableFields = collectFields(allItems);

  const hasPointByPoint = calls.some((call) => hasArrayField(call.items, "pointbypoint"));
  const hasLiveStats = calls.some((call) => hasStatLikeField(call.items));
  const hasH2H = h2h.ok && h2h.success === 1 && h2h.count > 0;
  const hasPlayers = players.ok && players.success === 1 && players.count > 0;
  const hasRankings =
    (standings.ok && standings.success === 1 && standings.count > 0) ||
    (rankings.ok && rankings.success === 1 && rankings.count > 0);
  const hasRecentMatches = h2h.items.some((item) => Boolean(item.event_date || item.event_final_result));

  const notes = [
    !process.env.API_TENNIS_KEY ? "API_TENNIS_KEY non configurata." : undefined,
    hasPointByPoint ? "Point-by-point disponibile in almeno una risposta." : "Point-by-point non disponibile nei record testati.",
    hasLiveStats ? "Sono presenti campi compatibili con statistiche live." : "Statistiche live aggregate non trovate nei record testati.",
    hasH2H ? "H2H disponibile con le chiavi giocatore fornite." : "H2H non disponibile o non testabile senza firstPlayerKey/secondPlayerKey.",
    hasPlayers ? "Endpoint players disponibile." : "Endpoint players non disponibile o non autorizzato con la chiave corrente.",
    hasRankings ? "Ranking/standings disponibili." : "Ranking/standings non disponibili o non autorizzati con la chiave corrente."
  ].filter(Boolean);

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      apiKey: {
        present: Boolean(process.env.API_TENNIS_KEY),
        exposed: false
      },
      query: {
        date,
        eventId: eventId ?? null,
        firstPlayerKey: firstPlayerKey ?? null,
        secondPlayerKey: secondPlayerKey ?? null
      },
      hasLiveStats,
      hasPointByPoint,
      hasH2H,
      hasPlayers,
      hasRankings,
      hasRecentMatches,
      availableFields,
      notes,
      calls: {
        fixtureDetail: summarize(fixtureDetail),
        livescore: summarize(livescore),
        h2h: summarize(h2h),
        players: summarize(players),
        standings: summarize(standings),
        rankings: summarize(rankings)
      }
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
