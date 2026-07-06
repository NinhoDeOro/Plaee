import type { TennisScore, TennisSetScore } from "@/lib/types";

type RawTennisScore = {
  score_first?: string | number | null;
  score_second?: string | number | null;
  score_set?: string | number | null;
};

type RawPointByPoint = {
  set_number?: string | number | null;
  score?: string | null;
  player_served?: string | null;
  points?: Array<{ score?: string | null }>;
};

export type RawTennisScoreEvent = {
  event_final_result?: string | null;
  event_game_result?: string | null;
  event_status?: string | null;
  event_live?: string | number | null;
  event_serve?: string | null;
  scores?: RawTennisScore[];
  pointbypoint?: RawPointByPoint[];
};

function clean(value: unknown) {
  const text = String(value ?? "").trim();
  return text && text !== "-" ? text : undefined;
}

function toNumberOrText(value: unknown) {
  const text = clean(value);
  if (text === undefined) return null;
  const numeric = Number(text);
  return Number.isFinite(numeric) && String(numeric) === text ? numeric : text;
}

function parsePair(value?: string | null) {
  const text = clean(value);
  if (!text) return [null, null] as const;
  const [home, away] = text.split(/\s*-\s*/);
  return [toNumberOrText(home), toNumberOrText(away)] as const;
}

function parseSetToken(value: string): TennisSetScore | null {
  const match = value.match(/^(\d+|[A-Z]+)\s*-\s*(\d+|[A-Z]+)(?:\((\d+)\))?$/i);
  if (!match) return null;

  const home = toNumberOrText(match[1]);
  const away = toNumberOrText(match[2]);
  const tiebreak = match[3] ? toNumberOrText(match[3]) : null;
  const homeNumber = typeof home === "number" ? home : Number(home);
  const awayNumber = typeof away === "number" ? away : Number(away);

  return {
    home,
    away,
    homeTiebreak: tiebreak && homeNumber < awayNumber ? tiebreak : null,
    awayTiebreak: tiebreak && awayNumber < homeNumber ? tiebreak : null
  };
}

function parseApiSetSide(value: unknown) {
  const text = clean(value);
  if (!text) return { value: null, tiebreak: null };

  const decimal = text.match(/^(\d+)\.(\d+)$/);
  if (decimal) {
    return {
      value: toNumberOrText(decimal[1]),
      tiebreak: toNumberOrText(decimal[2])
    };
  }

  return {
    value: toNumberOrText(text),
    tiebreak: null
  };
}

function parseSetString(value?: string | null) {
  const text = clean(value);
  if (!text || !/\s/.test(text)) return [];

  return text
    .split(/\s+/)
    .map(parseSetToken)
    .filter((item): item is TennisSetScore => Boolean(item));
}

function parseStatusLabel(rawStatus?: string | null, live?: string | number | null) {
  const status = clean(rawStatus)?.toLowerCase();
  if (!status) return live === "1" || live === 1 ? "Live" : "In programma";
  if (status.includes("finish")) return "FT";
  if (status.includes("cancel")) return "Annullata";
  if (status.includes("retired")) return "Ritirato";
  if (status.includes("walkover")) return "Walkover";
  if (status.includes("postpon")) return "Posticipato";
  const set = status.match(/set\s*(\d+)/i);
  if (set) return `${set[1]}° set`;
  if (live === "1" || live === 1) return "Live";
  return rawStatus || "In programma";
}

function servingPlayer(value?: string | null): TennisScore["servingPlayer"] {
  const text = clean(value)?.toLowerCase();
  if (!text) return null;
  if (text.includes("first")) return "home";
  if (text.includes("second")) return "away";
  return null;
}

function latestPoint(rawEvent: RawTennisScoreEvent) {
  const latestGame = rawEvent.pointbypoint?.at(-1);
  const latestPointScore = latestGame?.points?.at(-1)?.score;
  return parsePair(latestPointScore ?? rawEvent.event_game_result);
}

export function normalizeTennisScore(rawEvent: RawTennisScoreEvent): TennisScore {
  const statusLabel = parseStatusLabel(rawEvent.event_status, rawEvent.event_live);
  const isScheduled = statusLabel === "In programma";
  const hasResult = Boolean(clean(rawEvent.event_final_result));
  const scoreSets =
    rawEvent.scores
      ?.slice()
      .sort((a, b) => Number(a.score_set ?? 0) - Number(b.score_set ?? 0))
      .map((item) => {
        const home = parseApiSetSide(item.score_first);
        const away = parseApiSetSide(item.score_second);

        return {
          home: home.value,
          away: away.value,
          homeTiebreak: home.tiebreak,
          awayTiebreak: away.tiebreak
        };
      })
      .filter((item) => item.home !== null || item.away !== null) ?? [];
  const fallbackSets = parseSetString(rawEvent.event_final_result);
  const [totalSetsHome, totalSetsAway] = parsePair(rawEvent.event_final_result);
  const [currentPointHome, currentPointAway] = latestPoint(rawEvent);
  const latestGame = rawEvent.pointbypoint?.at(-1);
  const [currentGameHome, currentGameAway] = parsePair(latestGame?.score);
  const currentSet =
    clean(rawEvent.event_status)?.match(/set\s*(\d+)/i)?.[1] ??
    clean(latestGame?.set_number)?.match(/(\d+)/)?.[1] ??
    null;

  return {
    sets: isScheduled && !hasResult ? [] : scoreSets.length ? scoreSets : fallbackSets,
    totalSetsHome,
    totalSetsAway,
    currentGameHome,
    currentGameAway,
    currentPointHome,
    currentPointAway,
    currentSet,
    servingPlayer: servingPlayer(rawEvent.event_serve),
    statusLabel,
    rawResult: clean(rawEvent.event_final_result)
  };
}

export function tennisTotalLabel(score: TennisScore | undefined, side: "home" | "away") {
  const value = side === "home" ? score?.totalSetsHome : score?.totalSetsAway;
  return value === undefined || value === null || value === "" ? "-" : value;
}
