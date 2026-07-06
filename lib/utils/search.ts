import type { NewsItem, Sport, SportEvent } from "@/lib/types";
import { TEAM_ALIAS_ENTRIES, TEAM_ALIASES, type TeamAliasEntry } from "@/lib/config/teamAliases";
import { COUNTRY_ALIASES, COUNTRY_ALIAS_OVERRIDES, DISPLAY_NAME_LOCALES, REGION_CODES } from "@/lib/config/countryAliases";

export type SearchCategory = "all" | "team" | "player" | "match" | "competition" | "news" | "coach";

export type SearchSuggestion = {
  id: string;
  kind: Exclude<SearchCategory, "all">;
  title: string;
  subtitle?: string;
  meta?: string;
  logoUrl?: string;
  href: string;
  query: string;
  sport?: Sport | string;
  country?: string;
  score: number;
};

export type TeamSearchIndexEntry = {
  key: string;
  canonicalName: string;
  normalizedName: string;
  logo?: string;
  country?: string;
  countryCode?: string;
  competition?: string;
  sport: Sport;
  aliases: string[];
  normalizedAliases: string[];
  priority: number;
  hasLiveMatch: boolean;
};

type TeamSeed = {
  canonicalName: string;
  logo?: string;
  country?: string;
  countryCode?: string;
  competition?: string;
  sport: Sport;
};

const CLUB_WORDS = [
  "fc",
  "ac",
  "cf",
  "sc",
  "ss",
  "as",
  "afc",
  "uc",
  "ssc",
  "club",
  "football",
  "calcio",
  "citta",
  "city club",
  "deportivo",
  "athletic",
  "atletico",
  "atletica"
];

const GENDER_WORDS = ["women", "womens", "female", "femminile", "femminili", "donne", "maschile", "men", "uomini"];

const WORD_VARIANTS: Record<string, string[]> = {
  saint: ["st", "san", "santo"],
  st: ["saint"],
  united: ["utd"],
  utd: ["united"],
  munich: ["monaco", "muenchen", "munchen"],
  monaco: ["munich", "muenchen", "munchen"],
  munchen: ["munich", "monaco", "muenchen"],
  mumbai: ["bombay"],
  moscow: ["mosca"],
  london: ["londra"],
  naples: ["napoli"],
  rome: ["roma"],
  turin: ["torino"],
  genoa: ["genova"],
  florence: ["firenze", "fiorentina"],
  sevilla: ["seville", "siviglia"],
  bilbao: ["athletic bilbao"],
  sporting: ["sporting club"],
  nacional: ["national"],
  national: ["nacional"]
};

const displayNameCache = new Map<string, Intl.DisplayNames>();
const countryAliasCache = new Map<string, string[]>();

