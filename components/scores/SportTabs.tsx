"use client";

import type { Sport } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type SportTabValue = Sport | "all";

type SportTabsProps = {
  value: SportTabValue;
  onChange: (value: SportTabValue) => void;
};

const sports: Array<{ label: string; value: SportTabValue }> = [
  { label: "Tutti", value: "all" },
  { label: "Calcio", value: "football" },
  { label: "Tennis", value: "tennis" },
  { label: "Basket", value: "basketball" }
];

export function SportTabs({ value, onChange }: SportTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Filtro sport">
      {sports.map((sport) => (
        <button
          key={sport.value}
          type="button"
          onClick={() => onChange(sport.value)}
          className={cn(
            "min-w-max rounded-full border px-4 py-2 text-sm font-bold transition",
            value === sport.value
              ? "border-pulse-400/40 bg-pulse-400/15 text-pulse-400"
              : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.08]"
          )}
          role="tab"
          aria-selected={value === sport.value}
        >
          {sport.label}
        </button>
      ))}
    </div>
  );
}
