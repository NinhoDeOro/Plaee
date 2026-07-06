"use client";

import { cn } from "@/lib/utils/cn";

export type ScoreboardTab = "all" | "favorites" | "competitions";

type CompetitionTabsProps = {
  value: ScoreboardTab;
  favoritesCount: number;
  onChange: (value: ScoreboardTab) => void;
};

const tabs: Array<{ value: ScoreboardTab; label: string }> = [
  { value: "all", label: "Tutto" },
  { value: "favorites", label: "Preferiti" },
  { value: "competitions", label: "Competizioni" }
];

export function CompetitionTabs({ value, favoritesCount, onChange }: CompetitionTabsProps) {
  return (
    <div className="flex min-w-0 gap-6 overflow-x-auto border-b border-white/10 px-3 scrollbar-hide sm:px-4">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "relative min-w-max px-1 py-4 text-base font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-400/70 sm:text-lg",
            value === tab.value ? "text-court-300" : "text-slate-500 hover:text-white"
          )}
          aria-pressed={value === tab.value}
        >
          {tab.label}
          {tab.value === "favorites" && favoritesCount > 0 ? (
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">{favoritesCount}</span>
          ) : null}
          {value === tab.value ? <span className="absolute inset-x-0 bottom-0 h-1 rounded-t-full bg-court-400" /> : null}
        </button>
      ))}
    </div>
  );
}
