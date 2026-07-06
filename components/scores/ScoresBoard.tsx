"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { NewsItem, ScoreQuery, Sport, SportEvent } from "@/lib/types";
import { SearchBar } from "@/components/SearchBar";
import { CompetitionGroup } from "@/components/scores/CompetitionGroup";
import { CompetitionMenuMobile } from "@/components/scores/CompetitionMenuMobile";
import { CompetitionFilterPanel } from "@/components/scores/CompetitionFilterPanel";
import { CompetitionTabs, type ScoreboardTab } from "@/components/scores/CompetitionTabs";
import { favoritesChangedEvent, favoritesStorageKey } from "@/components/scores/MatchRow";
import { MatchCountBadge } from "@/components/scores/MatchCountBadge";
import { MatchSectionHeader } from "@/components/scores/MatchSectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  getCompetitionGroupKey,
  getFeaturedMatches,
  getSmartMatchSections,
  groupMatchesByCompetition,
  inferMatchGender,
  isInternationalCompetition
} from "@/lib/utils/groupMatches";
import { formatDateLabel, normalizeDateParam, shiftDate, toDateKey } from "@/lib/utils/date";
import { searchEvents } from "@/lib/utils/search";
import { cn } from "@/lib/utils/cn";
import type { CompetitionFilterValue } from "@/components/scores/CompetitionSidebar";
import type { MatchGenderFilter, MatchStatusFilter } from "@/components/scores/MatchFilters";

type ScoresBoardProps = {
  initialEvents: SportEvent[];
  newsItems?: NewsItem[];
  refreshIntervalMs?: number;
};

type StatusChip = {
  value: MatchStatusFilter;
  label: string;
  countKey: "live" | "finished" | "scheduled";
};

const statusChips: StatusChip[] = [
  { value: "live", label: "In Diretta", countKey: "live" },
  { value: "finished", label: "Finita", countKey: "finished" },
  { value: "scheduled", label: "In Programma", countKey: "scheduled" }
];

function readInitialParam(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return new URLSearchParams(window.location.search).get(name) ?? fallback;
}

type ScoreboardSport = NonNullable<ScoreQuery["sport"]>;

function isSport(value: string): value is ScoreboardSport {
  return ["all", "trending", "football", "tennis", "basketball", "formula1", "motors", "other"].includes(value);
}

function isScoreboardTab(value: string): value is ScoreboardTab {
  return ["all", "favorites", "competitions"].includes(value);
}

