"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import type { SportEvent } from "@/lib/types";
import { TeamMark } from "@/components/ui/TeamMark";
import { TennisMatchRow } from "@/components/scores/TennisMatchRow";
import { formatTime } from "@/lib/utils/date";
import { ScorersLine } from "@/components/scores/ScorersLine";
import { cn } from "@/lib/utils/cn";

type MatchRowProps = {
  event: SportEvent;
};

const FAVORITES_KEY = "plaee:favorites";
const FAVORITES_EVENT = "plaee:favorites-changed";

function readFavorites() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const value = window.localStorage.getItem(FAVORITES_KEY);
    const ids = value ? (JSON.parse(value) as string[]) : [];
    return new Set(ids);
  } catch {
    return new Set<string>();
  }
}

function writeFavorites(ids: Set<string>) {
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(ids)));
  window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
}

function getRowStatus(event: SportEvent) {
  if (event.status === "live") return event.minute ? `${event.minute}'` : "LIVE";
  if (event.status === "finished") return "FT";
  if (event.status === "postponed") return "Rinviata";
  if (event.status === "cancelled") return "Annullata";
  return formatTime(event.startTime);
}

function getScoreValue(value?: string | number) {
  return value === undefined || value === null || value === "" ? "-" : value;
}

function showScorers(event: SportEvent) {
  return event.status === "live" || event.status === "finished";
}

export function MatchRow({ event }: MatchRowProps) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(readFavorites().has(event.id));

    function onFavoritesChanged() {
      setFavorite(readFavorites().has(event.id));
    }

    window.addEventListener(FAVORITES_EVENT, onFavoritesChanged);
    window.addEventListener("storage", onFavoritesChanged);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, onFavoritesChanged);
      window.removeEventListener("storage", onFavoritesChanged);
    };
  }, [event.id]);

  function toggleFavorite() {
    const ids = readFavorites();
    if (ids.has(event.id)) {
      ids.delete(event.id);
      setFavorite(false);
    } else {
      ids.add(event.id);
      setFavorite(true);
    }
    writeFavorites(ids);
  }

  if (event.sport === "formula1") {
    const title = event.raceName ?? event.competition;
    const details = [event.sessionType, event.circuit, event.country].filter(Boolean).join(" · ");

    return (
      <div className="grid max-w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-2 border-t border-white/[0.075] px-2 py-2.5 first:border-t-0 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:px-3">
        <Link href={`/match/${event.id}`} className="text-center" aria-label={`Apri ${title}`}>
          <span
            className={cn(
              "block text-sm font-black leading-tight",
              event.isLive ? "text-red-300" : event.status === "finished" ? "text-slate-500" : "text-slate-300"
            )}
          >
            {getRowStatus(event)}
          </span>
          {event.isLive ? <span className="mt-1 inline-block h-1.5 w-1.5 animate-softPulse rounded-full bg-red-400" aria-hidden /> : null}
        </Link>

        <Link href={`/match/${event.id}`} className="block min-w-0 overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-court-400/70">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded-full border border-flare-400/25 bg-flare-400/10 px-2 py-0.5 text-[11px] font-black uppercase text-flare-300">
              Motori
            </span>
            <span className="truncate text-sm font-black text-white sm:text-base">{title}</span>
          </div>
          {details ? <p className="mt-1 truncate text-xs font-semibold text-slate-400 sm:text-sm">{details}</p> : null}
          {event.winner ? <p className="mt-1 truncate text-xs font-bold text-pulse-300">Vincitore: {event.winner}</p> : null}
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href={`/match/${event.id}`} className="min-w-14 text-right text-xs font-black uppercase text-slate-300 sm:min-w-20">
            {event.isLive ? "LIVE" : event.status === "finished" ? "Finita" : formatTime(event.startTime)}
          </Link>
          <button
            type="button"
            onClick={toggleFavorite}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-400/70 sm:h-10 sm:w-10",
              favorite
                ? "border-flare-400/40 bg-flare-400/15 text-flare-400"
                : "border-white/10 bg-white/[0.035] text-slate-500 hover:border-white/20 hover:text-white"
            )}
            aria-label={favorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
            aria-pressed={favorite}
          >
            <Star className={cn("h-5 w-5", favorite && "fill-current")} aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  if (event.sport === "tennis") {
    return <TennisMatchRow event={event} favorite={favorite} onToggleFavorite={toggleFavorite} />;
  }

  return (
    <div className="grid max-w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-2 border-t border-white/[0.075] px-2 py-2.5 first:border-t-0 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:px-3">
      <Link href={`/match/${event.id}`} className="text-center" aria-label={`Apri ${event.homeName} - ${event.awayName}`}>
        <span
          className={cn(
            "block text-sm font-black leading-tight",
            event.isLive ? "text-red-300" : event.status === "finished" ? "text-slate-500" : "text-slate-300"
          )}
        >
          {getRowStatus(event)}
        </span>
        {event.isLive ? <span className="mt-1 inline-block h-1.5 w-1.5 animate-softPulse rounded-full bg-red-400" aria-hidden /> : null}
      </Link>

      <Link href={`/match/${event.id}`} className="block min-w-0 space-y-1.5 overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-court-400/70">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <TeamMark name={event.homeName} logo={event.homeLogo} />
            <span className="truncate text-sm font-bold text-white sm:text-base">{event.homeName}</span>
          </div>
          {showScorers(event) ? <ScorersLine scorers={event.scorers?.home} className="ml-9" /> : null}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <TeamMark name={event.awayName} logo={event.awayLogo} />
            <span className="truncate text-sm font-bold text-slate-300 sm:text-base">{event.awayName}</span>
          </div>
          {showScorers(event) ? <ScorersLine scorers={event.scorers?.away} className="ml-9" /> : null}
        </div>
      </Link>

      <div className="flex items-center gap-1 sm:gap-2">
        <Link href={`/match/${event.id}`} className="grid w-7 gap-1 text-right text-base font-black text-white sm:w-11">
          <span>{getScoreValue(event.homeScore)}</span>
          <span>{getScoreValue(event.awayScore)}</span>
        </Link>
        <button
          type="button"
          onClick={toggleFavorite}
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-400/70 sm:h-10 sm:w-10",
            favorite
              ? "border-flare-400/40 bg-flare-400/15 text-flare-400"
              : "border-white/10 bg-white/[0.035] text-slate-500 hover:border-white/20 hover:text-white"
          )}
          aria-label={favorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          aria-pressed={favorite}
        >
          <Star className={cn("h-5 w-5", favorite && "fill-current")} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export const favoritesStorageKey = FAVORITES_KEY;
export const favoritesChangedEvent = FAVORITES_EVENT;
