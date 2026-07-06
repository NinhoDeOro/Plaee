import { fetchText } from "@/lib/utils/fetcher";
import { getNewsCoverFallbackPath } from "@/lib/utils/newsVisuals";

export type NewsImageSource =
  | "rss-image"
  | "enclosure"
  | "media-content"
  | "media-thumbnail"
  | "content-img"
  | "og-image"
  | "fallback";

type NewsImageItem = {
  image?: unknown;
  imageUrl?: unknown;
  enclosure?: { url?: string; link?: string; type?: string };
  content?: string;
  summary?: string;
  description?: string;
  contentSnippet?: string;
  "media:content"?: unknown;
  "media:thumbnail"?: unknown;
};

type ExtractedNewsImage = {
  imageUrl: string;
  imageSource: NewsImageSource;
};

const ogImageCache = new Map<string, { expiresAt: number; value?: string }>();
const OG_CACHE_MS = 12 * 60 * 60 * 1000;

function isImageUrl(value?: string) {
  if (!value) return false;
  return /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(value) || /(?:image|photo|img|media|thumbnail)/i.test(value);
}

function safeImageUrl(value?: string, baseUrl?: string) {
  const raw = value?.trim();
  if (!raw) return undefined;

  try {
    const url = new URL(raw.startsWith("//") ? `https:${raw}` : raw, baseUrl);
    if (url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function stringField(value: unknown, key: string) {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  return typeof record[key] === "string" ? record[key] : undefined;
}

function nestedStringField(value: unknown, parent: string, key: string) {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const nested = record[parent];
  if (!nested || typeof nested !== "object") return undefined;
  const nestedRecord = nested as Record<string, unknown>;
  return typeof nestedRecord[key] === "string" ? nestedRecord[key] : undefined;
}

function firstImageCandidate(value: unknown, baseUrl?: string) {
  if (!value) return undefined;
  const candidates = Array.isArray(value) ? value : [value];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const url = safeImageUrl(candidate, baseUrl);
      if (url) return url;
      continue;
    }

    const url =
      safeImageUrl(stringField(candidate, "url"), baseUrl) ??
      safeImageUrl(stringField(candidate, "link"), baseUrl) ??
      safeImageUrl(stringField(candidate, "href"), baseUrl) ??
      safeImageUrl(nestedStringField(candidate, "$", "url"), baseUrl) ??
      safeImageUrl(nestedStringField(candidate, "$", "link"), baseUrl) ??
      safeImageUrl(nestedStringField(candidate, "$", "href"), baseUrl);
    if (url) return url;
  }

  return undefined;
}

function imageFromHtml(value?: string, baseUrl?: string) {
  if (!value) return undefined;
  const src = value.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  return safeImageUrl(src, baseUrl);
}

function ogImageFromHtml(html: string, pageUrl: string) {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i
  ];

  for (const pattern of patterns) {
    const imageValue = pattern.exec(html)?.[1];
    const url = safeImageUrl(imageValue, pageUrl);
    if (url) return url;
  }

  return undefined;
}

async function getOgImage(pageUrl?: string) {
  const safeUrl = safeImageUrl(pageUrl);
  if (!safeUrl) return undefined;

  const cached = ogImageCache.get(safeUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const html = await fetchText(safeUrl, {
      timeoutMs: 1800,
      cacheTtlMs: OG_CACHE_MS,
      cacheKey: `news-og-image-${safeUrl}`,
      headers: {
        "user-agent": "PlaeeBot/1.0 (+https://plaee.it)"
      }
    });
    const image = ogImageFromHtml(html.slice(0, 120000), safeUrl);
    ogImageCache.set(safeUrl, { expiresAt: Date.now() + OG_CACHE_MS, value: image });
    return image;
  } catch {
    ogImageCache.set(safeUrl, { expiresAt: Date.now() + 30 * 60 * 1000, value: undefined });
    return undefined;
  }
}

function sourceForFallback(sport?: string, source?: string) {
  const value = `${sport ?? ""} ${source ?? ""}`.toLowerCase();
  if (/\b(football|calcio|serie a|premier|champions)\b/.test(value)) return "football";
  if (/\b(tennis|atp|wta|wimbledon)\b/.test(value)) return "tennis";
  if (/\b(basket|basketball|nba|eurolega)\b/.test(value)) return "basketball";
  if (/\b(formula|f1|motori|motor)\b/.test(value)) return "formula1";
  return sport;
}

export async function extractNewsImage(item: NewsImageItem, sourceUrl: string, sport?: string, source?: string): Promise<ExtractedNewsImage> {
  const baseUrl = safeImageUrl(sourceUrl);

  const direct = firstImageCandidate(item.image, baseUrl) ?? firstImageCandidate(item.imageUrl, baseUrl);
  if (direct) return { imageUrl: direct, imageSource: "rss-image" };

  const enclosure = firstImageCandidate(item.enclosure, baseUrl);
  if (enclosure && (isImageUrl(enclosure) || item.enclosure?.type?.startsWith("image/"))) {
    return { imageUrl: enclosure, imageSource: "enclosure" };
  }

  const enclosureLink = safeImageUrl(item.enclosure?.link, baseUrl);
  if (enclosureLink && (isImageUrl(enclosureLink) || item.enclosure?.type?.startsWith("image/"))) {
    return { imageUrl: enclosureLink, imageSource: "enclosure" };
  }

  const mediaContent = firstImageCandidate(item["media:content"], baseUrl);
  if (mediaContent) return { imageUrl: mediaContent, imageSource: "media-content" };

  const mediaThumbnail = firstImageCandidate(item["media:thumbnail"], baseUrl);
  if (mediaThumbnail) return { imageUrl: mediaThumbnail, imageSource: "media-thumbnail" };

  const contentImage =
    imageFromHtml(item.content, baseUrl) ??
    imageFromHtml(item.description, baseUrl) ??
    imageFromHtml(item.summary, baseUrl) ??
    imageFromHtml(item.contentSnippet, baseUrl);
  if (contentImage) return { imageUrl: contentImage, imageSource: "content-img" };

  const ogImage = await getOgImage(baseUrl);
  if (ogImage) return { imageUrl: ogImage, imageSource: "og-image" };

  return {
    imageUrl: getNewsCoverFallbackPath(sourceForFallback(sport, source)),
    imageSource: "fallback"
  };
}
