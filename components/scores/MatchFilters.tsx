"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MatchCountBadge } from "@/components/scores/MatchCountBadge";

export type MatchStatusFilter = "all" | "live" | "scheduled" | "finished";
export type MatchGenderFilter = "all" | "men" | "women" | "mixed";

type MatchFiltersProps = {
  status: MatchStatusFilter;
  gender: MatchGenderFilter;
  query: string;
  counts: {
    all: number;
    live: number;
    scheduled: number;
    finished: number;
  };
  genderCounts: {
    men: number;
    women: number;
    mixed: number;
  };
  onStatusChange: (value: MatchStatusFilter) => void;
  onGenderChange: (value: MatchGenderFilter) => void;
  onQueryChange: (value: string) => void;
  showGenderFilters?: boolean;
};

const statusOptions: Array<{ value: MatchStatusFilter; label: string }> = [
  { value: "all", label: "Tutte" },
  { value: "live", label: "Live" },
  { value: "scheduled", label: "Programmate" },
  { value: "finished", label: "Concluse" }
];

const genderOptions: Array<{ value: MatchGenderFilter; label: string }> = [
  { value: "all", label: "Tutte" },
  { value: "men", label: "Maschile" },
  { value: "women", label: "Femminile" },
  { value: "mixed", label: "Misto" }
];

export function MatchFilters({
  status,
  gender,
  query,
  counts,
  genderCounts,
  onStatusChange,
  onGenderChange,
  onQueryChange,
  showGenderFilters = true
}: MatchFiltersProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-field-900/70 p-3 sm:p-4">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Cerca squadra, torneo o paese"
          className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-pulse-400/50 focus:ring-2 focus:ring-pulse-400/20"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide" aria-label="Filtro stato partita">
        {statusOptions.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onStatusChange(item.value)}
            className={cn(
              "inline-flex min-w-max items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition",
              status === item.value
                ? "border-red-400/35 bg-red-400/12 text-red-200"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20"
            )}
          >
            {item.label}
            <MatchCountBadge count={counts[item.value]} />
          </button>
        ))}
      </div>

      {showGenderFilters ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" aria-label="Filtro categoria">
          {genderOptions.map((item) => {
            const count = item.value === "all" ? counts.all : genderCounts[item.value];

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onGenderChange(item.value)}
                className={cn(
                  "inline-flex min-w-max items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition",
                  gender === item.value
                    ? "border-court-400/35 bg-court-400/12 text-court-200"
                    : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20"
                )}
              >
                {item.label}
                <MatchCountBadge count={count} />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
