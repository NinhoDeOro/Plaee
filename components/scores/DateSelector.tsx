"use client";

import { CalendarDays } from "lucide-react";
import { getRelativeDateOptions } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

type DateSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function DateSelector({ value, onChange }: DateSelectorProps) {
  const options = getRelativeDateOptions();

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide" aria-label="Filtro data">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300">
        <CalendarDays className="h-4 w-4" aria-hidden />
      </span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "min-w-20 rounded-full border px-4 py-2 text-sm font-bold transition",
            value === option.value
              ? "border-court-400/40 bg-court-500/15 text-court-400"
              : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.08]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
