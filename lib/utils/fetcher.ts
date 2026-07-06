type FetchOptions = RequestInit & {
  revalidate?: number;
  timeoutMs?: number;
  cacheKey?: string;
  cacheTtlMs?: number;
};

const memoryCache = new Map<string, { expiresAt: number; value: unknown }>();
const loggedFallbacks = new Set<string>();

async function withTimeout<T>(task: (signal: AbortSignal) => Promise<T>, timeoutMs = 6500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await task(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { revalidate, timeoutMs, cacheKey, cacheTtlMs, ...fetchOptions } = options;
  const key = cacheKey ?? url;

  if (cacheTtlMs) {
    const cached = memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;
  }

  const value = await withTimeout(async (signal) => {
    const response = await fetch(url, {
      ...fetchOptions,
      signal,
      next: revalidate ? { revalidate } : undefined
    } as RequestInit & { next?: { revalidate: number } });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }, timeoutMs);

  if (cacheTtlMs) {
    memoryCache.set(key, { expiresAt: Date.now() + cacheTtlMs, value });
  }

  return value;
}

export async function fetchText(url: string, options: FetchOptions = {}) {
  const { revalidate, timeoutMs, cacheKey, cacheTtlMs, ...fetchOptions } = options;
  const key = cacheKey ?? url;

  if (cacheTtlMs) {
    const cached = memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value as string;
  }

  const value = await withTimeout(async (signal) => {
    const response = await fetch(url, {
      ...fetchOptions,
      signal,
      next: revalidate ? { revalidate } : undefined
    } as RequestInit & { next?: { revalidate: number } });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.text();
  }, timeoutMs);

  if (cacheTtlMs) {
    memoryCache.set(key, { expiresAt: Date.now() + cacheTtlMs, value });
  }

  return value;
}

function sanitizeProviderMessage(message: string) {
  return message
    .replace(/([?&](?:APIkey|api_key|key|token)=)[^&\s]+/gi, "$1[redacted]")
    .replace(/(x-apisports-key["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, "$1[redacted]");
}

export function logProviderFallback(provider: string, error: unknown) {
  const rawMessage = error instanceof Error ? error.message : "Unknown provider error";
  const message = sanitizeProviderMessage(rawMessage);
  const key = `${provider}-${message}`;
  if (loggedFallbacks.has(key)) return;
  loggedFallbacks.add(key);
  console.warn(`[Plaee] ${provider} unavailable, using mock fallback: ${message}`);
}
