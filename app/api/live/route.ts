import { NextResponse } from "next/server";
import { getLiveSportsEvents } from "@/lib/providers/sports/liveSportsProvider";

export const revalidate = 120;
export const dynamic = "force-dynamic";

export async function GET() {
  const live = await getLiveSportsEvents();

  return NextResponse.json(live, {
    headers: {
      "Cache-Control": "s-maxage=120, stale-while-revalidate=60"
    }
  });
}
