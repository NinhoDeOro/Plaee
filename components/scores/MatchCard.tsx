import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import type { SportEvent } from "@/lib/types";
import { formatTime } from "@/lib/utils/date";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { TeamMark } from "@/components/ui/TeamMark";
import { PriorityBadge } from "@/components/scores/PriorityBadge";
import { ScorersLine } from "@/components/scores/ScorersLine";

type MatchCardProps = {
  event: SportEvent;
};

export function MatchCard({ event }: MatchCardProps) {
  const showScorers = event.status === "live" || event.status === "finished";

  return (
    <Link
      href={`/match/${event.id}`}
      className="group block rounded-lg border border-white/10 bg-white/[0.045] p-3 transition hover:border-pulse-400/30 hover:bg-white/[0.07] hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={event.status} label={event.statusLabel} />
            <PriorityBadge event={event} />
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatTime(event.startTime)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <TeamMark name={event.homeName} logo={event.homeLogo} />
                <span className="truncate font-bold text-white">{event.homeName}</span>
              </div>
              {showScorers ? <ScorersLine scorers={event.scorers?.home} className="ml-9" /> : null}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <TeamMark name={event.awayName} logo={event.awayLogo} />
                <span className="truncate font-bold text-white">{event.awayName}</span>
              </div>
              {showScorers ? <ScorersLine scorers={event.scorers?.away} className="ml-9" /> : null}
            </div>
          </div>
        </div>

        <ScoreDisplay event={event} />
      </div>

      {event.venue ? (
        <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          <span className="truncate">{event.venue}</span>
        </div>
      ) : null}
    </Link>
  );
}
