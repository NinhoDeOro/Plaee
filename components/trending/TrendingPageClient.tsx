"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Sport, SportEvent } from "@/lib/types";
import { CompetitionGroup } from "@/components/scores/CompetitionGroup";
import { DateSelector } from "@/components/scores/DateSelector";
import { MatchSectionHeader } from "@/components/scores/MatchSectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { groupMatchesByCompetition } from "@/lib/utils/groupMatches";
import { TRENDING_SPORT_ORDER } from "@/lib/utils/eventImportance";
import { getSportLabel } from "@/lib/utils/sports";

type TrendingPageClientProps = {
  initialEvents: SportEvent[];
  initialDate?: string;
};

function sportDescription(sport: Sport) {
  if (sport === "football") return "Partite più rilevanti tra tornei internazionali e campionati principali.";
  if (sport === "tennis") return "Match di tornei ATP, WTA, Slam e incontri con priorità alta.";
  if (sport === "basketball") return "Gare principali da NBA, Eurolega e competizioni più seguite.";
  if (sport === "formula1") return "Sessioni, qualifiche, sprint e gare più importanti del giorno.";
  return undefined;
}

export function TrendingPageClient({ initialEvents, initialDate = "today" }: TrendingPageClientProps) {
  const [date, setDate] = useState(initialDate);
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(false);
  const didHydrate = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function refresh() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ sport: "trending", date });
        const response = await fetch(`/api/scores?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Trending request failed");
        setEvents((await response.json()) as SportEvent[]);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.warn("Plaee trending refresh failed", error);
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
  }, [date, initialEvents]);

  const sections = useMemo(
    () =>
      TRENDING_SPORT_ORDER.map((sport) => {
        const sportEvents = events.filter((event) => event.sport === sport);
        return {
          sport,
          label: getSportLabel(sport),
          events: sportEvents,
          groups: groupMatchesByCompetition(sportEvents)
        };
      }),
    [events]
  );

  return (
    <div className="space-y-5">
      <DateSelector value={date} onChange={setDate} />

      {loading ? <LoadingSkeleton /> : null}

      <div className="grid gap-5">
        {sections.map((section) => (
          <section
            key={section.sport}
            className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-field-900/86 p-3 shadow-glow sm:p-4"
          >
            <MatchSectionHeader
              title={section.label}
              count={section.events.length}
              description={sportDescription(section.sport)}
            />

            {section.groups.length ? (
              <div className="mt-4 space-y-3">
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
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title={`Nessun evento trending per ${section.label}`}
                  description="Se la API reale non ha eventi importanti per questa data, Plaee non aggiunge placeholder."
                />
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
