import { NextResponse } from "next/server";
import { getMatchDetail } from "@/lib/providers/sports";

export const revalidate = 120;

type Params = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  const detail = await getMatchDetail(decodeURIComponent(params.id));

  if (!detail) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 });
  }

  const isDevelopment = process.env.NODE_ENV !== "production";
  const response = {
    event: detail,
    score: detail.sport === "tennis" ? detail.tennisScore ?? null : null,
    statistics: detail.stats ?? [],
    h2h: detail.preMatchInsights ?? [],
    recentForm: [],
    rawCapabilities: isDevelopment
      ? {
          sport: detail.sport,
          hasTennisScore: Boolean(detail.tennisScore),
          hasTimeline: Boolean(detail.timeline?.length),
          hasStatistics: Boolean(detail.stats?.length),
          hasH2H: Boolean(detail.preMatchInsights?.length)
        }
      : undefined
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": detail.isLive ? "s-maxage=120, stale-while-revalidate=60" : "s-maxage=300, stale-while-revalidate=300"
    }
  });
}
