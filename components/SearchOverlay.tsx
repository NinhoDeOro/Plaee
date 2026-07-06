"use client";

import { Search } from "lucide-react";
import type { SearchSuggestion } from "@/lib/utils/search";
import { TeamMark } from "@/components/ui/TeamMark";
import { cn } from "@/lib/utils/cn";

type SearchOverlayProps = {
  query: string;
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  activeIndex: number;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  onSelectRecent: (query: string) => void;
  onActiveIndexChange: (index: number) => void;
};

export function SearchOverlay({
  query,
  suggestions,
  recentSearches,
  activeIndex,
  onSelectSuggestion,
  onSelectRecent,
  onActiveIndexChange
}: SearchOverlayProps) {
  const hasQuery = query.trim().length > 0;

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-xl border border-white/10 bg-field-950/98 shadow-[0_24px_80px_rgba(0,0,0,0.58)] backdrop-blur-xl">
      {!hasQuery && recentSearches.length ? (
        <section className="border-b border-white/10 p-3">
          <p className="mb-2 text-xs font-black uppercase text-slate-500">Recenti</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSelectRecent(item)}
                className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-court-400/30 hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="max-h-[min(56vh,420px)] overflow-y-auto p-2">
        <p className="px-2 pb-2 pt-1 text-xs font-black uppercase text-slate-500">
          {hasQuery ? "Squadre trovate" : "Suggerito"}
        </p>

        {suggestions.length ? (
          <div className="grid gap-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onMouseEnter={() => onActiveIndexChange(index)}
                onClick={() => onSelectSuggestion(suggestion)}
                className={cn(
                  "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition",
                  activeIndex === index ? "bg-court-400/12 text-white" : "hover:bg-white/[0.055]"
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04]">
                  <TeamMark name={suggestion.title} logo={suggestion.logoUrl} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-white">{suggestion.title}</span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="truncate">{suggestion.subtitle ?? suggestion.country ?? "Squadra"}</span>
                    {suggestion.sport ? <span className="uppercase">{suggestion.sport}</span> : null}
                  </span>
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.035] px-2 py-1 text-[11px] font-black uppercase text-slate-400">
                  Squadra
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid place-items-center gap-2 px-4 py-10 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400">
              <Search className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm font-black text-white">Nessun risultato trovato</p>
            <p className="max-w-sm text-sm leading-6 text-slate-500">
              Prova con il nome della squadra in italiano, inglese o con un&apos;abbreviazione.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
