"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Sport, SportEvent } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompetitionGroup } from "@/components/scores/CompetitionGroup";
import { CompetitionMenuMobile } from "@/components/scores/CompetitionMenuMobile";
import { CompetitionSidebar, type CompetitionFilterValue } from "@/components/scores/CompetitionSidebar";
import { DateSelector } from "@/components/scores/DateSelector";
import { FeaturedMatches } from "@/components/scores/FeaturedMatches";
import { LiveTicker } from "@/components/scores/LiveTicker";
import { MatchFilters, type MatchGenderFilter, type MatchStatusFilter } from "@/components/scores/MatchFilters";
import { MatchSectionHeader } from "@/components/scores/MatchSectionHeader";
import { TennisCompetitionMenuMobile, TennisSidebar } from "@/components/tennis/TennisSidebar";
import { TennisFilters } from "@/components/tennis/TennisFilters";
import {
  getCompetitionGroupKey,
  getFeaturedMatches,
  getSmartMatchSections,
  inferMatchGender,
  isInternationalCompetition
} from "@/lib/utils/groupMatches";
import { searchEvents } from "@/lib/utils/search";
import type { TennisFilterValue } from "@/lib/utils/tennisClassification";
import { getTennisSidebarEntryKey, tennisFilterMatches } from "@/lib/utils/tennisClassification";

type SportPageClientProps = {
  events: SportEvent[];
  sport: Sport;
};

export function SportPageClient({ events: initialEvents, sport }: SportPageClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [date, setDate] = useState("today");
  const [status, setStatus] = useState<MatchStatusFilter>("all");
  const [competition, setCompetition] = useState<CompetitionFilterValue>("all");
  const [country, setCountry] = useState("all");
  const [gender, setGender] = useState<MatchGenderFilter>("all");
  const [tennisFilter, setTennisFilter] = useState<TennisFilterValue>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const didHydrate = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function refresh() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ sport, date });
        const response = await fetch(`/api/scores?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Sport scores request failed");
        setEvents((await response.json()) as SportEvent[]);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.warn("Plaee sport refresh failed", error);
        }
      } finally {
        setLoading(false);
      }
    }

    if (!didHydrate.current) {
      didHydrate.current = true;
      setEvents(initialEvents);
      return () => controller.abort();
    }

    void refresh();
    return () => controller.abort();
  }, [date, initialEvents, sport]);

  const menuData = useMemo(() => getSmartMatchSections(events, { sportPage: true }), [events]);

  const filtered = useMemo(() => {
    let next = [...events];

    if (status !== "all") next = next.filter((event) => event.status === status);

    if (competition === "__featured") {
      next = getFeaturedMatches(next, 24);
    } else if (competition === "__live") {
      next = next.filter((event) => event.isLive);
    } else if (competition === "__international") {
      next = next.filter(isInternationalCompetition);
    } else if (competition.startsWith("competition:")) {
      const key = competition.replace("competition:", "");
      next = next.filter((event) => getCompetitionGroupKey(event) === key);
    } else if (sport === "tennis" && competition.startsWith("tennis:")) {
      const key = competition.replace("tennis:", "");
      next = next.filter((event) => getTennisSidebarEntryKey(event) === key);
    }

    if (country !== "all") next = next.filter((event) => event.country === country);
    if (sport === "tennis") {
      if (tennisFilter !== "all") next = next.filter((event) => tennisFilterMatches(event, tennisFilter));
    } else if (gender !== "all") {
      next = next.filter((event) => inferMatchGender(event) === gender);
    }

    if (query.trim()) next = searchEvents(query.trim(), next);

    return next;
  }, [competition, country, events, gender, query, sport, status, tennisFilter]);

  const smart = useMemo(() => getSmartMatchSections(filtered, { sportPage: true }), [filtered]);
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
      men: events.filter((event) => inferMatchGender(event) === "men").length,
      women: events.filter((event) => inferMatchGender(event) === "women").length,
      mixed: events.filter((event) => inferMatchGender(event) === "mixed").length
    }),
    [events]
  );

  return (
    <div className="space-y-6">
      <DateSelector value={date} onChange={setDate} />

      <MatchFilters
        status={status}
        gender={gender}
        query={query}
        counts={counts}
        genderCounts={genderCounts}
        onStatusChange={setStatus}
        onGenderChange={setGender}
        onQueryChange={setQuery}
        showGenderFilters={sport !== "tennis"}
      />

      {sport === "tennis" ? (
        <TennisFilters events={events} value={tennisFilter} onChange={setTennisFilter} />
      ) : null}

      {sport === "tennis" ? (
        <TennisCompetitionMenuMobile events={events} value={competition} onChange={setCompetition} />
      ) : (
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
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {sport === "tennis" ? (
          <TennisSidebar events={events} value={competition} onChange={setCompetition} />
        ) : (
          <CompetitionSidebar
            groups={menuData.allGroups}
            countries={menuData.countries}
            value={competition}
            countryValue={country}
            featuredCount={menuData.featured.length}
            liveCount={menuData.live.length}
            onChange={setCompetition}
            onCountryChange={setCountry}
          />
        )}

        {loading ? (
          <div className="rounded-lg border border-white/10 bg-field-900/70 p-5 text-sm font-bold text-slate-300">
            Caricamento eventi...
          </div>
        ) : filtered.length ? (
          <div className="space-y-7">
            <FeaturedMatches events={smart.featured} />
            <LiveTicker events={smart.live} />
            {smart.sections.map((section) =>
              section.groups.length ? (
                <section key={section.key} className="space-y-3">
                  <MatchSectionHeader
                    title={section.title}
                    description={section.description}
                    count={section.groups.reduce((total, group) => total + group.events.length, 0)}
                  />
                  <div className="space-y-4">
                    {section.groups.map((group) => (
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
                        defaultCollapsed={section.key === "other"}
                      />
                    ))}
                  </div>
                </section>
              ) : null
            )}
          </div>
        ) : (
          <EmptyState title="Nessun evento trovato" description="Prova a cambiare data, filtro o ricerca." />
        )}
      </div>
    </div>
  );
}
