import type { NewsItem } from "@/lib/types";

const gradients: Record<string, string> = {
  football: "from-emerald-400/28 via-cyan-400/18 to-sky-500/24",
  calcio: "from-emerald-400/28 via-cyan-400/18 to-sky-500/24",
  tennis: "from-lime-300/30 via-court-400/18 to-emerald-500/22",
  basketball: "from-orange-400/30 via-flare-400/20 to-purple-500/24",
  basket: "from-orange-400/30 via-flare-400/20 to-purple-500/24",
  formula1: "from-red-400/28 via-flare-400/18 to-court-400/24",
  motori: "from-red-400/28 via-flare-400/18 to-court-400/24"
};

export function getNewsGradientByCategory(category?: string) {
  const key = String(category ?? "").toLowerCase();
  return gradients[key] ?? "from-court-400/28 via-purple-400/18 to-pulse-400/22";
}

export function getNewsCoverFallbackPath(category?: string) {
  const key = String(category ?? "").toLowerCase();
  if (key === "football" || key === "calcio") return "/news-covers/football.jpg";
  if (key === "basketball" || key === "basket") return "/news-covers/basketball.jpg";
  if (key === "tennis") return "/news-covers/tennis.jpg";
  if (key === "formula1" || key === "motori") return "/news-covers/motors.jpg";
  return "/news-covers/default.jpg";
}

export function getNewsCoverImage(news: NewsItem) {
  const rawUrl = news.imageUrl?.trim();
  if (!rawUrl) return undefined;

  if (rawUrl.startsWith("/")) return rawUrl;

  try {
    const url = new URL(rawUrl.startsWith("//") ? `https:${rawUrl}` : rawUrl);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
