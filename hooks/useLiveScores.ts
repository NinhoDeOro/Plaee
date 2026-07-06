"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SportEvent } from "@/lib/types";

type UseLiveScoresOptions = {
  initialEvents: SportEvent[];
  endpoint?: string;
  refreshIntervalMs: number;
};

export function useLiveScores({
  initialEvents,
  endpoint = "/api/scores?status=live",
  refreshIntervalMs
}: UseLiveScoresOptions) {
  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const endpointRef = useRef(endpoint);

  endpointRef.current = endpoint;

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpointRef.current, { signal });
      if (!response.ok) throw new Error("Live scores request failed");
      const data = (await response.json()) as SportEvent[];
      setEvents(data);
      setLastUpdated(new Date());
    } catch (refreshError) {
      if (!(refreshError instanceof DOMException && refreshError.name === "AbortError")) {
        setError("Impossibile aggiornare ora");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;

    function clearTimer() {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    }

    function startTimer() {
      clearTimer();
      if (document.hidden) return;
      timer = window.setInterval(() => refresh(controller.signal), refreshIntervalMs);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        clearTimer();
        return;
      }
      void refresh(controller.signal);
      startTimer();
    }

    startTimer();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearTimer();
      controller.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh, refreshIntervalMs]);

  return useMemo(
    () => ({
      events,
      loading,
      error,
      lastUpdated,
      refresh
    }),
    [error, events, lastUpdated, loading, refresh]
  );
}
