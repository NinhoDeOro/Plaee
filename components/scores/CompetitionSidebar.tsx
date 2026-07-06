"use client";

import type { ReactNode } from "react";
import { Globe2, Star, Trophy } from "lucide-react";
import type { MatchGroup } from "@/lib/utils/groupMatches";
import { MatchCountBadge } from "@/components/scores/MatchCountBadge";
import { cn } from "@/lib/utils/cn";

export type CompetitionFilterValue = "all" | "__featured" | "__live" | "__international" | string;

type CompetitionSidebarProps = {
  groups: MatchGroup[];
  countries: MatchGroup[];
  value: CompetitionFilterValue;
  countryValue: string;
  featuredCount: number;
  liveCount: number;
  onChange: (value: CompetitionFilterValue) => void;
  onCountryChange: (value: string) => void;
};

function FilterButton({
  active,
  label,
  count,
  icon,
  onClick
}: {
  active: boolean;
  label: string;
  count: number;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm font-bold transition",
        active
          ? "border-pulse-400/35 bg-pulse-400/12 text-white"
          : "border-transparent bg-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <MatchCountBadge count={count} />
    </button>
  );
}

export function CompetitionSidebar({
  groups,
  countries,
  value,
  countryValue,
  featuredCount,
  liveCount,
  onChange,
  onCountryChange
}: CompetitionSidebarProps) {
  const topGroups = groups.filter((group) => group.priority >= 70).slice(0, 10);
  const otherGroups = groups.filter((group) => !topGroups.includes(group));

  return (
    <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-lg border border-white/10 bg-field-900/72 p-3 lg:block">
      <div className="space-y-5">
        <section className="space-y-2">
          <h2 className="px-2 text-xs font-black uppercase text-slate-500">Scorciatoie</h2>
          <FilterButton active={value === "all"} label="Tutte" count={groups.reduce((sum, group) => sum + group.events.length, 0)} onClick={() => onChange("all")} />
          <FilterButton active={value === "__featured"} label="In evidenza" count={featuredCount} icon={<Star className="h-4 w-4" aria-hidden />} onClick={() => onChange("__featured")} />
          <FilterButton active={value === "__live"} label="Live" count={liveCount} onClick={() => onChange("__live")} />
          <FilterButton active={value === "__international"} label="Internazionali" count={groups.filter((group) => group.isInternational).reduce((sum, group) => sum + group.events.length, 0)} icon={<Globe2 className="h-4 w-4" aria-hidden />} onClick={() => onChange("__international")} />
        </section>

        {topGroups.length ? (
          <section className="space-y-2">
            <h2 className="px-2 text-xs font-black uppercase text-slate-500">Competizioni principali</h2>
            {topGroups.map((group) => (
              <FilterButton
                key={group.key}
                active={value === `competition:${group.key}`}
                label={group.title}
                count={group.events.length}
                icon={<Trophy className="h-4 w-4" aria-hidden />}
                onClick={() => onChange(`competition:${group.key}`)}
              />
            ))}
          </section>
        ) : null}

        {countries.length ? (
          <section className="space-y-2">
            <h2 className="px-2 text-xs font-black uppercase text-slate-500">Nazioni</h2>
            <FilterButton active={countryValue === "all"} label="Tutte" count={groups.reduce((sum, group) => sum + group.events.length, 0)} onClick={() => onCountryChange("all")} />
            {countries.slice(0, 12).map((country) => (
              <FilterButton
                key={country.key}
                active={countryValue === country.title}
                label={country.title}
                count={country.events.length}
                onClick={() => onCountryChange(country.title)}
              />
            ))}
          </section>
        ) : null}

        {otherGroups.length ? (
          <section className="space-y-2">
            <h2 className="px-2 text-xs font-black uppercase text-slate-500">Tutte le competizioni</h2>
            {otherGroups.map((group) => (
              <FilterButton
                key={group.key}
                active={value === `competition:${group.key}`}
                label={group.title}
                count={group.events.length}
                onClick={() => onChange(`competition:${group.key}`)}
              />
            ))}
          </section>
        ) : null}
      </div>
    </aside>
  );
}
