import { Activity } from "lucide-react";
import { ScoresBoard } from "@/components/scores/ScoresBoard";
import { NewsCard } from "@/components/news/NewsCard";
import { getNews } from "@/lib/providers/news";
import { getActiveSportsProviderName, getScores } from "@/lib/providers/sports";
import type { ScoreQuery, Sport } from "@/lib/types";

export const revalidate = 300;

function getLiveRefreshIntervalMs() {
  const provider = getActiveSportsProviderName();
  const fallbackSeconds = provider === "api-football" || provider === "api-sports" ? 120 : 30;
  const seconds = Number(process.env.LIVE_REFRESH_INTERVAL_SECONDS ?? fallbackSeconds);

  return (Number.isFinite(seconds) && seconds > 0 ? seconds : fallbackSeconds) * 1000;
}

function parseSport(value?: string): ScoreQuery["sport"] {
  if (!value || value === "all" || value === "trending") return "trending";
  if (value === "motors") return "formula1";
  if (["football", "tennis", "basketball", "formula1", "other"].includes(value)) return value as Sport;
  return undefined;
}

export default async function HomePage({
  searchParams
}: {
  searchParams?: { date?: string; sport?: string };
}) {
  const date = searchParams?.date ?? "today";
  const sport = parseSport(searchParams?.sport);
  const [events, news] = await Promise.all([
    getScores({ date, sport }),
    getNews()
  ]);
  const topNews = news.slice(0, 5);
  const refreshIntervalMs = getLiveRefreshIntervalMs();

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <section className="relative mb-6 overflow-hidden rounded-xl border border-court-400/20 bg-[radial-gradient(circle_at_50%_0%,rgba(71,197,255,0.24),transparent_36%),radial-gradient(circle_at_82%_26%,rgba(168,85,247,0.16),transparent_32%),linear-gradient(135deg,rgba(9,11,16,0.94),rgba(16,19,27,0.88)_48%,rgba(8,185,118,0.14))] px-5 py-8 text-center shadow-glow sm:px-8 sm:py-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-court-400/70 to-transparent" aria-hidden />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
          <div className="mb-4 inline-flex items-center justify-center gap-2 rounded-full border border-pulse-400/35 bg-pulse-400/14 px-3 py-1 text-xs font-black uppercase text-pulse-300 shadow-[0_0_28px_rgba(57,255,174,0.16)]">
            <Activity className="h-3.5 w-3.5" aria-hidden />
            Risultati live
          </div>
          <h1 className="max-w-4xl text-balance text-3xl font-black leading-tight text-white sm:text-5xl">
            Tutti gli sport, live. In un solo posto.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Risultati, partite e news aggiornate in tempo reale.
          </p>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <ScoresBoard initialEvents={events} newsItems={news} refreshIntervalMs={refreshIntervalMs} />
        </div>

        <aside className="hidden space-y-3 lg:block" aria-label="Top news">
          <div className="rounded-lg border border-white/10 bg-field-900/80 p-4">
            <h2 className="text-lg font-black text-white">Top news</h2>
            <div className="mt-4 space-y-3">
              {topNews.map((item) => (
                <NewsCard key={item.id} item={item} compact />
              ))}
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-8 space-y-3 lg:hidden" aria-label="News sportive">
        <h2 className="text-lg font-black text-white">Top news</h2>
        <div className="grid gap-3">
          {topNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
