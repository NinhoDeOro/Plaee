import Link from "next/link";
import { Clock, Trophy } from "lucide-react";
import type { SportEvent } from "@/lib/types";
import { formatTime } from "@/lib/utils/date";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TeamMark } from "@/components/ui/TeamMark";
import { MatchSectionHeader } from "@/components/scores/MatchSectionHeader";
import { PriorityBadge } from "@/components/scores/PriorityBadge";

type FeaturedMatchesProps = {
  events: SportEvent[];
};

export function FeaturedMatches({ events }: FeaturedMatchesProps) {
  if (!events.length) return null;

  return (
    <section aria-labelledby="featured-matches-title" className="space-y-3">
      <MatchSectionHeader
        title="In evidenza"
        count={events.length}
        description="Partite live, tornei top e gare in arrivo."
      />
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/match/${event.id}`}
            className="min-w-[280px] max-w-[320px] flex-1 rounded-lg border border-court-400/20 bg-[linear-gradient(135deg,rgba(57,255,174,0.11),rgba(71,197,255,0.08)_48%,rgba(255,203,92,0.10))] p-3 transition hover:border-court-300/40 hover:shadow-glow"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-field-950/75 text-flare-300">
                    <Trophy className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black uppercase text-white">{event.competition}</p>
                    <p className="truncate text-xs text-slate-400">{event.country ?? event.category ?? event.sport}</p>
                  </div>
                </div>
              </div>
              <PriorityBadge event={event} />
            </div>

            <div className="mb-3 flex items-center justify-between gap-3">
              <StatusBadge status={event.status} label={event.statusLabel} />
              <span className="flex items-center gap-1 text-xs font-bold text-slate-300">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {formatTime(event.startTime)}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 items-center gap-2">
                  <TeamMark name={event.homeName} logo={event.homeLogo} />
                  <span className="truncate font-black text-white">{event.homeName}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <TeamMark name={event.awayName} logo={event.awayLogo} />
                  <span className="truncate font-black text-white">{event.awayName}</span>
                </div>
              </div>
              <ScoreDisplay event={event} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
