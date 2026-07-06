import { NextResponse } from "next/server";
import { getNews } from "@/lib/providers/news";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Debug route available only in development" }, { status: 404 });
  }

  const items = await getNews();

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      items: items.slice(0, 40).map((item) => ({
        title: item.title,
        source: item.source,
        url: item.sourceUrl,
        imageUrl: item.imageUrl,
        imageSource: item.imageSource ?? "unknown",
        hasImage: Boolean(item.imageUrl)
      }))
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
