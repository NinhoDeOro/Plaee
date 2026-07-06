import Parser from "rss-parser";
import type { NewsItem, NewsQuery } from "@/lib/types";
import { toValidDate } from "@/lib/utils/date";
import { fetchText } from "@/lib/utils/fetcher";
import { extractNewsImage } from "@/lib/utils/newsImages";
import { createStableSlug } from "@/lib/utils/slug";

type FeedConfig = {
  label: string;
  sport?: string;
  url?: string;
};

const parser = new Parser();
const loggedUnavailableFeeds = new Set<string>();
const DAY_MS = 24 * 60 * 60 * 1000;

type RssItemWithMedia = Parser.Item & {
  enclosure?: { url?: string; link?: string; type?: string };
  image?: unknown;
  imageUrl?: unknown;
  description?: string;
  "media:content"?: unknown;
  "media:thumbnail"?: unknown;
};

function rssFeeds(): FeedConfig[] {
  return [
    {
      label: "ANSA Sport",
      url: process.env.ANSA_RSS_SPORT ?? "https://www.ansa.it/sito/notizie/sport/sport_rss.xml"
    },
    {
      label: "Sky Sport",
      url: process.env.SKY_RSS_SPORT ?? "https://sport.sky.it/rss/sport.xml"
    },
    {
      label: "BBC Sport",
      url: process.env.BBC_RSS_SPORT ?? "https://feeds.bbci.co.uk/sport/rss.xml"
    },
    {
      label: "Gazzetta dello Sport",
      url: process.env.GAZZETTA_RSS_GENERAL ?? "https://www.gazzetta.it/rss/home.xml"
    },
    {
      label: "Gazzetta Calcio",
      sport: "football",
      url: process.env.GAZZETTA_RSS_CALCIO ?? "https://www.gazzetta.it/rss/calcio.xml"
    },
    {
      label: "Gazzetta Serie A",
      sport: "football",
      url: process.env.GAZZETTA_RSS_SERIE_A ?? "https://www.gazzetta.it/rss/serie-a.xml"
    },
    {
      label: "Gazzetta Basket",
      sport: "basketball",
      url: process.env.GAZZETTA_RSS_BASKET ?? "https://www.gazzetta.it/rss/basket.xml"
    },
    {
      label: "Gazzetta Formula 1",
      sport: "formula1",
      url: process.env.GAZZETTA_RSS_FORMULA1 ?? "https://www.gazzetta.it/rss/formula-1.xml"
    }
  ].filter((feed) => Boolean(feed.url));
}

function stripHtml(value?: string) {
  return value
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function snippet(value?: string) {
  const clean = stripHtml(value);
  if (!clean) return undefined;
  return clean.length > 180 ? `${clean.slice(0, 177)}...` : clean;
}

function inferSport(feed: FeedConfig, title?: string, description?: string) {
  if (feed.sport) return feed.sport;

  const value = `${title ?? ""} ${description ?? ""}`.toLowerCase();
  if (/\b(calcio|serie a|champions|europa league|premier league|football|soccer)\b/.test(value)) return "football";
  if (/\b(tennis|atp|wta|sinner|paolini|wimbledon|roland garros)\b/.test(value)) return "tennis";
  if (/\b(basket|nba|eurolega|olimpia|virtus|basketball)\b/.test(value)) return "basketball";
  if (/\b(formula 1|formula uno|f1|ferrari|verstappen|leclerc)\b/.test(value)) return "formula1";
  return undefined;
}

function normalizePublishedAt(value?: string) {
  return toValidDate(value).toISOString();
}

function maxItemAgeMs() {
  const days = Number(process.env.RSS_MAX_ITEM_AGE_DAYS ?? 45);
  return Number.isFinite(days) && days > 0 ? days * DAY_MS : null;
}

function isFreshEnough(item: NewsItem) {
  const maxAge = maxItemAgeMs();
  if (!maxAge) return true;

  const published = toValidDate(item.publishedAt).getTime();
  return Date.now() - published <= maxAge;
}

async function getFeedItems(feed: FeedConfig): Promise<NewsItem[]> {
  if (!feed.url) return [];

  try {
    const xml = await fetchText(feed.url, {
      revalidate: 600,
      timeoutMs: 3500,
      cacheTtlMs: 600000,
      cacheKey: `rss-${feed.url}`
    });
    const parsed = await parser.parseString(xml);

    const items = await Promise.all(parsed.items
      .filter((item) => item.title && item.link)
      .slice(0, 10)
      .map(async (rawItem) => {
        const item = rawItem as RssItemWithMedia;
        const sourceUrl = item.link ?? feed.url ?? "#";
        const slug = createStableSlug(item.title ?? "news-rss", sourceUrl);
        const description = snippet(item.contentSnippet || item.content || item.summary);
        const sport = inferSport(feed, item.title, description);
        const image = await extractNewsImage(item, sourceUrl, sport, feed.label);

        return {
          id: `rss-${slug}`,
          title: item.title ?? "News sportiva",
          slug,
          description,
          source: feed.label || parsed.title || "RSS",
          sourceUrl,
          imageUrl: image.imageUrl,
          imageSource: image.imageSource,
          publishedAt: normalizePublishedAt(item.isoDate || item.pubDate),
          sport,
          provider: "rss" as const
        };
      }));

    return items.filter(isFreshEnough);
  } catch (error) {
    if (!loggedUnavailableFeeds.has(feed.label)) {
      loggedUnavailableFeeds.add(feed.label);
      const message = error instanceof Error ? error.message : "errore sconosciuto";
      console.warn(`[Plaee] RSS feed unavailable (${feed.label}): ${message}`);
    }
    return [];
  }
}

export async function getRssNews(query: NewsQuery = {}) {
  const feeds = rssFeeds().filter((feed) => (query.sport ? feed.sport === query.sport || !feed.sport : true));
  const items = (await Promise.all(feeds.map(getFeedItems))).flat();

  return items
    .filter((item) => (query.source ? item.source.toLowerCase().includes(query.source.toLowerCase()) : true))
    .filter((item) => {
      if (!query.q) return true;
      const value = `${item.title} ${item.description ?? ""}`.toLowerCase();
      return value.includes(query.q.toLowerCase());
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export const rssNewsProvider = {
  name: "rss" as const,
  getNews: getRssNews
};
