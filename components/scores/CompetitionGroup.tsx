"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown, Globe2 } from "lucide-react";
import type { SportEvent } from "@/lib/types";
import { MatchRow } from "@/components/scores/MatchRow";
import { MatchCountBadge } from "@/components/scores/MatchCountBadge";
import { cn } from "@/lib/utils/cn";

type CompetitionGroupProps = {
  competition: string;
  country?: string;
  countryCode?: string;
  countryFlag?: string;
  leagueLogo?: string;
  category?: string;
  gender?: SportEvent["gender"];
  events: SportEvent[];
  defaultCollapsed?: boolean;
};

const genderLabels: Record<string, string> = {
  men: "Maschile",
  women: "Femminile",
  mixed: "Misto",
  junior: "Juniors"
};

export function CompetitionGroup({
  competition,
  country,
  countryCode,
  countryFlag,
  leagueLogo,
  category,
  gender,
  events,
  defaultCollapsed = false
}: CompetitionGroupProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section className="max-w-full overflow-hidden rounded-lg border border-white/10 bg-field-900/78">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full min-w-0 items-center justify-between gap-3 border-b border-white/10 bg-white/[0.035] px-3 py-3 text-left transition hover:bg-white/[0.055] sm:px-4"
        aria-expanded={!collapsed}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-field-950/70">
            {leagueLogo ? (
              <Image src={leagueLogo} alt="" width={28} height={28} className="max-h-7 w-auto object-contain" />
            ) : countryFlag && countryFlag.startsWith("http") ? (
              <Image src={countryFlag} alt="" width={28} height={20} className="max-h-6 w-auto rounded-sm object-contain" />
            ) : countryFlag ? (
              <span className="text-lg" aria-hidden>
                {countryFlag}
              </span>
            ) : (
              <Globe2 className="h-5 w-5 text-court-300" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black text-white">{competition}</h2>
            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
              {countryFlag && countryFlag.startsWith("http") ? (
                <Image src={countryFlag} alt="" width={16} height={12} className="h-3 w-auto rounded-[2px] object-contain" />
              ) : null}
              <span className="truncate">
                {[country ?? countryCode, category, gender ? genderLabels[gender] : undefined].filter(Boolean).join(" · ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <MatchCountBadge count={events.length} />
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition", collapsed && "-rotate-90")} aria-hidden />
        </div>
      </button>
      {!collapsed ? events.map((event) => <MatchRow key={event.id} event={event} />) : null}
    </section>
  );
}
