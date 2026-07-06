"use client";

import { Filter, Trophy } from "lucide-react";
import type { SportEvent } from "@/lib/types";
import type { CompetitionFilterValue } from "@/components/scores/CompetitionSidebar";
import { MatchCountBadge } from "@/components/scores/MatchCountBadge";
import {
  compareTennisEvents,
  getTennisSidebarBucket,
  getTennisSidebarEntryKey,
  getTennisSidebarEntryLabel
} from "@/lib/utils/tennisClassification";
import { cn } from "@/lib/utils/cn";

type TennisSidebarProps = {
  events: SportEvent[];
  value: CompetitionFilterValue;
  onChange: (value: CompetitionFilterValue) => void;
};

const BUCKETS = ["Grand Slam", "ATP", "WTA", "Challenger", "ITF", "Juniors", "Altri"] as const;

type TennisSidebarEntry = {
  key: string;
  label: string;
  bucket: (typeof BUCKETS)[number];
  events: SportEvent[];
  sortEvent: SportEvent;
};

function buildEntries(events: SportEvent[]) {
  const entries = new Map<string, TennisSidebarEntry>();

  for (const event of events) {
    const key = getTennisSidebarEntryKey(event);
    const bucket = getTennisSidebarBucket(event) as (typeof BUCKETS)[number];
    const current = entries.get(key);

    if (current) {
      current.events.push(event);
      current.events.sort(compareTennisEvents);
      current.sortEvent = current.events[0];
    } else {
      entries.set(key, {
        key,
        label: getTennisSidebarEntryLabel(event),
        bucket,
        events: [event],
        sortEvent: event
      });
    }
  }

  return Array.from(entries.values()).sort((a, b) => {
    const bucketDiff = BUCKETS.indexOf(a.bucket) - BUCKETS.indexOf(b.bucket);
    if (bucketDiff !== 0) return bucketDiff;
    const tennisDiff = compareTennisEvents(a.sortEvent, b.sortEvent);
    if (tennisDiff !== 0) return tennisDiff;
    return a.label.localeCompare(b.label, "it");
  });
}

function total(entries: TennisSidebarEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.events.length, 0);
}

function FilterButton({
  active,
  label,
  count,
  onClick
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm font-bold transition",
        active
          ? "border-court-300/35 bg-court-400/12 text-white"
          : "border-transparent bg-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Trophy className="h-4 w-4 shrink-0 text-court-300" aria-hidden />
        <span className="truncate">{label}</span>
      </span>
      <MatchCountBadge count={count} />
    </button>
  );
}

export function TennisSidebar({ events, value, onChange }: TennisSidebarProps) {
  const entries = buildEntries(events);
  const byBucket = BUCKETS.map((bucket) => ({
    bucket,
    entries: entries.filter((entry) => entry.bucket === bucket)
  })).filter((section) => section.entries.length);

  return (
    <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-lg border border-white/10 bg-field-900/72 p-3 lg:block">
      <div className="space-y-5">
        <section className="space-y-2">
          <h2 className="px-2 text-xs font-black uppercase text-slate-500">Tennis</h2>
          <FilterButton active={value === "all"} label="Tutti i tornei" count={total(entries)} onClick={() => onChange("all")} />
        </section>

        {byBucket.map((section) => (
          <section key={section.bucket} className="space-y-2">
            <h2 className="px-2 text-xs font-black uppercase text-slate-500">{section.bucket}</h2>
            {section.entries.map((entry) => (
              <FilterButton
                key={entry.key}
                active={value === `tennis:${entry.key}`}
                label={entry.label}
                count={entry.events.length}
                onClick={() => onChange(`tennis:${entry.key}`)}
              />
            ))}
          </section>
        ))}
      </div>
    </aside>
  );
}

export function TennisCompetitionMenuMobile({ events, value, onChange }: TennisSidebarProps) {
  const entries = buildEntries(events);
  const byBucket = BUCKETS.map((bucket) => ({
    bucket,
    entries: entries.filter((entry) => entry.bucket === bucket)
  })).filter((section) => section.entries.length);

  return (
    <div className="space-y-3 p-3 sm:p-4 lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => onChange("all")}
          className={cn(
            "min-w-max rounded-full border px-3 py-2 text-sm font-bold transition",
            value === "all"
              ? "border-court-300/35 bg-court-400/12 text-white"
              : "border-white/10 bg-white/[0.04] text-slate-300"
          )}
        >
          Tutti i tornei · {total(entries)}
        </button>
        {entries.slice(0, 12).map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => onChange(`tennis:${entry.key}`)}
            className={cn(
              "min-w-max rounded-full border px-3 py-2 text-sm font-bold transition",
              value === `tennis:${entry.key}`
                ? "border-court-300/35 bg-court-400/12 text-white"
                : "border-white/10 bg-white/[0.04] text-slate-300"
            )}
          >
            {entry.label} · {entry.events.length}
          </button>
        ))}
      </div>

      <details className="rounded-lg border border-white/10 bg-field-900/70 p-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-black text-white">
          <Filter className="h-4 w-4 text-court-300" aria-hidden />
          Filtra tornei
        </summary>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-2 text-sm font-bold text-slate-300">
            Torneo
            <select
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="rounded-lg border border-white/10 bg-field-950 px-3 py-2 text-white focus:border-court-400 focus:ring-court-400"
            >
              <option value="all">Tutti i tornei ({total(entries)})</option>
              {byBucket.map((section) => (
                <optgroup key={section.bucket} label={section.bucket}>
                  {section.entries.map((entry) => (
                    <option key={entry.key} value={`tennis:${entry.key}`}>
                      {entry.label} ({entry.events.length})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
      </details>
    </div>
  );
}
