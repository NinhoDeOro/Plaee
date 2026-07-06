import type { NewsItem, NewsProviderName, NewsQuery } from "@/lib/types";
import { toValidDate } from "@/lib/utils/date";
import { logProviderFallback } from "@/lib/utils/fetcher";
import { mockNewsProvider } from "@/lib/providers/news/mockNewsProvider";
import { newsApiProvider } from "@/lib/providers/news/newsApiProvider";
import { rssNewsProvider } from "@/lib/providers/news/rssNewsProvider";

function dedupeNews(items: NewsItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.sourceUrl || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyNewsFilters(items: NewsItem[], query: NewsQuery = {}) {
  return items
    .filter((item) => (query.sport ? item.sport === query.sport || !item.sport : true))
    .filter((item) => (query.source ? item.source.toLowerCase().includes(query.source.toLowerCase()) : true))
    .filter((item) => {
      if (!query.q) return true;
      const value = `${item.title} ${item.description ?? ""}`.toLowerCase();
      return value.includes(query.q.toLowerCase());
    })
    .sort((a, b) => toValidDate(b.publishedAt).getTime() - toValidDate(a.publishedAt).getTime());
}

export function getActiveNewsProviderName(): NewsProviderName {
  const value = process.env.NEWS_PROVIDER;
  if (value === "newsapi" || value === "rss" || value === "mock") return value;
  return "rss";
}

export function hasNewsProviderKey(provider = getActiveNewsProviderName()) {
  if (provider === "newsapi") return Boolean(process.env.NEWS_API_KEY);
  return true;
}

export function isRssNewsEnabled() {
  return process.env.ENABLE_RSS_NEWS !== "false";
}

export async function getNews(query: NewsQuery = {}) {
  const provider = getActiveNewsProviderName();
  let items: NewsItem[] = [];

  if (provider === "newsapi" && process.env.NEWS_API_KEY) {
    try {
      items = await newsApiProvider.getNews(query);
    } catch (error) {
      logProviderFallback("NewsAPI", error);
    }
  }

  if (provider === "rss") {
    items = await rssNewsProvider.getNews(query);
  }

  if (provider !== "mock" && provider !== "rss" && isRssNewsEnabled()) {
    const rssItems = await rssNewsProvider.getNews(query);
    items = [...items, ...rssItems];
  }

  if (!items.length) {
    if (provider !== "mock" && !hasNewsProviderKey(provider)) {
      logProviderFallback(provider, new Error("API key not configured"));
    }
    items = await mockNewsProvider.getNews(query);
  }

  return applyNewsFilters(dedupeNews(items), query);
}

export async function getNewsBySlug(slug: string) {
  const items = await getNews();
  return items.find((item) => item.slug === slug) ?? null;
}
