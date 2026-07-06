"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Circle, CircleDot, Flame, Trophy } from "lucide-react";
import { AppLogo } from "@/components/layout/AppLogo";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/live", label: "Live" },
  { href: "/news", label: "News" }
];

const sportItems = [
  { href: "/trending", label: "Trending", sport: "trending", icon: Flame },
  { href: "/sport/football", label: "Calcio", sport: "football", icon: Trophy },
  { href: "/sport/tennis", label: "Tennis", sport: "tennis", icon: CircleDot },
  { href: "/sport/basketball", label: "Basket", sport: "basketball", icon: Circle },
  { href: "/sport/formula1", label: "Motori", sport: "formula1", icon: Car }
];

export function AppHeader() {
  const pathname = usePathname();
  const [activeSport, setActiveSport] = useState("all");

  useEffect(() => {
    if (pathname.startsWith("/trending")) {
      setActiveSport("trending");
      return;
    }

    if (pathname.startsWith("/sport/football")) {
      setActiveSport("football");
      return;
    }

    if (pathname.startsWith("/sport/tennis")) {
      setActiveSport("tennis");
      return;
    }

    if (pathname.startsWith("/sport/basketball")) {
      setActiveSport("basketball");
      return;
    }

    if (pathname.startsWith("/sport/formula1") || pathname.startsWith("/sport/motors")) {
      setActiveSport("formula1");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setActiveSport(params.get("sport") ?? "trending");
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-field-950/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 overflow-hidden px-4 py-2 sm:px-6 lg:flex-nowrap lg:px-8">
        <Link href="/" className="flex shrink-0 items-center rounded-md" aria-label="Plaee home">
          <AppLogo compact />
        </Link>

        <nav aria-label="Sport" className="order-3 flex w-full min-w-0 max-w-full gap-2 overflow-x-auto scrollbar-hide lg:order-none lg:w-auto lg:flex-1">
          {sportItems.map((item) => {
            const Icon = item.icon;
            const active = activeSport === item.sport;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setActiveSport(item.sport)}
                className={cn(
                  "inline-flex min-w-max items-center gap-2 rounded-lg border px-3 py-2 text-sm font-black text-slate-300 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white",
                  active ? "border-court-400/40 bg-court-400/12 text-white" : "border-transparent bg-transparent"
                )}
              >
                {Icon ? <Icon className="h-4 w-4 text-court-300" aria-hidden /> : null}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <nav aria-label="Navigazione principale" className="ml-auto flex min-w-0 shrink-0 gap-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white",
                  active && "bg-white/10 text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
