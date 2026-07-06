import { NextResponse } from "next/server";
import { normalizeDateParam } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const DEFAULT_API_TENNIS_BASE_URL = "https://api.api-tennis.com/tennis/";
const GRAND_SLAM_PATTERN = /\b(grand slam|australian open|roland garros|french open|wimbledon|us open|u\.s\. open)\b/i;
const MAIN_TENNIS_PATTERN = /\b(atp|wta|slam|grand slam|australian open|roland garros|french open|wimbledon|us open|u\.s\. open|challenger|itf)\b/i;

type ApiTennisResponse = {
  success?: 0 | 1;
  result?: unknown;
  error?: string;
};

type ApiRecord = Record<string, unknown>;

type DebugCall = {
  ok: boolean;
  success?: 0 | 1;
  count: number;
  error?: string;
  items: ApiRecord[];
};

function baseUrl() {
  return process.env.API_TENNIS_BASE_URL || DEFAULT_API_TENNIS_BASE_URL;
}

function redact(value: string) {
  return value.replace(/([?&]APIkey=)[^&\s]+/gi, "$1[redacted]");
}

function asRecords(value: unknown): ApiRecord[] {
  if (!value) return [];
  const items = Array.isArray(value) ? value : [value];
  return items.filter((item): item is ApiRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item));
}

function stringValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function normalize(value?: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "it"));
}

function recordText(item: ApiRecord) {
  return [
    item.tournament_name,
    item.tournament_round,
    item.event_type_type,
    item.event_first_player,
    item.event_second_player
  ]
    .map(stringValue)
    .filter(Boolean)
    .join(" ");
}

function getCategory(item: ApiRecord) {
  const value = recordText(item);
  const normalized = normalize(value);

  if (GRAND_SLAM_PATTERN.test(value)) return "Grand Slam";
  if (/\batp\b/.test(normalized)) return "ATP";
  if (/\bwta\b/.test(normalized)) return "WTA";
  if (normalized.includes("challenger")) return "Challenger";
  if (/\bitf\b/.test(normalized)) return "ITF";
  if (normalized.includes("exhibition")) return "Exhibition";
  return "Tennis";
}

function categoryMatches(item: ApiRecord, requestedCategory?: string | null) {
  if (!requestedCategory) return true;
  const target = normalize(requestedCategory);
  const text = normalize(recordText(item));
  const category = normalize(getCategory(item));

  if (target === "grand slam" || target === "slam") {
    return category === "grand slam";
  }

  if (target === "atp") return /\batp\b/.test(text);
  if (target === "wta") return /\bwta\b/.test(text);
  if (target === "challenger") return text.includes("challenger");
  if (target === "itf") return /\bitf\b/.test(text);

  return category === target;
}

function flagsFromItems(items: ApiRecord[]) {
  const values = items.map(recordText);
  const normalizedValues = values.map(normalize);

  return {
    hasATP: normalizedValues.some((value) => /\batp\b/.test(value)),
    hasWTA: normalizedValues.some((value) => /\bwta\b/.test(value)),
    hasGrandSlam: values.some((value) => GRAND_SLAM_PATTERN.test(value)),
    hasChallenger: normalizedValues.some((value) => value.includes("challenger")),
    hasITF: normalizedValues.some((value) => /\bitf\b/.test(value))
  };
}

function countByCategory(items: ApiRecord[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const category = getCategory(item);
    acc[category] = (acc[category] ?? 0) + 1;
    return acc;
  }, {});
}

function countByRawSignal(items: ApiRecord[]) {
  return {
    GrandSlam: items.filter((item) => GRAND_SLAM_PATTERN.test(recordText(item))).length,
    ATP: items.filter((item) => /\batp\b/.test(normalize(recordText(item)))).length,
    WTA: items.filter((item) => /\bwta\b/.test(normalize(recordText(item)))).length,
    Challenger: items.filter((item) => normalize(recordText(item)).includes("challenger")).length,
    ITF: items.filter((item) => /\bitf\b/.test(normalize(recordText(item)))).length
  };
}

function safeRecord(item: ApiRecord) {
  return {
    event_key: stringValue(item.event_key),
    event_type_key: stringValue(item.event_type_key),
    event_type_type: stringValue(item.event_type_type),
    tournament_key: stringValue(item.tournament_key),
    tournament_name: stringValue(item.tournament_name),
    tournament_round: stringValue(item.tournament_round),
    event_date: stringValue(item.event_date),
    event_time: stringValue(item.event_time),
    event_first_player: stringValue(item.event_first_player),
    event_second_player: stringValue(item.event_second_player),
    event_final_result: stringValue(item.event_final_result),
    event_game_result: stringValue(item.event_game_result),
    event_status: stringValue(item.event_status),
    event_live: stringValue(item.event_live),
    category: getCategory(item)
  };
}

