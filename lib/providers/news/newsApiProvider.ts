import type { NewsItem, NewsQuery } from "@/lib/types";
import { fetchJson } from "@/lib/utils/fetcher";
import { createStableSlug } from "@/lib/utils/slug";

type NewsApiArticle = {
  source?: { id?: string | null; name?: string };
  title?: string;
  description?: string | null;
  url?: string;
  urlToImage?: string | null;
  publishedAt?: string;
};

type NewsApiResponse = {
  status: "ok" | "error";
  articles?: NewsApiArticle[];
  message?: string;
};

const SPORT_TERMS: Record<string, string> = {
  football: "calcio OR Serie A OR Champions League",
  tennis: "tennis OR ATP OR WTA",
  basketball: "basket OR NBA OR Eurolega",
  formula1: "Formula 1 OR F1"
};

function getKey() {
  const key = process.env.NEWS_API_KEY;
  if (!key) throw new Error("Missing NEWS_API_KEY");
  return key;
}

function getImageUrl(value?: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function getNewsApiItems(query: NewsQuery = {}) {
  const q = query.q || (query.sport ? SPORT_TERMS[query.sport] ?? query.sport : "sport OR calcio OR tennis OR basket");
  const params = new URLSearchParams({
    q,
    language: "it",
    sortBy: "publishedAt",
    pageSize: "24"
  });

  if (query.source) params.set("domains", query.source);

  const data = await fetchJson<NewsApiResponse>(`https://newsapi.org/v2/everything?${params.toString()}`, {
    headers: { "X-Api-Key": getKey() },
    revalidate: 600,
    cacheTtlMs: 600000,
    cacheKey: `newsapi-${params.toString()}`
  });

  if (data.status !== "ok") {
    throw new Error(data.message ?? "NewsAPI returned an error");
  }

  return (data.articles ?? [])
    .filter((article) => article.title && article.url)
    .map<NewsItem>((article) => {
      const seed = article.url ?? article.title ?? "";
      const slug = createStableSlug(article.title ?? "news", seed);

      return {
        id: `newsapi-${slug}`,
        title: article.title ?? "News sportiva",
        slug,
        description: article.description ?? undefined,
        source: article.source?.name ?? "NewsAPI",
        sourceUrl: article.url ?? "#",
        imageUrl: getImageUrl(article.urlToImage),
        publishedAt: article.publishedAt ?? new Date().toISOString(),
        sport: query.sport,
        provider: "newsapi"
      };
    });
}

export const newsApiProvider = {
  name: "newsapi" as const,
  getNews: getNewsApiItems
};
