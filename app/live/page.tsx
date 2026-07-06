import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { LiveScoresClient } from "@/components/live/LiveScoresClient";
import { getActiveSportsProviderName } from "@/lib/providers/sports";
import { getLiveSportsEvents } from "@/lib/providers/sports/liveSportsProvider";

export const metadata: Metadata = {
  title: "Live",
  description: "Eventi sportivi live aggiornati automaticamente."
};

export const revalidate = 120;
export const dynamic = "force-dynamic";

function getLiveRefreshIntervalMs() {
  const provider = getActiveSportsProviderName();
  const fallbackSeconds = provider === "api-football" || provider === "api-sports" ? 120 : 30;
  const envValue =
    provider === "api-football" || provider === "api-sports"
      ? process.env.LIVE_REFRESH_INTERVAL_SECONDS
      : process.env.LIVE_REFRESH_INTERVAL_SECONDS_PAID ?? process.env.LIVE_REFRESH_INTERVAL_SECONDS;
  const seconds = Number(envValue ?? fallbackSeconds);

  return (Number.isFinite(seconds) && seconds > 0 ? seconds : fallbackSeconds) * 1000;
}

export default async function LivePage() {
  const live = await getLiveSportsEvents();
  const refreshIntervalMs = getLiveRefreshIntervalMs();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-lg border border-red-400/20 bg-red-500/[0.08] p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-red-400/15 text-red-200">
            <Radio className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Eventi live</h1>
            <p className="mt-1 text-sm text-slate-300">
              Aggiornamento automatico ogni {refreshIntervalMs >= 60000 ? `${refreshIntervalMs / 60000} minuti` : "30 secondi"}.
            </p>
          </div>
        </div>
      </section>
      <LiveScoresClient initialLive={live} refreshIntervalMs={refreshIntervalMs} />
    </main>
  );
}
