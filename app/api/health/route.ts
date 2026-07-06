import { NextResponse } from "next/server";
import { getActiveNewsProviderName, hasNewsProviderKey, isRssNewsEnabled } from "@/lib/providers/news";
import { getActiveSportsProviderName, hasSportsProviderKey } from "@/lib/providers/sports";
import { getApiFootballStatus } from "@/lib/providers/sports/apiFootballProvider";

export const dynamic = "force-dynamic";

export async function GET() {
  const sportsProvider = getActiveSportsProviderName();
  const newsProvider = getActiveNewsProviderName();
  const isApiFootball = sportsProvider === "api-football" || sportsProvider === "api-sports";
  const hasApiSportsKey = Boolean(process.env.API_SPORTS_KEY);
  let apiFootballStatus:
    | {
        checked: boolean;
        ok: boolean;
        requests?: {
          current?: number;
          limitDay?: number;
        };
        subscription?: {
          plan?: string;
          active?: boolean;
        };
        error?: string;
      }
    | undefined;

  if (isApiFootball && hasApiSportsKey) {
    try {
      const status = await getApiFootballStatus();
      apiFootballStatus = {
        checked: true,
        ok: true,
        requests: {
          current: status.requests?.current,
          limitDay: status.requests?.limit_day
        },
        subscription: {
          plan: status.subscription?.plan,
          active: status.subscription?.active
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "API-FOOTBALL non raggiungibile";
      console.warn(`[Plaee] API-FOOTBALL status check failed: ${message}`);
      apiFootballStatus = {
        checked: true,
        ok: false,
        error: "status_check_failed"
      };
    }
  }

  return NextResponse.json({
    status: "ok",
    app: process.env.NEXT_PUBLIC_SITE_NAME ?? "Plaee",
    sportsProvider,
    newsProvider,
    apiFootball: {
      enabled: isApiFootball,
      baseUrl: process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io",
      hasApiSportsKey,
      status: apiFootballStatus ?? {
        checked: false,
        ok: false
      }
    },
    apiKeys: {
      apiSports: hasApiSportsKey,
      apiFootball: hasApiSportsKey,
      apiTennis: Boolean(process.env.API_TENNIS_KEY),
      apiBasketball: hasApiSportsKey,
      apiFormula1: hasApiSportsKey,
      theSportsDb: Boolean(process.env.THESPORTSDB_KEY),
      newsApi: Boolean(process.env.NEWS_API_KEY)
    },
    apiBaseUrls: {
      football: process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io",
      basketball: process.env.API_BASKETBALL_BASE_URL || "https://v1.basketball.api-sports.io",
      formula1: process.env.API_FORMULA1_BASE_URL || "https://v1.formula-1.api-sports.io",
      tennis: process.env.API_TENNIS_BASE_URL || "https://api.api-tennis.com/tennis/"
    },
    providerReady: {
      sports: hasSportsProviderKey(sportsProvider),
      news: hasNewsProviderKey(newsProvider)
    },
    rssNewsEnabled: isRssNewsEnabled(),
    checkedAt: new Date().toISOString()
  });
}
