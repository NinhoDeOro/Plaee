"use client";

import { useState } from "react";
import type { MatchDetail } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";

type TennisDetailTabsProps = {
  match: MatchDetail;
};

type Tab = "details" | "stats" | "h2h" | "form";

const tabs: Array<{ value: Tab; label: string }> = [
  { value: "details", label: "Dettagli" },
  { value: "stats", label: "Statistiche" },
  { value: "h2h", label: "H2H" },
  { value: "form", label: "Forma" }
];

export function TennisDetailTabs({ match }: TennisDetailTabsProps) {
  const [active, setActive] = useState<Tab>("details");

  return (
    <section className="space-y-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Dettaglio tennis">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActive(tab.value)}
            className={cn(
              "min-w-max rounded-full border px-4 py-2 text-sm font-black transition",
              active === tab.value
                ? "border-court-300/40 bg-court-400/14 text-court-100"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20"
            )}
            role="tab"
            aria-selected={active === tab.value}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-field-900/78 p-4">
        {active === "details" ? (
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <div className="rounded-lg bg-white/[0.035] px-3 py-2">
              <span className="block text-xs font-black uppercase text-slate-500">Torneo</span>
              <span className="font-bold text-white">{match.competition}</span>
            </div>
            <div className="rounded-lg bg-white/[0.035] px-3 py-2">
              <span className="block text-xs font-black uppercase text-slate-500">Categoria</span>
              <span className="font-bold text-white">{match.category ?? "Non disponibile"}</span>
            </div>
            <div className="rounded-lg bg-white/[0.035] px-3 py-2">
              <span className="block text-xs font-black uppercase text-slate-500">Round</span>
              <span className="font-bold text-white">{match.venue ?? "Non disponibile"}</span>
            </div>
            <div className="rounded-lg bg-white/[0.035] px-3 py-2">
              <span className="block text-xs font-black uppercase text-slate-500">Stato</span>
              <span className="font-bold text-white">{match.tennisScore?.statusLabel ?? match.statusLabel}</span>
            </div>
          </div>
        ) : null}

        {active === "stats" ? (
          match.stats?.length ? (
            <div className="space-y-3">
              {match.stats.map((stat) => (
                <div key={stat.label} className="grid grid-cols-[64px_1fr_64px] items-center gap-3 text-sm">
                  <span className="text-right font-black text-white">{stat.homeValue}</span>
                  <span className="rounded-full bg-white/[0.04] px-3 py-2 text-center font-semibold text-slate-300">{stat.label}</span>
                  <span className="font-black text-white">{stat.awayValue}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Statistiche live non disponibili per questo evento" />
          )
        ) : null}

        {active === "h2h" ? (
          match.preMatchInsights?.length ? (
            <div className="grid gap-3">
              {match.preMatchInsights.map((item, index) => (
                <div key={`${item.label}-${index}`} className="rounded-lg bg-white/[0.035] px-3 py-2">
                  <p className="text-xs font-black uppercase text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
                  {item.detail ? <p className="mt-1 text-xs font-semibold text-slate-500">{item.detail}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Head to head non disponibile" />
          )
        ) : null}

        {active === "form" ? <EmptyState title="Forma recente non disponibile" /> : null}
      </div>
    </section>
  );
}
