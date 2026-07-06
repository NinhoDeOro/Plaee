"use client";

import { Filter } from "lucide-react";
import type { MatchGroup } from "@/lib/utils/groupMatches";
import type { CompetitionFilterValue } from "@/components/scores/CompetitionSidebar";
import { cn } from "@/lib/utils/cn";

type CompetitionMenuMobileProps = {
  groups: MatchGroup[];
  countries: MatchGroup[];
  value: CompetitionFilterValue;
  countryValue: string;
  featuredCount: number;
  liveCount: number;
  onChange: (value: CompetitionFilterValue) => void;
  onCountryChange: (value: string) => void;
};

export function CompetitionMenuMobile({
  groups,
  countries,
  value,
  countryValue,
  featuredCount,
  liveCount,
  onChange,
  onCountryChange
}: CompetitionMenuMobileProps) {
  const shortcuts = [
    { value: "all", label: "Tutte", count: groups.reduce((sum, group) => sum + group.events.length, 0) },
    { value: "__featured", label: "In evidenza", count: featuredCount },
    { value: "__live", label: "Live", count: liveCount },
    {
      value: "__international",
      label: "Internazionali",
      count: groups.filter((group) => group.isInternational).reduce((sum, group) => sum + group.events.length, 0)
    }
  ];

  return (
    <div className="space-y-3 p-3 sm:p-4 lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {shortcuts.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "min-w-max rounded-full border px-3 py-2 text-sm font-bold transition",
              value === item.value
                ? "border-pulse-400/35 bg-pulse-400/12 text-white"
                : "border-white/10 bg-white/[0.04] text-slate-300"
            )}
          >
            {item.label} · {item.count}
          </button>
        ))}
      </div>

      <details className="rounded-lg border border-white/10 bg-field-900/70 p-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-black text-white">
          <Filter className="h-4 w-4 text-court-300" aria-hidden />
          Filtra competizioni
        </summary>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-2 text-sm font-bold text-slate-300">
            Competizione
            <select
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="rounded-lg border border-white/10 bg-field-950 px-3 py-2 text-white focus:border-pulse-400 focus:ring-pulse-400"
            >
              <option value="all">Tutte</option>
              <option value="__featured">In evidenza</option>
              <option value="__live">Live</option>
              <option value="__international">Mondiali / internazionali</option>
              {groups.map((group) => (
                <option key={group.key} value={`competition:${group.key}`}>
                  {group.title} ({group.events.length})
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-300">
            Nazione
            <select
              value={countryValue}
              onChange={(event) => onCountryChange(event.target.value)}
              className="rounded-lg border border-white/10 bg-field-950 px-3 py-2 text-white focus:border-pulse-400 focus:ring-pulse-400"
            >
              <option value="all">Tutte</option>
              {countries.map((country) => (
                <option key={country.key} value={country.title}>
                  {country.title} ({country.events.length})
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>
    </div>
  );
}
