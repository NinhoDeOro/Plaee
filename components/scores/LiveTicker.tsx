import Link from "next/link";
import type { SportEvent } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";

type LiveTickerProps = {
  events: SportEvent[];
};

export function LiveTicker({ events }: LiveTickerProps) {
  const liveEvents = events.filter((event) => event.isLive);

  if (!liveEvents.length) return null;

  return (
    <section aria-labelledby="live-now-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="live-now-title" className="text-lg font-black text-white">Live ora</h2>
        <Link href="/live" className="text-sm font-bold text-pulse-400 hover:text-pulse-300">
          Vedi tutti
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {liveEvents.map((event) => (
          <Link
            key={event.id}
            href={`/match/${event.id}`}
            className="min-w-64 rounded-lg border border-red-400/20 bg-red-500/[0.08] p-3 transition hover:border-red-300/40"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <StatusBadge status={event.status} label={event.statusLabel} />
              <ScoreDisplay event={event} />
            </div>
            <p className="truncate text-sm font-bold text-white">{event.homeName}</p>
            <p className="truncate text-sm font-bold text-white">{event.awayName}</p>
            <p className="mt-2 truncate text-xs font-semibold text-slate-400">{event.competition}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