function summarizeCall(call: DebugCall) {
  return {
    ok: call.ok,
    success: call.success,
    count: call.count,
    error: call.error
  };
}

async function callApi(label: string, params: Record<string, string>): Promise<DebugCall> {
  const key = process.env.API_TENNIS_KEY;
  if (!key) {
    return {
      ok: false,
      count: 0,
      error: "missing_api_tennis_key",
      items: []
    };
  }

  const search = new URLSearchParams({ APIkey: key, ...params });
  const url = `${baseUrl()}?${search.toString()}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    const data = (await response.json()) as ApiTennisResponse;
    const items = asRecords(data.result);

    console.info(`[Plaee debug tennis] ${label}: ok=${response.ok} success=${data.success ?? "n/a"} count=${items.length}`);

    return {
      ok: response.ok,
      success: data.success,
      count: items.length,
      error: data.error,
      items
    };
  } catch (error) {
    const message = error instanceof Error ? redact(error.message) : "unknown_error";
    console.warn(`[Plaee debug tennis] ${label}: failed ${message}`);
    return {
      ok: false,
      count: 0,
      error: message,
      items: []
    };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = normalizeDateParam(url.searchParams.get("date") ?? "today");
  const requestedCategory = url.searchParams.get("category");

  const [eventTypes, tournaments, fixtures, livescore] = await Promise.all([
    callApi("event types", { method: "get_events" }),
    callApi("tournaments", { method: "get_tournaments" }),
    callApi("fixtures", { method: "get_fixtures", date_start: date, date_stop: date }),
    callApi("livescore", { method: "get_livescore" })
  ]);

  const filteredFixtures = fixtures.items.filter((item) => categoryMatches(item, requestedCategory));
  const fixtureTypes = unique(fixtures.items.map((item) => stringValue(item.event_type_type)));
  const fixtureTypeKeys = unique(fixtures.items.map((item) => stringValue(item.event_type_key)));
  const tournamentNames = unique(fixtures.items.map((item) => stringValue(item.tournament_name)));
  const mainFixtureRecords = fixtures.items.filter((item) => MAIN_TENNIS_PATTERN.test(recordText(item))).slice(0, 30);
  const mainTournamentRecords = tournaments.items.filter((item) => MAIN_TENNIS_PATTERN.test(recordText(item))).slice(0, 30);

  const summary = {
    checkedAt: new Date().toISOString(),
    date,
    requestedCategory: requestedCategory ?? "all",
    apiKey: {
      present: Boolean(process.env.API_TENNIS_KEY),
      exposed: false
    },
    calls: {
      eventTypes: summarizeCall(eventTypes),
      tournaments: summarizeCall(tournaments),
      fixtures: summarizeCall(fixtures),
      livescore: summarizeCall(livescore)
    },
    eventTypes: {
      total: eventTypes.count,
      uniqueEventTypeTypes: unique(eventTypes.items.map((item) => stringValue(item.event_type_type))),
      ...flagsFromItems(eventTypes.items)
    },
    tournaments: {
      total: tournaments.count,
      first30: tournaments.items.slice(0, 30).map((item) => ({
        tournament_name: stringValue(item.tournament_name),
        event_type_type: stringValue(item.event_type_type)
      })),
      mainRecordsFirst30: mainTournamentRecords.map(safeRecord),
      ...flagsFromItems(tournaments.items)
    },
    fixtures: {
      total: fixtures.count,
      filteredTotal: filteredFixtures.length,
      first30Raw: filteredFixtures.slice(0, 30).map(safeRecord),
      tournamentNames,
      uniqueEventTypeTypes: fixtureTypes,
      uniqueEventTypeKeys: fixtureTypeKeys,
      categoryCounts: countByCategory(fixtures.items),
      rawSignalCounts: countByRawSignal(fixtures.items),
      mainRecordsFirst30: mainFixtureRecords.map(safeRecord),
      ...flagsFromItems(fixtures.items)
    },
    livescore: {
      total: livescore.count,
      uniqueEventTypeTypes: unique(livescore.items.map((item) => stringValue(item.event_type_type))),
      categoryCounts: countByCategory(livescore.items),
      rawSignalCounts: countByRawSignal(livescore.items),
      ...flagsFromItems(livescore.items)
    }
  };

  console.info("[Plaee debug tennis] summary", {
    date,
    requestedCategory: requestedCategory ?? "all",
    fixtures: fixtures.count,
    filteredFixtures: filteredFixtures.length,
    flags: {
      hasATP: summary.fixtures.hasATP,
      hasWTA: summary.fixtures.hasWTA,
      hasGrandSlam: summary.fixtures.hasGrandSlam,
      hasChallenger: summary.fixtures.hasChallenger,
      hasITF: summary.fixtures.hasITF
    }
  });

  return NextResponse.json(summary, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
