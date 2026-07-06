"use client";

import { Globe2, Star, Trophy } from "lucide-react";
import type { MatchGroup } from "@/lib/utils/groupMatches";
import type { CompetitionFilterValue } from "@/components/scores/CompetitionSidebar";
import { MatchCountBadge } from "@/components/scores/MatchCountBadge";
import { cn } from "@/lib/utils/cn";

type CompetitionFilterPanelProps = {
  groups: MatchGroup[];
  countries: MatchGroup[];
  value: CompetitionFilterValue;
  countryValue: string;
  featuredCount: number;
  liveCount: number;
  onChange: (value: CompetitionFilterValue) => void;
  onCountryChange: (value: string) => void;
};

type FilterItem = {
  value: CompetitionFilterValue;
  label: string;
  count: number;
  icon?: "star" | "globe" | "trophy";
};

function iconFor(value?: FilterItem["icon"]) {
  if (value === "star") return <Star className="h-4 w-4" aria-hidden />;
  if (value === "globe") return <Globe2 className="h-4 w-4" aria-hidden />;
  if (value === "trophy") return <Trophy className="h-4 w-4" aria-hidden />;
  return null;
}

function FilterButton({
  active,
  item,
  onClick
}: {
  active: boolean;
  item: FilterItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-400/70",
        active
          ? "border-court-400/35 bg-court-400/12 text-white"
          : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {iconFor(item.icon)}
        <span className="truncate">{item.label}</span>
      </span>
      <MatchCountBadge count={item.count} />
    </button>
  );
}

export function CompetitionFilterPanel({
  groups,
  countries,
  value,
  countryValue,
  featuredCount,
  liveCount,
  onChange,
  onCountryChange
}: CompetitionFilterPanelProps) {
  const total = groups.reduce((sum, group) => sum + group.events.length, 0);
  const topGroups = groups.filter((group) => group.priority >= 70).slice(0, 12);
  const allCompetitionGroups = groups.filter((group) => !topGroups.includes(group));
  const shortcuts: FilterItem[] = [
    { value: "all", label: "Tutte", count: total },
    { value: "__featured", label: "In evidenza", count: featuredCount, icon: "star" },
    { value: "__live", label: "Live", count: liveCount },
    {
      value: "__international",
      label: "Mondiali / internazionali",
      count: groups.filter((group) => group.isInternational).reduce((sum, group) => sum + group.events.length, 0),
      icon: "globe"
    }
  ];

  return (
    <div className="grid gap-4 border-b border-white/10 bg-field-950/25 p-3 sm:p-4">
      <section className="grid gap-2">
        <h3 className="text-xs font-black uppercase text-slate-500">Scorciatoie</h3>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((item) => (
            <FilterButton
              key={item.value}
              active={value === item.value && countryValue === "all"}
              item={item}
              onClick={() => {
                onCountryChange("all");
                onChange(item.value);
              }}
            />
          ))}
        </div>
      </section>

      {topGroups.length ? (
        <section className="grid gap-2">
          <h3 className="text-xs font-black uppercase text-slate-500">Competizioni principali</h3>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {topGroups.map((group) => {
              const item = {
                value: `competition:${group.key}`,
                label: group.title,
                count: group.events.length,
                icon: "trophy" as const
              };
              return (
                <FilterButton
                  key={group.key}
                  active={value === item.value}
                  item={item}
                  onClick={() => {
                    onCountryChange("all");
                    onChange(item.value);
                  }}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {countries.length ? (
        <section className="grid gap-2">
          <h3 className="text-xs font-black uppercase text-slate-500">Nazioni</h3>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => onCountryChange("all")}
              className={cn(
                "min-w-max rounded-full border px-3 py-2 text-sm font-bold transition",
                countryValue === "all"
                  ? "border-pulse-400/35 bg-pulse-400/12 text-white"
                  : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20"
              )}
            >
              Tutte
            </button>
            {countries.map((country) => (
              <button
                key={country.key}
                type="button"
                onClick={() => {
                  onChange("all");
                  onCountryChange(country.title);
                }}
                className={cn(
                  "inline-flex min-w-max items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition",
                  countryValue === country.title
                    ? "border-pulse-400/35 bg-pulse-400/12 text-white"
                    : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/20"
                )}
              >
                {country.title}
                <MatchCountBadge count={country.events.length} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {allCompetitionGroups.length ? (
        <details className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
          <summary className="cursor-pointer list-none text-sm font-black text-white">
            Tutte le competizioni
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {allCompetitionGroups.map((group) => {
              const item = {
                value: `competition:${group.key}`,
                label: group.title,
                count: group.events.length
              };
              return (
                <FilterButton
                  key={group.key}
                  active={value === item.value}
                  item={item}
                  onClick={() => {
                    onCountryChange("all");
                    onChange(item.value);
                  }}
                />
              );
            })}
          </div>
        </details>
      ) : null}
    </div>
  );
}
