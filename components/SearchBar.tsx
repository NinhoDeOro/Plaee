"use client";

import { FormEvent, KeyboardEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { NewsItem, SportEvent } from "@/lib/types";
import {
  buildSearchSuggestions,
  buildTeamSearchIndex,
  normalizeSearchText,
  type SearchSuggestion
} from "@/lib/utils/search";
import { SearchOverlay } from "@/components/SearchOverlay";
import { cn } from "@/lib/utils/cn";

type SearchBarProps = {
  events?: SportEvent[];
  news?: NewsItem[];
  value?: string;
  onQueryChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  inputClassName?: string;
  compact?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
};

const RECENT_SEARCHES_KEY = "plaee:recent-searches";
const DEFAULT_PLACEHOLDER = "Cerca partite, campionati, squadre, giocatori e tanto altro";

function readRecentSearches() {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(value: string) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];

  const current = readRecentSearches();
  const next = [value.trim(), ...current.filter((item) => normalizeSearchText(item) !== normalized)].slice(0, 6);
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
}

export function SearchBar({
  events = [],
  news = [],
  value,
  onQueryChange,
  onSearch,
  className,
  inputClassName,
  compact = false,
  autoFocus = false,
  placeholder = DEFAULT_PLACEHOLDER
}: SearchBarProps) {
  const rootRef = useRef<HTMLFormElement>(null);
  const [internalValue, setInternalValue] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const query = value ?? internalValue;
  const deferredQuery = useDeferredValue(query);
  const teamIndex = useMemo(() => buildTeamSearchIndex(events), [events]);

  const suggestions = useMemo(
    () =>
      buildSearchSuggestions({
        query: deferredQuery,
        teamIndex,
        news,
        limit: 8
      }),
    [deferredQuery, news, teamIndex]
  );

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function setQuery(next: string) {
    if (value === undefined) setInternalValue(next);
    onQueryChange?.(next);
    setOpen(true);
  }

  function commitSearch(nextValue = query) {
    const trimmed = nextValue.trim();
    if (!trimmed) return;

    setRecentSearches(saveRecentSearch(trimmed));
    setOpen(false);
    if (onSearch) {
      onSearch(trimmed);
    } else {
      window.location.href = `/?q=${encodeURIComponent(trimmed)}`;
    }
  }

  function selectSuggestion(suggestion: SearchSuggestion) {
    setRecentSearches(saveRecentSearch(suggestion.query));
    setOpen(false);

    if (suggestion.kind === "match" || suggestion.kind === "news") {
      window.location.href = suggestion.href;
      return;
    }

    if (value === undefined) setInternalValue(suggestion.query);
    onQueryChange?.(suggestion.query);
    setOpen(false);
    if (onSearch) {
      onSearch(suggestion.query);
    } else {
      window.location.href = `/?q=${encodeURIComponent(suggestion.query)}`;
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (open && suggestions[activeIndex] && normalizeSearchText(deferredQuery) === normalizeSearchText(query)) {
      selectSuggestion(suggestions[activeIndex]);
      return;
    }
    commitSearch();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (suggestions.length ? (index + 1) % suggestions.length : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (suggestions.length ? (index - 1 + suggestions.length) % suggestions.length : 0));
    }
  }

  return (
    <form ref={rootRef} onSubmit={onSubmit} role="search" className={cn("relative w-full", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-500",
          compact ? "left-3 h-4 w-4" : "left-4 h-5 w-5"
        )}
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full border border-white/10 bg-white/[0.075] font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-court-400/50 focus:ring-2 focus:ring-court-400/20",
          compact ? "h-11 rounded-lg pl-10 pr-3 text-sm" : "h-12 rounded-xl pl-12 pr-4 text-sm",
          inputClassName
        )}
      />

      {open ? (
        <SearchOverlay
          query={query}
          suggestions={suggestions}
          recentSearches={recentSearches}
          activeIndex={activeIndex}
          onSelectSuggestion={selectSuggestion}
          onSelectRecent={(item) => {
            setQuery(item);
            commitSearch(item);
          }}
          onActiveIndexChange={setActiveIndex}
        />
      ) : null}
    </form>
  );
}
