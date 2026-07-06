import Link from "next/link";
import type { NewsItem } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils/date";
import { getNewsCoverImage } from "@/lib/utils/newsVisuals";
import { NewsCoverImage } from "@/components/news/NewsCoverImage";
import { ExternalSourceLabel } from "@/components/news/ExternalSourceLabel";

type RelatedNewsCardProps = {
  item: NewsItem;
};

export function RelatedNewsCard({ item }: RelatedNewsCardProps) {
  const coverImage = item.imageSource === "fallback" ? undefined : getNewsCoverImage(item);

  return (
    <Link
      href={`/news/${item.slug}`}
      className="flex h-[120px] min-w-0 max-w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] transition hover:border-court-400/35 hover:bg-white/[0.08]"
    >
      <div className="relative h-full w-28 shrink-0 overflow-hidden bg-field-950">
        <NewsCoverImage src={coverImage} title={item.title} sport={item.sport} compact />
      </div>

      <div className="min-w-0 flex-1 p-3">
        <div className="mb-2 flex min-w-0 items-center gap-2 overflow-hidden">
          <ExternalSourceLabel source={item.source} />
          <span className="shrink-0 text-[11px] text-slate-500">{formatDateLabel(item.publishedAt)}</span>
        </div>
        <h3 className="line-clamp-3 text-sm font-black leading-snug text-white">{item.title}</h3>
        {item.sport ? (
          <span className="mt-2 inline-flex rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
            {item.sport}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
