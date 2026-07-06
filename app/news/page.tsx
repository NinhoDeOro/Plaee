import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { NewsCard } from "@/components/news/NewsCard";
import { getNews } from "@/lib/providers/news";

export const metadata: Metadata = {
  title: "News",
  description: "News sportive con titolo, snippet, data e link alla fonte originale."
};

export const revalidate = 600;

export default async function NewsPage() {
  const news = await getNews();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-lg border border-white/10 bg-field-900/80 p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-flare-500/15 text-flare-400">
            <Newspaper className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">News sportive</h1>
            <p className="mt-1 text-sm text-slate-300">Titoli, snippet e link alle fonti originali.</p>
          </div>
        </div>
      </section>

      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