export function normalizeSearchText(text?: string | number) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .replace(/['’`´-]/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function getTeamAliases() {
  return TEAM_ALIASES;
}

export function getTeamAliasEntries() {
  return TEAM_ALIAS_ENTRIES;
}

function compactWords(value: string, words: string[]) {
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return normalizeSearchText(value)
    .replace(new RegExp(`\\b(${escaped})\\b`, "g"), " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripClubWords(value: string) {
  return compactWords(value, CLUB_WORDS);
}

function stripGenderWords(value: string) {
  return compactWords(value, GENDER_WORDS);
}

function addAlias(target: Set<string>, value?: string | number) {
  const normalized = normalizeSearchText(value);
  if (normalized) target.add(normalized);
}

function displayName(locale: string, code: string) {
  if (code.length !== 2) return undefined;

  try {
    const cacheKey = `${locale}:${code}`;
    const formatter =
      displayNameCache.get(cacheKey) ??
      new Intl.DisplayNames([locale], {
        type: "region"
      });
    displayNameCache.set(cacheKey, formatter);
    return formatter.of(code);
  } catch {
    return undefined;
  }
}

function normalizeCountryCode(countryCode?: string) {
  const raw = normalizeSearchText(countryCode).replace(/\s/g, "").toUpperCase();
  if (!raw) return undefined;
  if (COUNTRY_ALIAS_OVERRIDES[raw]) return raw;
  if (/^[A-Z]{2}$/.test(raw)) return raw;
  if (raw === "UK") return "GB";
  return undefined;
}

function aliasesForCountryCode(countryCode: string) {
  const code = normalizeCountryCode(countryCode);
  if (!code) return [];

  const cacheKey = code;
  const cached = countryAliasCache.get(cacheKey);
  if (cached) return cached;

  const aliases = new Set<string>();
  addAlias(aliases, code);

  for (const value of COUNTRY_ALIAS_OVERRIDES[code] ?? []) {
    addAlias(aliases, value);
  }

  if (code.length === 2) {
    for (const locale of DISPLAY_NAME_LOCALES) {
      addAlias(aliases, displayName(locale, code));
    }
  }

  const result = Array.from(aliases);
  countryAliasCache.set(cacheKey, result);
  return result;
}

function findCountryCodeFromName(value?: string) {
  const target = stripGenderWords(value ?? "");
  if (!target) return undefined;

  for (const [code, aliases] of Object.entries(COUNTRY_ALIAS_OVERRIDES)) {
    if (aliases.map(normalizeSearchText).some((alias) => alias === target)) return code;
  }

  for (const code of REGION_CODES) {
    if (aliasesForCountryCode(code).some((alias) => alias === target)) return code;
  }

  return undefined;
}

function aliasesForCountryName(value?: string) {
  const target = stripGenderWords(value ?? "");
  if (!target) return [];

  for (const [canonicalName, aliases] of Object.entries(COUNTRY_ALIASES)) {
    const normalizedAliases = [canonicalName, ...aliases].map(normalizeSearchText);
    if (normalizedAliases.some((alias) => alias === target)) {
      return [canonicalName, ...aliases].map(normalizeSearchText);
    }
  }

  return [];
}

function countryLabel(countryCode?: string, fallback?: string) {
  const code = normalizeCountryCode(countryCode);
  if (!code) return fallback;
  return displayName("it", code) ?? COUNTRY_ALIAS_OVERRIDES[code]?.[0] ?? fallback;
}

export function getCountryAliases(country?: string, countryCode?: string) {
  const aliases = new Set<string>();
  const directCode = normalizeCountryCode(countryCode);
  const inferredCode = findCountryCodeFromName(country);
  const code = directCode ?? inferredCode;

  addAlias(aliases, country);
  addAlias(aliases, countryCode);

  for (const alias of aliasesForCountryName(country)) aliases.add(alias);

  if (code) {
    for (const alias of aliasesForCountryCode(code)) aliases.add(alias);
  }

  return Array.from(aliases);
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

function strictFuzzyMatch(query: string, target: string) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedTarget = normalizeSearchText(target);
  if (normalizedQuery.length < 5 || normalizedTarget.length < 5) return false;
  if (Math.abs(normalizedQuery.length - normalizedTarget.length) > 2) return false;
  const distance = levenshtein(normalizedQuery, normalizedTarget);
  return distance <= (normalizedQuery.length <= 7 ? 1 : 2);
}

function aliasValues(entry: TeamAliasEntry) {
  return [entry.name, ...entry.aliases].map(normalizeSearchText);
}

function entryMatchesTeamName(entry: TeamAliasEntry, teamName: string) {
  const team = normalizeSearchText(teamName);
  if (!team) return false;

  return aliasValues(entry).some((value) => {
    if (value === team) return true;

    const valueTokens = value.split(" ").filter(Boolean);
    const teamTokens = team.split(" ").filter(Boolean);
    const canUsePartialMatch = value.length >= 6 && team.length >= 6 && valueTokens.length >= 2 && teamTokens.length >= 2;

    return canUsePartialMatch && (value.includes(team) || team.includes(value));
  });
}

function knownEntryForTeam(teamName: string) {
  return TEAM_ALIAS_ENTRIES.find((entry) => entryMatchesTeamName(entry, teamName));
}

export function getStaticAliasesForTeam(teamName: string) {
  const entry = knownEntryForTeam(teamName);
  return entry ? [entry.name, ...entry.aliases] : [];
}

function acronymFor(value: string) {
  const tokens = normalizeSearchText(value)
    .split(" ")
    .filter((token) => token.length >= 2 && !CLUB_WORDS.includes(token) && !GENDER_WORDS.includes(token));
  if (tokens.length < 2 || tokens.length > 4) return undefined;
  return tokens.map((token) => token[0]).join("");
}

function shortClubAliases(value: string) {
  const normalized = normalizeSearchText(value);
  const tokens = normalized.split(" ").filter(Boolean);
  const aliases: string[] = [];

  if (tokens[0] === "manchester" && tokens.length >= 2) {
    aliases.push(`man ${tokens[1]}`);
    if (tokens[1] === "united") aliases.push("man utd");
  }

  if (tokens[0] === "paris" && tokens.some((token) => token.startsWith("saint"))) {
    aliases.push("psg", "paris");
  }

  if (tokens.includes("barcelona")) {
    aliases.push("barca", "barsa");
  }

  return aliases;
}

function aliasVariants(value: string) {
  const tokens = normalizeSearchText(value).split(" ").filter(Boolean);
  const variants = new Set<string>();

  tokens.forEach((token, index) => {
    for (const variant of WORD_VARIANTS[token] ?? []) {
      const next = [...tokens];
      next[index] = variant;
      addAlias(variants, next.join(" "));
    }
  });

  return Array.from(variants);
}

function tokenAliases(value: string) {
  const tokens = normalizeSearchText(value)
    .split(" ")
    .filter((token) => token.length >= 4 && !CLUB_WORDS.includes(token) && !GENDER_WORDS.includes(token));
  const aliases = new Set<string>();

  for (const token of tokens) {
    if (!["real", "city", "club", "team"].includes(token)) aliases.add(token);
  }

  if (tokens.length >= 2) {
    aliases.add(tokens.join(" "));
    aliases.add(`${tokens[0]} ${tokens[tokens.length - 1]}`);
  }

  return Array.from(aliases);
}

export function generateDynamicTeamAliases(team: TeamSeed, event?: SportEvent) {
  const aliases = new Set<string>();
  const name = team.canonicalName;
  const normalizedName = normalizeSearchText(name);
  const withoutGender = stripGenderWords(name);
  const withoutClubWords = stripClubWords(withoutGender);
  const countryCodeFromTeam = findCountryCodeFromName(withoutGender) ?? findCountryCodeFromName(withoutClubWords);
  const countryCodeFromEvent =
    normalizeCountryCode(team.countryCode) ??
    normalizeCountryCode(event?.countryCode) ??
    findCountryCodeFromName(team.country) ??
    findCountryCodeFromName(event?.country);
  const countryNameAliases = [
    ...aliasesForCountryName(withoutGender),
    ...aliasesForCountryName(withoutClubWords)
  ];
  const teamCountryAliases = countryCodeFromTeam ? getCountryAliases(withoutGender, countryCodeFromTeam) : countryNameAliases;
  const countryAliases = getCountryAliases(team.country ?? event?.country, countryCodeFromTeam ?? countryCodeFromEvent);

  addAlias(aliases, name);
  addAlias(aliases, normalizedName);
  addAlias(aliases, withoutGender);
  addAlias(aliases, withoutClubWords);
  addAlias(aliases, acronymFor(name));

  for (const alias of shortClubAliases(name)) addAlias(aliases, alias);
  for (const alias of getStaticAliasesForTeam(name)) addAlias(aliases, alias);
  for (const alias of aliasVariants(name)) addAlias(aliases, alias);
  for (const alias of aliasVariants(withoutClubWords)) addAlias(aliases, alias);
  for (const alias of tokenAliases(withoutClubWords)) addAlias(aliases, alias);

  if (countryCodeFromTeam) {
    for (const alias of aliasesForCountryCode(countryCodeFromTeam)) aliases.add(alias);
  }

  for (const alias of countryNameAliases) aliases.add(alias);
  for (const alias of teamCountryAliases) aliases.add(alias);

  const teamLooksLikeCountry =
    Boolean(countryCodeFromTeam) ||
    countryNameAliases.length > 0 ||
    teamCountryAliases.length > 0 ||
    countryAliases.some((alias) => alias === normalizeSearchText(withoutGender) || alias === normalizeSearchText(withoutClubWords));

  if (teamLooksLikeCountry) {
    for (const alias of countryAliases) aliases.add(alias);
  }

  const tokens = withoutClubWords.split(" ").filter((token) => token.length >= 4);
  if (tokens.length === 1) addAlias(aliases, tokens[0]);
  if (tokens.length >= 2) {
    addAlias(aliases, tokens.join(" "));
    const last = tokens[tokens.length - 1];
    if (!["real", "city", "athletic", "atletico"].includes(last)) addAlias(aliases, last);
  }

  return Array.from(aliases).filter((alias) => alias.length >= 2);
}

function teamKey(teamName: string) {
  const known = knownEntryForTeam(teamName);
  return normalizeSearchText(known?.name ?? stripGenderWords(stripClubWords(teamName)) ?? teamName);
}

function sideMeta(event: SportEvent, side: "home" | "away"): TeamSeed {
  const canonicalName = side === "home" ? event.homeName : event.awayName;
  const teamCountryCode = findCountryCodeFromName(stripGenderWords(canonicalName));
  const eventCountryCode = normalizeCountryCode(event.countryCode) ?? findCountryCodeFromName(event.country);
  const countryCode = teamCountryCode ?? eventCountryCode;
  const country = teamCountryCode ? countryLabel(teamCountryCode, event.country) : event.country;

  return {
    canonicalName,
    logo: side === "home" ? event.homeLogo : event.awayLogo,
    country,
    countryCode,
    competition: event.competition,
    sport: event.sport
  };
}

function pickCanonicalName(current: string, next: string) {
  const currentNormalized = normalizeSearchText(current);
  const nextNormalized = normalizeSearchText(next);
  if (currentNormalized.length <= 4 && nextNormalized.length > currentNormalized.length) return next;
  return current;
}

export function buildTeamSearchIndex(events: SportEvent[]) {
  const index = new Map<string, TeamSearchIndexEntry>();

  for (const event of events) {
    for (const side of ["home", "away"] as const) {
      const seed = sideMeta(event, side);
      const key = teamKey(seed.canonicalName);
      const existing = index.get(key);
      const aliases = new Set(existing?.aliases ?? []);
      for (const alias of generateDynamicTeamAliases(seed, event)) aliases.add(alias);
      const normalizedAliases = Array.from(new Set(Array.from(aliases).map(normalizeSearchText))).filter(Boolean);

      const staticPriority = knownEntryForTeam(seed.canonicalName)?.priority ?? 0;
      index.set(key, {
        key,
        canonicalName: existing ? pickCanonicalName(existing.canonicalName, seed.canonicalName) : seed.canonicalName,
        normalizedName: normalizeSearchText(seed.canonicalName),
        logo: existing?.logo ?? seed.logo,
        country: existing?.country ?? seed.country,
        countryCode: existing?.countryCode ?? seed.countryCode,
        competition: existing?.competition ?? seed.competition,
        sport: existing?.sport ?? seed.sport,
        aliases: Array.from(aliases),
        normalizedAliases,
        priority: Math.max(existing?.priority ?? 0, staticPriority),
        hasLiveMatch: Boolean(existing?.hasLiveMatch || event.isLive)
      });
    }
  }

  return Array.from(index.values());
}

function scoreAlias(normalizedQuery: string, normalizedAlias: string) {
  if (!normalizedQuery || !normalizedAlias) return -1;

  if (normalizedAlias === normalizedQuery) return 1000;
  if (normalizedAlias.startsWith(normalizedQuery)) {
    if (normalizedQuery.length === 1) return 140;
    if (normalizedQuery.length === 2) return 260;
    return 650;
  }
  if (normalizedAlias.length >= 4 && normalizedQuery.length >= 4 && normalizedQuery.startsWith(normalizedAlias)) return 560;
  if (normalizedQuery.length >= 3 && normalizedAlias.includes(normalizedQuery)) return 420;

  const aliasTokens = normalizedAlias.split(" ");
  const queryTokens = normalizedQuery.split(" ");
  if (
    normalizedQuery.length >= 3 &&
    queryTokens.length > 1 &&
    queryTokens.every((queryToken) => aliasTokens.some((token) => token.startsWith(queryToken)))
  ) {
    return 380;
  }

  if (strictFuzzyMatch(normalizedQuery, normalizedAlias)) return 250;
  return -1;
}

function scoreTeam(normalizedQuery: string, team: TeamSearchIndexEntry) {
  if (!normalizedQuery) return team.priority + (team.hasLiveMatch ? 50 : 0);

  let best = -1;
  for (const alias of team.normalizedAliases.length ? team.normalizedAliases : team.aliases) {
    best = Math.max(best, scoreAlias(normalizedQuery, alias));
  }

  if (best < 0) return -1;
  return best + team.priority + (team.hasLiveMatch ? 35 : 0);
}

export function searchTeams(query: string, teamIndex: TeamSearchIndexEntry[], limit = 8) {
  const normalizedQuery = normalizeSearchText(query);

  return teamIndex
    .map((team) => ({ team, score: scoreTeam(normalizedQuery, team) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.team.canonicalName.localeCompare(b.team.canonicalName, "it"))
    .slice(0, limit);
}

export function searchEventsByTeam(query: string, events: SportEvent[]) {
  const teamIndex = buildTeamSearchIndex(events);
  const matchedTeams = new Set(searchTeams(query, teamIndex, Number.MAX_SAFE_INTEGER).map((item) => item.team.key));
  if (!matchedTeams.size) return [];

  return events.filter((event) => {
    const homeKey = teamKey(event.homeName);
    const awayKey = teamKey(event.awayName);
    return matchedTeams.has(homeKey) || matchedTeams.has(awayKey);
  });
}

export function matchTeamName(query: string, event: SportEvent) {
  return searchEventsByTeam(query, [event]).length > 0;
}

export function matchCompetitionName(query: string, event: SportEvent) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedCompetition = normalizeSearchText(
    [
      event.competition,
      event.country,
      event.category,
      event.raceName,
      event.circuit,
      event.sessionType,
      event.venue
    ].filter(Boolean).join(" ")
  );
  return normalizedQuery.length >= 3 && normalizedCompetition.includes(normalizedQuery);
}

function teamSubtitle(team: TeamSearchIndexEntry) {
  return team.country ?? team.countryCode ?? "Squadra";
}

export function buildSearchSuggestions({
  query,
  events = [],
  teamIndex,
  limit = 8
}: {
  query: string;
  events?: SportEvent[];
  teamIndex?: TeamSearchIndexEntry[];
  news?: NewsItem[];
  category?: SearchCategory;
  limit?: number;
}) {
  const index = teamIndex ?? buildTeamSearchIndex(events);

  return searchTeams(query, index, limit).map(({ team, score }) => ({
    id: `team:${team.key}`,
    kind: "team" as const,
    title: team.canonicalName,
    subtitle: teamSubtitle(team),
    meta: "Squadra",
    logoUrl: team.logo,
    href: `/?q=${encodeURIComponent(team.canonicalName)}`,
    query: team.canonicalName,
    sport: team.sport,
    country: team.country,
    score
  }));
}

export function searchEvents(query: string, events: SportEvent[]) {
  const value = normalizeSearchText(query);
  if (!value) return events;

  const teamEvents = searchEventsByTeam(value, events);
  const matchedEvents = teamEvents.length ? teamEvents : events.filter((event) => matchCompetitionName(value, event));

  return matchedEvents.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    const statusOrder = { live: 0, scheduled: 1, finished: 2, postponed: 3, cancelled: 4 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
}
