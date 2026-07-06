import type { SportEvent } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type ScoreDisplayProps = {
  event: SportEvent;
  separator?: "colon" | "dash";
  centered?: boolean;
  large?: boolean;
};

export function ScoreDisplay({ event, separator = "colon", centered = false, large = false }: ScoreDisplayProps) {
  const hasScore = event.homeScore !== undefined || event.awayScore !== undefined;

  if (!hasScore) {
    return (
      <div className={cn("text-sm font-semibold text-slate-400", centered ? "text-center" : "text-right")}>
        VS
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid min-w-12 grid-cols-[1fr_auto_1fr] items-center text-lg font-black text-white",
        separator === "dash" ? "gap-0.5" : "gap-1",
        centered ? "mx-auto justify-center text-center" : "text-right",
        large && "text-3xl sm:text-4xl"
      )}
    >
      <span>{event.homeScore ?? "-"}</span>
      <span className={cn("text-slate-500", large ? "px-1 text-2xl sm:text-3xl" : "text-xs")}>
        {separator === "dash" ? "-" : ":"}
      </span>
      <span>{event.awayScore ?? "-"}</span>
    </div>
  );
}
