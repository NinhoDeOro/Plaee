"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { SportEvent, TennisSetScore } from "@/lib/types";
import { TeamMark } from "@/components/ui/TeamMark";
import { formatTime } from "@/lib/utils/date";
import { tennisTotalLabel } from "@/lib/utils/tennisScore";
import { cn } from "@/lib/utils/cn";

type TennisMatchRowProps = {
  event: SportEvent;
  favorite: boolean;
  onToggleFavorite: () => void;
};

function statusLabel(event: SportEvent) {
  if (event.status === "finished") return "FT";
  if (event.status === "scheduled") return "-";
  if (event.status === "postponed") return "Post.";
  if (event.status === "cancelled") return "Ann.";
  return event.tennisScore?.statusLabel ?? event.statusLabel ?? "Live";
}

function scoreValue(value: TennisSetScore["home"]) {
  return value === undefined || value === null || value === "" ? "" : String(value);
}

function SetCell({
  value,
  tiebreak,
  winner
}: {
  value: TennisSetScore["home"];
  tiebreak?: TennisSetScore["homeTiebreak"];
  winner?: boolean;
}) {
  return (
    <span className={cn("min-w-6 text-center font-black tabular-nums", winner ? "text-white" : "text-slate-400")}>
      {scoreValue(value)}
      {tiebreak !== undefined && tiebreak !== null && tiebreak !== "" ? (
        <sup className="ml-0.5 text-[9px] text-court-300">{tiebreak}</sup>
      ) : null}
    </span>
  );
}

function PlayerName({
  name,
  logo,
  serving,
  winner
}: {
  name: string;
  logo?: string;
  serving: boolean;
  winner: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <TeamMark name={name} logo={logo} />
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          serving ? "bg-flare-300 shadow-[0_0_10px_rgba(255,203,92,0.45)]" : "bg-transparent"
        )}
        aria-label={serving ? "Al servizio" : undefined}
      />
      <span className={cn("truncate text-sm sm:text-base", winner ? "font-black text-white" : "font-bold text-slate-300")}>
        {name}
      </span>
    </span>
  );
}

export function TennisMatchRow({ event, favorite, onToggleFavorite }: TennisMatchRowProps) {
  const score = event.tennisScore;
  const sets = score?.sets ?? [];
  const homeTotal = tennisTotalLabel(score, "home");
  const awayTotal = tennisTotalLabel(score, "away");
  const homeTotalNumber = Number(homeTotal);
  const awayTotalNumber = Number(awayTotal);
  const homeWinner = event.status === "finished" && Number.isFinite(homeTotalNumber) && homeTotalNumber > awayTotalNumber;
  const awayWinner = event.status === "finished" && Number.isFinite(awayTotalNumber) && awayTotalNumber > homeTotalNumber;
  const hasPoint = score?.currentPointHome !== null && score?.currentPointHome !== undefined && score?.currentPointAway !== null && score?.currentPointAway !== undefined && event.status === "live";

  return (
    <div className="grid max-w-full grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-2 border-t border-white/[0.075] px-2 py-2.5 first:border-t-0 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:px-3">
      <Link href={`/match/${event.id}`} className="text-center" aria-label={`Apri ${event.homeName} - ${event.awayName}`}>
        <span className="block text-xs font-bold leading-tight text-slate-500 sm:text-sm">{formatTime(event.startTime)}</span>
        <span
          className={cn(
            "mt-1 block text-xs font-black leading-tight",
            event.isLive ? "text-red-300" : event.status === "finished" ? "text-slate-400" : "text-slate-500"
          )}
        >
          {statusLabel(event)}
        </span>
      </Link>

      <Link
        href={`/match/${event.id}`}
        className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(118px,max-content)] items-center gap-2 overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-court-400/70 sm:grid-cols-[minmax(0,1fr)_minmax(178px,max-content)]"
      >
        <div className="min-w-0 space-y-2">
          <PlayerName name={event.homeName} logo={event.homeLogo} serving={score?.servingPlayer === "home"} winner={homeWinner} />
          <PlayerName name={event.awayName} logo={event.awayLogo} serving={score?.servingPlayer === "away"} winner={awayWinner} />
        </div>

        <div className="max-w-full overflow-x-auto scrollbar-hide">
          {sets.length || hasPoint || homeTotal !== "-" || awayTotal !== "-" ? (
            <div
              className="grid min-w-max grid-rows-2 gap-y-2 text-sm"
              style={{
                gridTemplateColumns: `repeat(${sets.length}, minmax(24px, auto)) ${hasPoint ? "minmax(34px, auto) " : ""}minmax(26px, auto)`
              }}
            >
              {sets.map((set, index) => (
                <SetCell key={`home-${index}`} value={set.home} tiebreak={set.homeTiebreak} winner={homeWinner} />
              ))}
              {hasPoint ? (
                <span className="min-w-8 rounded bg-red-400/10 px-1 text-center font-black tabular-nums text-red-200">
                  {score?.currentPointHome}
                </span>
              ) : null}
              <span className={cn("min-w-7 text-center text-base font-black tabular-nums", homeWinner ? "text-court-200" : "text-white")}>
                {homeTotal}
              </span>

              {sets.map((set, index) => (
                <SetCell key={`away-${index}`} value={set.away} tiebreak={set.awayTiebreak} winner={awayWinner} />
              ))}
              {hasPoint ? (
                <span className="min-w-8 rounded bg-red-400/10 px-1 text-center font-black tabular-nums text-red-200">
                  {score?.currentPointAway}
                </span>
              ) : null}
              <span className={cn("min-w-7 text-center text-base font-black tabular-nums", awayWinner ? "text-court-200" : "text-white")}>
                {awayTotal}
              </span>
            </div>
          ) : (
            <div className="text-right text-sm font-black text-slate-500">VS</div>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={onToggleFavorite}
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
  );
}
