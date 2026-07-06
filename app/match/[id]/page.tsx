import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarChart3, CalendarClock, Info, MapPin, Timer } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { RelatedNewsCard } from "@/components/news/RelatedNewsCard";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TeamMark } from "@/components/ui/TeamMark";
import { ScorersLine } from "@/components/scores/ScorersLine";
import { TennisDetailTabs } from "@/components/tennis/TennisDetailTabs";
import { TennisScoreSummary } from "@/components/tennis/TennisScoreSummary";
import { getNews } from "@/lib/providers/news";
import { getMatchDetail } from "@/lib/providers/sports";
import { formatDateTime } from "@/lib/utils/date";
import { getSportLabel } from "@/lib/utils/sports";

type MatchPageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const match = await getMatchDetail(decodeURIComponent(params.id));
  if (!match) return {};

  return {
    title: `${match.homeName} - ${match.awayName}`,
    description: `${match.competition}: punteggio, stato partita, timeline e statistiche rapide.`
  };
}

export const revalidate = 60;

function readableTennisDiscipline(value?: string) {
  if (value === "singles") return "Singolare";
  if (value === "doubles") return "Doppio";
  if (value === "mixed-doubles") return "Doppio misto";
  if (value === "junior") return "Juniors";
  return undefined;
}

function readableGender(value?: string) {
  if (value === "men") return "Maschile";
  if (value === "women") return "Femminile";
  if (value === "mixed") return "Misto";
  if (value === "junior") return "Juniors";
  return undefined;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const match = await getMatchDetail(decodeURIComponent(params.id));
  if (!match) notFound();

  const relatedNews = (match.relatedNews?.length ? match.relatedNews : await getNews({ sport: match.sport })).slice(0, 3);
  const showScorers = match.status === "live" || match.status === "finished";

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-lg border border-white/10 bg-field-900/84 p-5 shadow-glow">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <span className="font-bold text-pulse-400">{getSportLabel(match.sport)}</span>
          <span>·</span>
          <span>{match.competition}</span>
          {match.country ? (
            <>
              <span>·</span>
              <span>{match.country}</span>
            </>
          ) : null}
        </div>

        {match.sport === "formula1" ? (
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black text-white sm:text-3xl">
                {match.raceName ?? match.competition}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-300">
                {[match.sessionType, match.circuit, match.country].filter(Boolean).join(" · ")}
              </p>
            </div>

            <div className="mx-auto min-w-28 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="mb-3 flex justify-center">
                <StatusBadge status={match.status} label={match.statusLabel} />
              </div>
              <p className="text-2xl font-black text-white">{match.winner ? "Risultato" : "Sessione"}</p>
              <p className="mt-1 text-sm font-bold text-slate-300">{match.winner ?? match.sessionType ?? "Formula 1"}</p>
            </div>
          </div>
        ) : match.sport === "tennis" ? (
          <div className="grid max-w-full gap-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="flex min-w-0 items-center gap-3">
                <TeamMark name={match.homeName} logo={match.homeLogo} />
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-black text-white sm:text-3xl">{match.homeName}</h1>
                  <p className="mt-1 text-sm font-semibold text-slate-400">{[match.category, match.venue].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3 md:justify-end">
                <div className="min-w-0 md:text-right">
                  <h2 className="truncate text-2xl font-black text-white sm:text-3xl">{match.awayName}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-400">{match.tennisScore?.statusLabel ?? match.statusLabel}</p>
                </div>
                <TeamMark name={match.awayName} logo={match.awayLogo} />
              </div>
            </div>
            <div className="flex justify-center">
              <StatusBadge status={match.status} label={match.tennisScore?.statusLabel ?? match.statusLabel} />
            </div>
            <TennisScoreSummary event={match} />
          </div>
        ) : (
          <div className="grid max-w-full gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
            <div className="flex min-w-0 items-center gap-3 md:justify-start">
              <TeamMark name={match.homeName} logo={match.homeLogo} />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black text-white sm:text-3xl">{match.homeName}</h1>
                {showScorers ? <ScorersLine scorers={match.scorers?.home} /> : null}
              </div>
            </div>

            <div className="mx-auto min-w-28 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="mb-3 flex justify-center">
                <StatusBadge status={match.status} label={match.statusLabel} />
              </div>
              <ScoreDisplay event={match} separator="dash" centered large />
            </div>

            <div className="flex min-w-0 items-center gap-3 md:justify-end">
              <div className="min-w-0 md:text-right">
                <h2 className="truncate text-2xl font-black text-white sm:text-3xl">{match.awayName}</h2>
                {showScorers ? <ScorersLine scorers={match.scorers?.away} /> : null}
              </div>
              <TeamMark name={match.awayName} logo={match.awayLogo} />
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
            <CalendarClock className="h-4 w-4 text-court-400" aria-hidden />
            {formatDateTime(match.startTime)}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
            <Timer className="h-4 w-4 text-pulse-400" aria-hidden />
            {match.statusLabel}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
            <MapPin className="h-4 w-4 text-flare-400" aria-hidden />
            {match.venue ?? "Stadio non disponibile"}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {match.sport === "tennis" ? <TennisDetailTabs match={match} /> : null}

          {match.sport !== "tennis" ? (
          <section className="space-y-3">
            <h2 className="text-lg font-black text-white">Timeline</h2>
            {match.timeline?.length ? (
              <div className="rounded-lg border border-white/10 bg-field-900/78 p-4">
                <ol className="space-y-4">
                  {match.timeline.map((item, index) => (
                    <li key={`${item.minute}-${item.type}-${index}`} className="grid grid-cols-[64px_1fr] gap-3">
                      <span className="text-sm font-black text-pulse-400">{item.minute ?? "-"}</span>
                      <div>
                        <p className="font-bold text-white">{item.type}</p>
                        <p className="text-sm leading-6 text-slate-400">{item.description}</p>
                        {item.player || item.team ? (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {[item.player, item.team].filter(Boolean).join(" · ")}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <EmptyState title="Timeline non disponibile" description="Il provider non ha fornito eventi dettagliati per questa partita." />
            )}
          </section>
          ) : null}

          {match.sport !== "tennis" ? (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-black text-white">
              <BarChart3 className="h-5 w-5 text-court-400" aria-hidden />
              Statistiche rapide
            </h2>
            {match.stats?.length ? (
              <div className="rounded-lg border border-white/10 bg-field-900/78 p-4">
                <div className="space-y-3">
                  {match.stats.map((stat) => (
                    <div key={stat.label} className="grid grid-cols-[64px_1fr_64px] items-center gap-3 text-sm">
                      <span className="text-right font-black text-white">{stat.homeValue}</span>
                      <span className="rounded-full bg-white/[0.04] px-3 py-2 text-center font-semibold text-slate-300">{stat.label}</span>
                      <span className="font-black text-white">{stat.awayValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Statistiche non disponibili" description="Quando il provider le rende disponibili, Plaee le mostrerà qui." />
            )}
          </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-black text-white">
              <Info className="h-5 w-5 text-flare-400" aria-hidden />
              Dati disponibili
            </h2>
            <div className="rounded-lg border border-white/10 bg-field-900/78 p-4">
              <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <div className="rounded-lg bg-white/[0.035] px-3 py-2">
                  <span className="block text-xs font-black uppercase text-slate-500">Categoria</span>
                  <span className="font-bold text-white">{match.category ?? "Non disponibile"}</span>
                </div>
                <div className="rounded-lg bg-white/[0.035] px-3 py-2">
                  <span className="block text-xs font-black uppercase text-slate-500">Formato</span>
                  <span className="font-bold text-white">
                    {[readableTennisDiscipline(match.discipline), readableGender(match.gender), match.sessionType]
                      .filter(Boolean)
                      .join(" · ") || "Non disponibile"}
                  </span>
                </div>
                <div className="rounded-lg bg-white/[0.035] px-3 py-2">
                  <span className="block text-xs font-black uppercase text-slate-500">Timeline live</span>
                  <span className="font-bold text-white">{match.timeline?.length ? "Disponibile" : "Non disponibile"}</span>
                </div>
                <div className="rounded-lg bg-white/[0.035] px-3 py-2">
                  <span className="block text-xs font-black uppercase text-slate-500">Statistiche live</span>
                  <span className="font-bold text-white">{match.stats?.length ? "Disponibili" : "Non disponibili"}</span>
                </div>
              </div>
              {match.status === "scheduled" ? (
                <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm font-semibold text-slate-400">
                  {match.preMatchInsights?.length
                    ? "Dati pre-match disponibili sotto."
                    : "Dati pre-match non disponibili per questo evento."}
                </p>
              ) : null}
            </div>
          </section>

          {match.sport !== "tennis" ? (
          <section className="space-y-3">
            <h2 className="text-lg font-black text-white">Pre-match</h2>
            {match.preMatchInsights?.length ? (
              <div className="rounded-lg border border-white/10 bg-field-900/78 p-4">
                <div className="grid gap-3">
                  {match.preMatchInsights.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="rounded-lg bg-white/[0.035] px-3 py-2">
                      <p className="text-xs font-black uppercase text-slate-500">{item.label}</p>
                      <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
                      {item.detail ? <p className="mt-1 text-xs font-semibold text-slate-500">{item.detail}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Dati pre-match non disponibili" description="Head to head, forma e ranking compariranno qui quando la API li fornisce." />
            )}
          </section>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-3 lg:self-start" aria-label="News correlate">
          <h2 className="text-lg font-black text-white">News correlate</h2>
          {relatedNews.length ? (
            relatedNews.map((item) => <RelatedNewsCard key={item.id} item={item} />)
          ) : (
            <EmptyState title="Nessuna news correlata" />
          )}
        </aside>
      </div>
    </main>
  );
}
