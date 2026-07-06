import { NextResponse } from "next/server";
import { getScores } from "@/lib/providers/sports";
import { normalizeDateParam } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Debug route available only in development" }, { status: 404 });
  }

  const url = new URL(request.url);
  const date = normalizeDateParam(url.searchParams.get("date") ?? "today");
  const events = await getScores({ sport: "tennis", date, noCache: true });
  const players = events.flatMap((event) => [
    {
      eventId: event.id,
      name: event.homeName,
      key: event.firstPlayerKey,
      image: event.firstPlayerImage ?? event.homeLogo,
      country: event.firstPlayerCountry,
      ranking: event.firstPlayerRanking,
      imageSource: event.firstPlayerImageSource ?? (event.homeLogo ? "fixture" : "fallback")
    },
    {
      eventId: event.id,
      name: event.awayName,
      key: event.secondPlayerKey,
      image: event.secondPlayerImage ?? event.awayLogo,
      country: event.secondPlayerCountry,
      ranking: event.secondPlayerRanking,
      imageSource: event.secondPlayerImageSource ?? (event.awayLogo ? "fixture" : "fallback")
    }
  ]);

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      date,
      events: events.length,
      playersWithKey: players.filter((player) => Boolean(player.key)).length,
      playersWithImage: players.filter((player) => Boolean(player.image)).length,
      fromFixture: players.filter((player) => player.imageSource === "fixture").length,
      fromPlayersLookup: players.filter((player) => player.imageSource === "players-lookup").length,
      fallback: players.filter((player) => player.imageSource === "fallback").length,
      sample: players.slice(0, 40)
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
