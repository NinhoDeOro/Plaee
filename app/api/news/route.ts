import { NextResponse } from "next/server";
import { getNews } from "@/lib/providers/news";

export const revalidate = 600;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sport = url.searchParams.get("sport") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const source = url.searchParams.get("source") ?? undefined;

  const items = await getNews({ sport, q, source });

  return NextResponse.json(items, {
    headers: {
      "Cache-Control": "s-maxage=600, stale-while-revalidate=300"
    }
  });
}
