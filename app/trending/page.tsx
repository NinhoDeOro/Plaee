import type { Metadata } from "next";
import { Flame } from "lucide-react";
import { TrendingPageClient } from "@/components/trending/TrendingPageClient";
import { DecorativePlaeeMark } from "@/components/ui/DecorativePlaeeMark";
import { getScores } from "@/lib/providers/sports";

export const metadata: Metadata = {
  title: "Trending",
  description: "Gli eventi sportivi più importanti del giorno su Plaee, separati per sport."
};

export const revalidate = 300;
export const dynamic = "force-dynamic";

export default async function TrendingPage() {
  const events = await getScores({ sport: "trending", date: "today" });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative mb-6 overflow-hidden rounded-xl border border-court-400/20 bg-[radial-gradient(circle_at_12%_25%,rgba(71,197,255,0.24),transparent_34%),radial-gradient(circle_at_80%_22%,rgba(255,199,78,0.18),transparent_28%),linear-gradient(135deg,rgba(9,11,16,0.95),rgba(18,21,31,0.88))] p-5 shadow-glow">
        <DecorativePlaeeMark className="absolute -right-10 top-1/2 hidden h-36 w-60 -translate-y-1/2 opacity-[0.08] mix-blend-screen md:block lg:right-8 lg:h-44 lg:w-80" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-flare-400/15 text-flare-300">
            <Flame className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Trending</h1>
            <p className="mt-1 text-sm text-slate-300">
              Gli eventi più importanti del giorno, separati per Calcio, Tennis, Basket e Motori.
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <TrendingPageClient initialEvents={events} />
      </div>
    </main>
  );
}
