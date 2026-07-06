import type { SportEvent } from "@/lib/types";
import { normalizeDateParam, toDateKey, toValidDate } from "@/lib/utils/date";

type CacheEntry = {
  expiresAt: number;
  events: SportEvent[];
};

const cache = new Map<string, CacheEntry>();

export function getTrendingCacheKey({
  date,
  locale = "it-IT",
  enabledSports
}: {
  date?: string;
  locale?: string;
  enabledSports: string[];
}) {
  return [
    normalizeDateParam(date),
    locale,
    enabledSports.slice().sort().join(",")
  ].join(":");
}

function endOfLocalDay(date: string) {
  const value = toValidDate(`${date}T23:59:59`);
  return value.getTime();
}

export function getTrendingCacheTtlMs(date?: string) {
  const normalizedDate = normalizeDateParam(date);
  const now = Date.now();
  const today = toDateKey();

  if (normalizedDate === today) {
    return Math.max(60 * 60 * 1000, endOfLocalDay(normalizedDate) - now);
  }

  return 12 * 60 * 60 * 1000;
}

export function getCachedTrendingEvents(key: string) {
  const entry = cache.get(key);
  if (!entry) return undefined;

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return entry.events;
}

export function setCachedTrendingEvents(key: string, events: SportEvent[], ttlMs: number) {
  cache.set(key, {
    events,
    expiresAt: Date.now() + ttlMs
  });
}
