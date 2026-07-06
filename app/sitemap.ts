import type { MetadataRoute } from "next";
import { getNews } from "@/lib/providers/news";
import { getScores } from "@/lib/providers/sports";
import { toValidDate } from "@/lib/utils/date";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://plaee.it";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, events] = await Promise.all([
    getNews(),
    getScores({ date: "today" })
  ]);

  const staticRoutes = ["", "/trending", "/live", "/sport/football", "/sport/tennis", "/sport/basketball", "/sport/formula1", "/news"].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8
  }));

  const newsRoutes = news.slice(0, 50).map((item) => ({
    url: `${siteUrl}/news/${item.slug}`,
    lastModified: toValidDate(item.publishedAt),
    changeFrequency: "daily" as const,
    priority: 0.6
  }));

  const matchRoutes = events.slice(0, 50).map((event) => ({
    url: `${siteUrl}/match/${event.id}`,
    lastModified: toValidDate(event.startTime),
    changeFrequency: event.isLive ? "hourly" as const : "daily" as const,
    priority: event.isLive ? 0.7 : 0.5
  }));

  return [...staticRoutes, ...newsRoutes, ...matchRoutes];
}
