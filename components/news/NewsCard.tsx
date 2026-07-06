import Link from "next/link";
import type { NewsItem } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils/date";
import { getNewsCoverImage } from "@/lib/utils/newsVisuals";
import { ExternalSourceLabel } from "@/components/news/ExternalSourceLabel";
import { NewsCoverImage } from "@/components/news/NewsCoverImage";

type NewsCardProps = {
  item: NewsItem;
  compact?: boolean;
};

export function NewsCard({ item, compact = false }: NewsCardProps) {
  const coverImage = item.imageSource === "fallback" ? undefined : getNewsCoverImage(item);

  return (
    <article className="flex h-full min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] transition hover:border-court-400/35 hover:bg-white/[0.08] hover:shadow-glow">
      <Link
        href={`/news/${item.slug}`}
        className={compact ? "grid h-full min-w-0 grid-cols-[88px_minmax(0,1fr)] overflow-hidden" : "flex h-full min-w-0 flex-col overflow-hidden"}
      >
        <div
          className={
            compact
              ? "relative h-full min-h-28 w-[88px] shrink-0 overflow-hidden bg-field-950"
              : "relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-field-950"
          }
        >
          <NewsCoverImage src={coverImage} title={item.title} sport={item.sport} compact={compact} />
        </div>
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ExternalSourceLabel source={item.source} />
            <span className="text-xs text-slate-500">{formatDateLabel(item.publishedAt)}</span>
          </div>
          <h3 className="line-clamp-2 font-black leading-snug text-white">{item.title}</h3>
          {item.description && !compact ? (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{item.description}</p>
          ) : null}
          {item.sport ? (
            <span className="mt-3 inline-flex rounded-full border border-white/10 px-2.5 py-1 text-xs font-bold uppercase text-slate-400">
              {item.sport}
            </span>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
