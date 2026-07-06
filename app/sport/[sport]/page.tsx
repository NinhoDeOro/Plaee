import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { SportPageClient } from "@/components/sport/SportPageClient";
import { getScores } from "@/lib/providers/sports";
import { getSportLabel, isSport } from "@/lib/utils/sports";
import type { Sport } from "@/lib/types";

type SportPageProps = {
  params: {
    sport: string;
  };
};

function normalizeSportParam(value: string): Sport | undefined {
  if (value === "motors") return "formula1";
  return isSport(value) ? value : undefined;
}

export async function generateMetadata({ params }: SportPageProps): Promise<Metadata> {
  const sport = normalizeSportParam(params.sport);
  if (!sport) return {};
  const label = getSportLabel(sport);

  return {
    title: label,
    description: `Risultati live, calendario e partite di oggi per ${label}.`
  };
}

export const revalidate = 300;
export const dynamic = "force-dynamic";

export default async function SportPage({ params }: SportPageProps) {
  const sport = normalizeSportParam(params.sport);
  if (!sport) notFound();

  const label = getSportLabel(sport);
  const events = await getScores({ sport, date: "today" });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-lg border border-white/10 bg-field-900/80 p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-court-500/15 text-court-400">
            <Trophy className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">{label}</h1>
            <p className="mt-1 text-sm text-slate-300">Eventi di oggi, live, programmati e conclusi.</p>
          </div>
        </div>
      </section>
      <SportPageClient events={events} sport={sport} />
    </main>
  );
}
