import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ExternalSourceLabel } from "@/components/news/ExternalSourceLabel";
import { NewsCoverImage } from "@/components/news/NewsCoverImage";
import { getNewsBySlug } from "@/lib/providers/news";
import { formatDateTime } from "@/lib/utils/date";
import { getNewsCoverImage } from "@/lib/utils/newsVisuals";

type NewsDetailPageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const item = await getNewsBySlug(params.slug);
  if (!item) return {};

  return {
    title: item.title,
    description: item.description ?? `News sportiva da ${item.source}.`,
    openGraph: {
      title: item.title,
      description: item.description,
      url: `/news/${item.slug}`,
      type: "article",
      publishedTime: item.publishedAt
    }
  };
}

export const revalidate = 600;

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const item = await getNewsBySlug(params.slug);
  if (!item) notFound();
  const coverImage = item.imageSource === "fallback" ? undefined : getNewsCoverImage(item);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <article className="overflow-hidden rounded-lg border border-white/10 bg-field-900/84 shadow-glow">
        <div className="relative aspect-[16/9] overflow-hidden bg-field-950">
          <NewsCoverImage src={coverImage} title={item.title} sport={item.sport} />
        </div>

        <div className="p-5 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <ExternalSourceLabel source={item.source} />
            <span className="text-sm text-slate-500">{formatDateTime(item.publishedAt)}</span>
            {item.sport ? (
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-bold uppercase text-slate-400">
                {item.sport}
              </span>
            ) : null}
          </div>

          <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">{item.title}</h1>

          {item.description ? (
            <p className="mt-5 text-lg leading-8 text-slate-300">{item.description}</p>
          ) : (
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Il feed non include una descrizione breve. Apri la fonte originale per leggere il contenuto completo.
            </p>
          )}

          <div className="mt-7 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-400">
            Plaee mostra solo titolo, fonte, data e snippet disponibili tramite API o feed autorizzati. Il testo completo resta sulla fonte originale.
          </div>

          <div className="mt-7">
            <Link
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-pulse-400 px-5 py-3 text-sm font-black text-field-950 transition hover:bg-pulse-300"
            >
              Leggi la notizia completa
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
