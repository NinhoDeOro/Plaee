"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { CompetitionGroup } from "@/components/scores/CompetitionGroup";
import { MatchSectionHeader } from "@/components/scores/MatchSectionHeader";
import type { LiveSportsResponse } from "@/lib/providers/sports/liveSportsProvider";
import { groupMatchesByCompetition } from "@/lib/utils/groupMatches";
import { cn } from "@/lib/utils/cn";

type LiveScoresClientProps = {
  initialLive: LiveSportsResponse;
  refreshIntervalMs?: number;
};

const SPORT_SECTIONS: Array<{ key: keyof LiveSportsResponse; title: string }> = [
  { key: "football", title: "Calcio" },
  { key: "tennis", title: "Tennis" },
  { key: "basketball", title: "Basket" },
  { key: "formula1", title: "Motori" }
];

function totalLive(live: LiveSportsResponse) {
  return SPORT_SECTIONS.reduce((total, section) => total + live[section.key].length, 0);
}

export function LiveScoresClient({ initialLive, refreshIntervalMs = 30000 }: LiveScoresClientProps) {
  const [live, setLive] = useState(initialLive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const total = useMemo(() => totalLive(live), [live]);
  const intervalLabel =
    refreshIntervalMs >= 60000 ? `${Math.round(refreshIntervalMs / 60000)} min` : `${Math.round(refreshIntervalMs / 1000)} sec`;
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/live", { signal });
      if (!response.ok) throw new Error("Live request failed");
      const data = (await response.json()) as LiveSportsResponse;
      setLive(data);
      setLastUpdated(new Date());
    } catch (refreshError) {
      if (!(refreshError instanceof DOMException && refreshError.name === "AbortError")) {
        setError("Impossibile aggiornare ora");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    let timer: number | undefined;

    function clearTimer() {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    }

    function startTimer() {
      clearTimer();
      if (document.hidden) return;
      timer = window.setInterval(() => refresh(controller.signal), refreshIntervalMs);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        clearTimer();
        return;
      }
      void refresh(controller.signal);
      startTimer();
    }

    startTimer();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearTimer();
      controller.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh, refreshIntervalMs]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-field-900/70 px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase text-red-300">Aggiornamento live</p>
          <p className="text-sm text-slate-400">
            Ogni {intervalLabel} · Ultimo controllo{" "}
            {lastUpdated.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh(controllerRef.current?.signal)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white transition hover:bg-white/[0.08]"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
          Aggiorna
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-flare-400/20 bg-flare-400/10 px-4 py-3 text-sm font-semibold text-flare-200">
          Aggiornamento non riuscito: mostro gli ultimi dati disponibili.
        </p>
      ) : null}

      {loading && !total ? <LoadingSkeleton /> : null}

      {total ? (
        SPORT_SECTIONS.map((section) => {
          const events = live[section.key];
          const groups = groupMatchesByCompetition(events, { sportPage: true });

          return (
            <section key={section.key} className="space-y-3">
              <MatchSectionHeader title={section.title} count={events.length} />
              {events.length ? (
                <div className="space-y-3">
                  {groups.map((group) => (
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
                <EmptyState title={`Nessun evento live per ${section.title}.`} />
              )}
            </section>
          );
        })
      ) : !loading ? (
        <EmptyState title="Nessun evento live in questo momento." />
      ) : null}
    </div>
  );
}
