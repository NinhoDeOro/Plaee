"use client";

import type { SportEvent } from "@/lib/types";
import type { TennisFilterValue } from "@/lib/utils/tennisClassification";
import { tennisFilterMatches } from "@/lib/utils/tennisClassification";
import { MatchCountBadge } from "@/components/scores/MatchCountBadge";
import { cn } from "@/lib/utils/cn";

type TennisFiltersProps = {
  events: SportEvent[];
  value: TennisFilterValue;
  onChange: (value: TennisFilterValue) => void;
};

const options: Array<{ value: TennisFilterValue; label: string }> = [
  { value: "all", label: "Tutto" },
  { value: "singles", label: "Singolare" },
  { value: "doubles", label: "Doppio" },
  { value: "men", label: "Maschile" },
  { value: "women", label: "Femminile" },
  { value: "men-singles", label: "Singolare maschile" },
  { value: "women-singles", label: "Singolare femminile" },
  { value: "men-doubles", label: "Doppio maschile" },
  { value: "women-doubles", label: "Doppio femminile" },
  { value: "mixed-doubles", label: "Doppio misto" },
  { value: "juniors", label: "Juniors" }
];

export function TennisFilters({ events, value, onChange }: TennisFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-field-900/72 p-3 scrollbar-hide" aria-label="Filtri tennis">
      {options.map((item) => {
        const count = events.filter((event) => tennisFilterMatches(event, item.value)).length;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex min-w-max items-center gap-2 rounded-full border px-3 py-2 text-sm font-black transition",
              value === item.value
                ? "border-court-300/40 bg-court-400/14 text-court-100"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white"
            )}
          >
            {item.label}
            <MatchCountBadge count={count} />
          </button>
        );
      })}
    </div>
  );
}
