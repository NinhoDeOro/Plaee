import type { SportEvent, TennisSetScore } from "@/lib/types";
import { tennisTotalLabel } from "@/lib/utils/tennisScore";
import { cn } from "@/lib/utils/cn";

type TennisScoreSummaryProps = {
  event: SportEvent;
};

function valueLabel(value: TennisSetScore["home"]) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function Cell({
  value,
  tiebreak,
  strong
}: {
  value: TennisSetScore["home"];
  tiebreak?: TennisSetScore["homeTiebreak"];
  strong?: boolean;
}) {
  return (
    <span className={cn("min-w-8 text-center text-lg font-black tabular-nums", strong ? "text-white" : "text-slate-400")}>
      {valueLabel(value)}
      {tiebreak !== undefined && tiebreak !== null && tiebreak !== "" ? (
        <sup className="ml-0.5 text-[10px] text-court-300">{tiebreak}</sup>
      ) : null}
    </span>
  );
}

export function TennisScoreSummary({ event }: TennisScoreSummaryProps) {
  const score = event.tennisScore;
  const sets = score?.sets ?? [];
  const homeTotal = tennisTotalLabel(score, "home");
  const awayTotal = tennisTotalLabel(score, "away");
  const homeWinner = event.status === "finished" && Number(homeTotal) > Number(awayTotal);
  const awayWinner = event.status === "finished" && Number(awayTotal) > Number(homeTotal);
  const hasPoint = event.status === "live" && score?.currentPointHome !== null && score?.currentPointHome !== undefined && score?.currentPointAway !== null && score?.currentPointAway !== undefined;

  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-white/10 bg-white/[0.04] p-3 scrollbar-hide">
      <div
        className="grid min-w-max items-center gap-x-3 gap-y-2"
        style={{
          gridTemplateColumns: `minmax(180px,1fr) repeat(${sets.length}, minmax(32px, auto)) ${hasPoint ? "minmax(44px, auto) " : ""}minmax(36px, auto)`
        }}
      >
        <span className="text-xs font-black uppercase text-slate-500">Giocatore</span>
        {sets.map((_, index) => (
          <span key={`h-${index}`} className="text-center text-xs font-black uppercase text-slate-500">
            S{index + 1}
          </span>
        ))}
        {hasPoint ? <span className="text-center text-xs font-black uppercase text-red-300">Pt</span> : null}
        <span className="text-center text-xs font-black uppercase text-slate-500">Set</span>

        <span className={cn("truncate text-base font-black", homeWinner ? "text-white" : "text-slate-300")}>{event.homeName}</span>
        {sets.map((set, index) => (
          <Cell key={`home-${index}`} value={set.home} tiebreak={set.homeTiebreak} strong={homeWinner} />
        ))}
        {hasPoint ? <span className="rounded bg-red-400/10 px-2 text-center text-lg font-black text-red-200">{score?.currentPointHome}</span> : null}
        <span className={cn("text-center text-xl font-black tabular-nums", homeWinner ? "text-court-200" : "text-white")}>{homeTotal}</span>

        <span className={cn("truncate text-base font-black", awayWinner ? "text-white" : "text-slate-300")}>{event.awayName}</span>
        {sets.map((set, index) => (
          <Cell key={`away-${index}`} value={set.away} tiebreak={set.awayTiebreak} strong={awayWinner} />
        ))}
        {hasPoint ? <span className="rounded bg-red-400/10 px-2 text-center text-lg font-black text-red-200">{score?.currentPointAway}</span> : null}
        <span className={cn("text-center text-xl font-black tabular-nums", awayWinner ? "text-court-200" : "text-white")}>{awayTotal}</span>
      </div>
    </div>
  );
}
