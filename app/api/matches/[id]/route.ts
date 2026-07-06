import { NextResponse } from "next/server";
import { getMatchDetail } from "@/lib/providers/sports";

export const revalidate = 300;

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  const detail = await getMatchDetail(decodeURIComponent(params.id));

  if (!detail) {
    return NextResponse.json({ message: "Match not found" }, { status: 404 });
  }

  return NextResponse.json(detail, {
    headers: {
      "Cache-Control": detail.isLive ? "s-maxage=120, stale-while-revalidate=60" : "s-maxage=300, stale-while-revalidate=300"
    }
  });
}