function readFavorites() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const value = window.localStorage.getItem(favoritesStorageKey);
    return new Set(value ? (JSON.parse(value) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

function getDateLabel(value: string) {
  const normalized = normalizeDateParam(value);
  const today = toDateKey();
  const yesterday = shiftDate(today, -1);
  const tomorrow = shiftDate(today, 1);

  if (normalized === today) return "Oggi";
  if (normalized === yesterday) return "Ieri";
  if (normalized === tomorrow) return "Domani";
  return formatDateLabel(normalized);
}

function groupCount(groups: ReturnType<typeof groupMatchesByCompetition>) {
  return groups.reduce((total, group) => total + group.events.length, 0);
}

export function ScoresBoard({ initialEvents, newsItems = [], refreshIntervalMs = 120000 }: ScoresBoardProps) {
  const [events, setEvents] = useState(initialEvents);
  const [date, setDate] = useState(() => readInitialParam("date", "today"));
  const [sport] = useState<ScoreboardSport>(() => {
    const value = readInitialParam("sport", "trending");
    return isSport(value) ? value : "trending";
  });
  const [status, setStatus] = useState<MatchStatusFilter>(() => {
    const value = readInitialParam("status", "all");
    return ["all", "live", "scheduled", "finished"].includes(value) ? (value as MatchStatusFilter) : "all";
  });
  const [competition, setCompetition] = useState<CompetitionFilterValue>(() => readInitialParam("competition", "all"));
  const [country, setCountry] = useState(() => readInitialParam("country", "all"));
  const [gender, setGender] = useState<MatchGenderFilter>(() => {
    const value = readInitialParam("category", "all");
    return ["all", "men", "women", "mixed"].includes(value) ? (value as MatchGenderFilter) : "all";
  });
  const [query, setQuery] = useState(() => readInitialParam("q", ""));
  const [tab, setTab] = useState<ScoreboardTab>(() => {
    const value = readInitialParam("tab", "all");
    return isScoreboardTab(value) ? value : "all";
  });
  const [favorites, setFavorites] = useState<Set<string>>(() => readFavorites());
  const [loading, setLoading] = useState(false);
  const [silentRefreshing, setSilentRefreshing] = useState(false);
  const defaultFetchSport = useRef<Sport | undefined>(
    initialEvents.length && initialEvents.every((event) => event.sport === "football") ? "football" : undefined
  );
  const didHydrate = useRef(false);
  const deferredQuery = useDeferredValue(query);

  const fetchScores = useCallback(
    async (signal?: AbortSignal, quiet = false) => {
      const params = new URLSearchParams({ date });
      if (sport !== "all") params.set("sport", sport);
      else if (defaultFetchSport.current) params.set("sport", defaultFetchSport.current);

      if (quiet) setSilentRefreshing(true);
      else setLoading(true);

      try {
        const response = await fetch(`/api/scores?${params.toString()}`, { signal });
        if (!response.ok) throw new Error("Scores request failed");
        const data = (await response.json()) as SportEvent[];
        setEvents(data);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.warn("Plaee scores refresh failed", error);
        }
      } finally {
        if (quiet) setSilentRefreshing(false);
        else setLoading(false);
      }
    },
    [date, sport]
  );

  useEffect(() => {
    if (!didHydrate.current) {
      didHydrate.current = true;
      return;
    }

    const controller = new AbortController();
    void fetchScores(controller.signal);
    return () => controller.abort();
  }, [fetchScores]);

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;
    const isToday = normalizeDateParam(date) === toDateKey();

    function clearTimer() {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    }

    function startTimer() {
      clearTimer();
      if (!isToday || document.hidden) return;
      timer = window.setInterval(() => fetchScores(controller.signal, true), refreshIntervalMs);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        clearTimer();
        return;
      }

      if (isToday) {
        void fetchScores(controller.signal, true);
        startTimer();
      }
    }

    startTimer();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearTimer();
      controller.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [date, fetchScores, refreshIntervalMs]);

  useEffect(() => {
    function updateFavorites() {
      setFavorites(readFavorites());
    }

    updateFavorites();
    window.addEventListener(favoritesChangedEvent, updateFavorites);
    window.addEventListener("storage", updateFavorites);
    return () => {
      window.removeEventListener(favoritesChangedEvent, updateFavorites);
      window.removeEventListener("storage", updateFavorites);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (date !== "today") params.set("date", date);
    if (sport !== "all") params.set("sport", sport);
    if (status !== "all") params.set("status", status);
    if (competition !== "all") params.set("competition", competition);
    if (country !== "all") params.set("country", country);
    if (gender !== "all") params.set("category", gender);
    if (query.trim()) params.set("q", query.trim());
    if (tab !== "all") params.set("tab", tab);

    window.history.replaceState(null, "", params.toString() ? `/?${params.toString()}` : "/");
  }, [competition, country, date, gender, query, sport, status, tab]);

  const menuData = useMemo(() => getSmartMatchSections(events), [events]);
  const favoriteCount = useMemo(() => events.filter((event) => favorites.has(event.id)).length, [events, favorites]);

  const filteredEvents = useMemo(() => {
    let next = [...events];

    if (tab === "favorites") {
      next = next.filter((event) => favorites.has(event.id));
    }

    const activeQuery = deferredQuery.trim();

    if (activeQuery) {
      return searchEvents(activeQuery, next);
    }

    if (!activeQuery && status !== "all") {
      next = next.filter((event) => event.status === status);
    }

    if (competition === "__featured") {
      next = getFeaturedMatches(next, 24);
    } else if (competition === "__live") {
      next = next.filter((event) => event.isLive);
    } else if (competition === "__international") {
      next = next.filter(isInternationalCompetition);
    } else if (competition.startsWith("competition:")) {
      const key = competition.replace("competition:", "");
      next = next.filter((event) => getCompetitionGroupKey(event) === key);
    }

    if (country !== "all") {
      next = next.filter((event) => event.country === country);
    }

    if (gender !== "all") {
      next = next.filter((event) => inferMatchGender(event) === gender);
    }

    return next;
  }, [competition, country, deferredQuery, events, favorites, gender, status, tab]);

  const groupedEvents = useMemo(() => groupMatchesByCompetition(filteredEvents), [filteredEvents]);
  const searchStatusGroups = useMemo(() => {
    if (!deferredQuery.trim()) return [];

    return [
      { key: "live", title: "Live", groups: groupMatchesByCompetition(filteredEvents.filter((event) => event.isLive)) },
      { key: "scheduled", title: "In programma", groups: groupMatchesByCompetition(filteredEvents.filter((event) => event.status === "scheduled")) },
      { key: "finished", title: "Concluse", groups: groupMatchesByCompetition(filteredEvents.filter((event) => event.status === "finished")) }
    ].filter((section) => section.groups.length);
  }, [deferredQuery, filteredEvents]);

  const counts = useMemo(
    () => ({
      all: events.length,
      live: events.filter((event) => event.isLive).length,
      scheduled: events.filter((event) => event.status === "scheduled").length,
      finished: events.filter((event) => event.status === "finished").length
    }),
    [events]
  );
  const genderCounts = useMemo(
    () => ({
      all: events.length,
      men: events.filter((event) => inferMatchGender(event) === "men").length,
      women: events.filter((event) => inferMatchGender(event) === "women").length,
      mixed: events.filter((event) => inferMatchGender(event) === "mixed").length
    }),
    [events]
  );
  const showGenderFilters = genderCounts.men + genderCounts.women + genderCounts.mixed > 0;

  function shiftSelectedDate(days: number) {
    setDate(shiftDate(normalizeDateParam(date), days));
  }

  function toggleStatus(value: MatchStatusFilter) {
    setStatus((current) => (current === value ? "all" : value));
  }

  function commitSearch(nextQuery: string) {
    setQuery(nextQuery);
    setStatus("all");
    setTab("all");
    setCompetition("all");
    setCountry("all");
  }

  function renderGroups(groups: ReturnType<typeof groupMatchesByCompetition>, defaultCollapsed = false) {
    return groups.map((group) => (
      <CompetitionGroup
        key={group.key}
        competition={group.title}
        country={group.country}
        countryCode={group.countryCode}
        countryFlag={group.countryFlag}
        leagueLogo={group.leagueLogo}
        category={group.category}
        gender={group.gender}
        events={group.events}
        defaultCollapsed={defaultCollapsed}
      />
    ));
  }

  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-white/10 bg-field-900/86 shadow-glow" aria-label="Risultati">
      <CompetitionTabs value={tab} favoritesCount={favoriteCount} onChange={setTab} />

      <div className="flex max-w-full flex-col gap-3 border-b border-white/10 p-3 sm:p-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {statusChips.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => toggleStatus(item.value)}
              className={cn(
                "inline-flex min-w-max items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-400/70",
                status === item.value
                  ? "border-red-400/35 bg-red-400/18 text-red-200"
                  : "border-white/10 bg-field-950/65 text-slate-300 hover:border-white/20 hover:bg-white/[0.05]"
              )}
            >
              {item.label}
              <MatchCountBadge count={counts[item.countKey]} />
            </button>
          ))}
        </div>

        <div className="flex min-w-0 items-center justify-between gap-3">
          <SearchBar
            events={events}
            news={newsItems}
            value={query}
            onQueryChange={setQuery}
            onSearch={commitSearch}
            className="hidden min-w-0 flex-1 sm:block"
            compact
          />

          <div className="flex shrink-0 items-center rounded-full border border-court-400/25 bg-field-950/80">
            <button
              type="button"
              onClick={() => shiftSelectedDate(-1)}
              className="grid h-11 w-12 place-items-center rounded-l-full text-court-300 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-400/70"
              aria-label="Giorno precedente"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setDate("today")}
              className="flex h-11 min-w-28 items-center justify-center gap-2 border-x border-white/10 px-4 text-sm font-black text-court-200"
              aria-label="Vai a oggi"
            >
              <CalendarDays className="h-4 w-4" aria-hidden />
              {getDateLabel(date)}
            </button>
            <button
              type="button"
              onClick={() => shiftSelectedDate(1)}
              className="grid h-11 w-12 place-items-center rounded-r-full text-court-300 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-400/70"
              aria-label="Giorno successivo"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <SearchBar
          events={events}
          news={newsItems}
          value={query}
          onQueryChange={setQuery}
          onSearch={commitSearch}
          className="sm:hidden"
          compact
        />
      </div>

      {showGenderFilters ? (
        <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 px-3 py-3 scrollbar-hide sm:px-4">
          <span className="min-w-max text-xs font-black uppercase text-slate-500">Categoria</span>
          {[
            { value: "all", label: "Tutte" },
            { value: "men", label: "Maschile" },
            { value: "women", label: "Femminile" },
            { value: "mixed", label: "Misto" }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setGender(item.value as MatchGenderFilter)}
              className={cn(
                "inline-flex min-w-max items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-400/70",
                gender === item.value
                  ? "border-court-400/35 bg-court-400/12 text-court-200"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
              )}
            >
              {item.label}
              <MatchCountBadge count={genderCounts[item.value as keyof typeof genderCounts]} />
            </button>
          ))}
        </div>
      ) : null}

      <CompetitionMenuMobile
        groups={menuData.allGroups}
        countries={menuData.countries}
        value={competition}
        countryValue={country}
        featuredCount={menuData.featured.length}
        liveCount={menuData.live.length}
        onChange={setCompetition}
        onCountryChange={setCountry}
      />

      {tab === "competitions" ? (
        <CompetitionFilterPanel
          groups={menuData.allGroups}
          countries={menuData.countries}
          value={competition}
          countryValue={country}
          featuredCount={menuData.featured.length}
          liveCount={menuData.live.length}
          onChange={setCompetition}
          onCountryChange={setCountry}
        />
      ) : null}

      {silentRefreshing ? (
        <div className="border-b border-white/10 px-4 py-2 text-xs font-bold uppercase text-court-300">
          Aggiornamento risultati...
        </div>
      ) : null}

      <div className="p-3 sm:p-4">
        {loading ? <LoadingSkeleton /> : null}

        {!loading && tab === "favorites" && !favoriteCount ? (
          <EmptyState title="Nessun preferito ancora" description="Usa la stella accanto a una partita per salvarla qui." />
        ) : null}

        {!loading && favoriteCount && tab === "favorites" && !filteredEvents.length ? (
          <EmptyState title="Nessun preferito con questi filtri" description="Prova a rimuovere stato, ricerca o competizione." />
        ) : null}

        {!loading && deferredQuery.trim() && filteredEvents.length ? (
          <div className="space-y-5">
            <MatchSectionHeader title={`Risultati per: ${deferredQuery.trim()}`} count={filteredEvents.length} />
            {searchStatusGroups.map((section) => (
              <section key={section.key} className="space-y-3">
                <MatchSectionHeader title={section.title} count={groupCount(section.groups)} />
                <div className="space-y-3">{renderGroups(section.groups)}</div>
              </section>
            ))}
          </div>
        ) : null}

        {!loading && !deferredQuery.trim() && filteredEvents.length ? (
          <div className="space-y-3">
            {renderGroups(groupedEvents, status === "finished")}
          </div>
        ) : null}

        {!loading && !filteredEvents.length && tab !== "favorites" ? (
          <EmptyState
            title={deferredQuery.trim() ? "Nessuna partita trovata per questa squadra." : "Nessun evento trovato"}
            description={deferredQuery.trim() ? "Prova con il nome della squadra in italiano, inglese o con un'abbreviazione." : "Prova un altro giorno, competizione o filtro."}
          />
        ) : null}
      </div>
    </section>
  );
}
